export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "unauthorized";

let currentStatus: SyncStatus = "idle";
let errorMessage: string = "";
const listeners = new Set<(status: SyncStatus, error?: string) => void>();

export function getSyncStatus(): SyncStatus {
  return currentStatus;
}

export function getSyncError(): string {
  return errorMessage;
}

export function setSyncStatus(status: SyncStatus, error: string = "") {
  currentStatus = status;
  errorMessage = error;
  listeners.forEach((l) => l(status, error));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ridelog:sync_status", { detail: { status, error } }));
  }
}

export function subscribeToSyncStatus(listener: (status: SyncStatus, error?: string) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

import { useEffect, useState } from "react";

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus);
  const [error, setError] = useState<string>(getSyncError);

  useEffect(() => {
    return subscribeToSyncStatus((newStatus, newError) => {
      setStatus(newStatus);
      setError(newError || "");
    });
  }, []);

  return { status, error };
}
