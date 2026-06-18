import type { AppData } from "./ridelog";

const GIS_SRC = "https://accounts.google.com/gsi/client";
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const BACKUP_FILE_NAME = "ridelog-pro-backup.json";
const MIME = "application/json";

type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type TokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
};

type GoogleOauth = {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
  }) => TokenClient;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleOauth;
      };
    };
  }
}

export function getGoogleClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
}

export function isGoogleDriveConfigured() {
  return Boolean(getGoogleClientId());
}

export async function backupToGoogleDrive(data: AppData) {
  const token = await requestDriveToken();
  const existing = await findBackupFile(token);
  const payload = JSON.stringify(
    {
      app: "RideLog Pro",
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    },
    null,
    2,
  );

  if (existing?.id) {
    return uploadMultipart(
      `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart&fields=id,modifiedTime`,
      token,
      { name: BACKUP_FILE_NAME },
      payload,
      "PATCH",
    );
  } else {
    return uploadMultipart(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime",
      token,
      { name: BACKUP_FILE_NAME, parents: ["appDataFolder"] },
      payload,
      "POST",
    );
  }
}

export async function restoreFromGoogleDrive(): Promise<AppData> {
  const token = await requestDriveToken();
  const existing = await findBackupFile(token);
  if (!existing?.id) {
    throw new Error("No Google Drive backup found yet.");
  }

  const response = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${existing.id}?alt=media`,
    token,
  );
  const backup = await response.json();
  return backup.data ?? backup;
}

export async function getGoogleDriveBackupInfo() {
  const token = await requestDriveToken();
  return findBackupFile(token);
}

async function requestDriveToken(): Promise<string> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("Missing VITE_GOOGLE_CLIENT_ID. Add it to your hosting environment first.");
  }

  await loadGoogleIdentityScript();
  const oauth = window.google?.accounts?.oauth2;
  if (!oauth) {
    throw new Error(
      "Google sign-in could not load. Check your internet connection and ad blockers.",
    );
  }

  return new Promise((resolve, reject) => {
    const client = oauth.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response) => {
        if (response.access_token) {
          resolve(response.access_token);
        } else {
          reject(
            new Error(response.error_description || response.error || "Google sign-in failed."),
          );
        }
      },
    });

    client.requestAccessToken({ prompt: "consent" });
  });
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Google sign-in script failed to load.")),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google sign-in script failed to load."));
    document.head.appendChild(script);
  });
}

async function findBackupFile(
  token: string,
): Promise<{ id: string; modifiedTime?: string } | null> {
  const params = new URLSearchParams({
    spaces: "appDataFolder",
    fields: "files(id,name,modifiedTime)",
    q: `name='${BACKUP_FILE_NAME}' and trashed=false`,
  });
  const response = await driveFetch(`https://www.googleapis.com/drive/v3/files?${params}`, token);
  const result = (await response.json()) as {
    files?: Array<{ id: string; modifiedTime?: string }>;
  };
  return result.files?.[0] ?? null;
}

async function uploadMultipart(
  url: string,
  token: string,
  metadata: Record<string, unknown>,
  payload: string,
  method: "POST" | "PATCH",
): Promise<{ id: string; modifiedTime?: string }> {
  const boundary = `ridelog_${Date.now()}`;
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${MIME}; charset=UTF-8`,
    "",
    payload,
    `--${boundary}--`,
  ].join("\r\n");

  const response = await driveFetch(url, token, {
    method,
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  return response.json();
}

async function driveFetch(url: string, token: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    let message = `Google Drive request failed (${response.status}).`;
    try {
      const error = await response.json();
      message = error.error?.message ?? message;
    } catch {
      // Keep the generic message if the body is not JSON.
    }
    throw new Error(message);
  }

  return response;
}
