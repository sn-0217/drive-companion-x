import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, SectionHeader, EmptyState } from "@/components/ridelog/primitives";
import { useAppData, uid, exportJson, importJson, saveData } from "@/lib/ridelog";
import { cn } from "@/lib/utils";
import {
  backupToGoogleDrive,
  getGoogleDriveBackupInfo,
  isGoogleDriveConfigured,
  restoreFromGoogleDrive,
  getAutoSyncEnabled,
  setAutoSyncEnabled,
  requestDriveToken,
  getCachedToken,
} from "@/lib/googleDrive";
import { setSyncStatus } from "@/lib/syncState";
import {
  CheckCircle2,
  Download,
  Upload,
  Plus,
  Wrench,
  Trash2,
  Cloud,
  RefreshCw,
} from "lucide-react";
import { IllustrationMaintenance } from "@/components/ridelog/illustrations";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · RideLog Pro" },
      {
        name: "description",
        content: "Vehicle config, maintenance reminders, backup and restore.",
      },
      { property: "og:title", content: "Settings · RideLog Pro" },
      {
        property: "og:description",
        content: "Tune your vehicle, manage maintenance, export your data.",
      },
    ],
  }),
  component: SettingsPage,
});

const MAINT_PRESETS = ["Service", "Oil Change", "Tyre Change", "Insurance", "PUC"] as const;

function SettingsPage() {
  const { data, update } = useAppData();
  const v = data.vehicle!;

  const setField = (k: keyof typeof v, val: string | number) =>
    update((d) => ({ ...d, vehicle: { ...d.vehicle!, [k]: val } }));

  return (
    <div className="px-5 pt-12 pb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
      <p className="text-sm text-muted-foreground">Vehicle, maintenance, data.</p>

      {/* Vehicle */}
      <div className="mt-5 space-y-3">
        <SectionHeader title="Vehicle" />
        <Card className="space-y-3">
          <Row label="Name">
            <input
              value={v.name}
              onChange={(e) => setField("name", e.target.value)}
              className="num bg-transparent text-right text-base font-semibold text-foreground outline-none"
            />
          </Row>
          <Divider />
          <Row label="Tank capacity (L)">
            <NumIn value={v.tankCapacity} onChange={(n) => setField("tankCapacity", n)} />
          </Row>
          <Divider />
          <Row label="Expected mileage (km/L)">
            <NumIn value={v.expectedMileage} onChange={(n) => setField("expectedMileage", n)} />
          </Row>
          <Divider />
          <Row label="Monthly budget">
            <NumIn value={v.monthlyBudget} onChange={(n) => setField("monthlyBudget", n)} />
          </Row>
          <Divider />
          <Row label="Odometer baseline">
            <NumIn value={v.odometer} onChange={(n) => setField("odometer", n)} />
          </Row>
        </Card>
      </div>

      {/* Maintenance */}
      <div className="mt-8 space-y-3">
        <SectionHeader title="Maintenance" />
        <MaintenanceList />
      </div>

      {/* Data */}
      <div className="mt-8 space-y-3">
        <SectionHeader title="Data" />
        <GoogleDriveSync />
      </div>

      <p className="mt-8 text-center text-[11px] text-muted-foreground/70">
        RideLog Pro · Offline-first · v1.0
      </p>
    </div>
  );
}

interface ActionRowProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColorClass?: string;
  label: string;
  description?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

function ActionRow({
  icon: Icon,
  iconColorClass = "bg-primary/10 text-primary",
  label,
  description,
  action,
  onClick,
  danger,
}: ActionRowProps) {
  const content = (
    <div className="flex items-center justify-between py-1.5 w-full">
      <div className="flex items-center gap-3.5">
        <span className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
          danger ? "bg-danger/10 text-danger" : iconColorClass
        )}>
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="text-left">
          <p className={cn("text-sm font-semibold", danger ? "text-danger" : "text-foreground")}>{label}</p>
          {description && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
        </div>
      </div>
      {action && <div className="flex items-center pl-3">{action}</div>}
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left outline-none block active:opacity-75 transition-opacity">
        {content}
      </button>
    );
  }
  return <div className="w-full">{content}</div>;
}

function GoogleDriveSync() {
  const { data } = useAppData();
  const [busy, setBusy] = useState<"backup" | "restore" | "check" | null>(null);
  const [message, setMessage] = useState("");
  const [lastBackupAt, setLastBackupAt] = useState("");
  const [autoSync, setAutoSync] = useState(getAutoSyncEnabled());
  const configured = isGoogleDriveConfigured();

  const handleToggleAutoSync = async () => {
    if (autoSync) {
      setAutoSyncEnabled(false);
      setAutoSync(false);
      setSyncStatus("idle");
      setMessage("Auto-sync disabled.");
    } else {
      setBusy("backup");
      setMessage("Requesting Google authorization...");
      try {
        await requestDriveToken({ forcePrompt: true });
        setAutoSyncEnabled(true);
        setAutoSync(true);
        setSyncStatus("syncing");
        const info = await backupToGoogleDrive(data);
        const updatedAt = info.modifiedTime ?? new Date().toISOString();
        setLastBackupAt(updatedAt);
        setSyncStatus("synced");
        setTimeout(() => setSyncStatus("idle"), 2000);
        setMessage("Auto-sync active · First backup successful.");
      } catch (err) {
        console.error("Failed to enable auto-sync:", err);
        setAutoSyncEnabled(false);
        setAutoSync(false);
        setSyncStatus("idle");
        setMessage(err instanceof Error ? err.message : "Authorization failed.");
      } finally {
        setBusy(null);
      }
    }
  };

  const run = async (action: "backup" | "restore" | "check") => {
    setBusy(action);
    setMessage(
      action === "backup"
        ? "Opening Google sign-in..."
        : action === "restore"
          ? "Opening Google sign-in..."
          : "Checking Google Drive...",
    );
    try {
      if (action === "backup") {
        const info = await backupToGoogleDrive(data);
        const updatedAt = info.modifiedTime ?? new Date().toISOString();
        setLastBackupAt(updatedAt);
        setMessage(`Backup successful · ${new Date(updatedAt).toLocaleString()}`);
      } else if (action === "restore") {
        if (!confirm("Restore from Google Drive? This will replace local RideLog data.")) return;
        const cloudData = await restoreFromGoogleDrive();
        saveData(importJson(JSON.stringify(cloudData)));
        setMessage("Restore successful. Your local data was updated.");
      } else {
        const info = await getGoogleDriveBackupInfo();
        if (info?.modifiedTime) {
          setLastBackupAt(info.modifiedTime);
          setMessage(`Last cloud backup · ${new Date(info.modifiedTime).toLocaleString()}`);
        } else {
          setLastBackupAt("");
          setMessage("No Google Drive backup found yet.");
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google Drive sync failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="space-y-4">
      {/* If Google Drive is not configured, show warning block */}
      {!configured && (
        <div className="rounded-2xl bg-warning/10 px-4 py-3.5 text-xs text-warning hairline mb-1 leading-relaxed">
          Add <span className="num">VITE_GOOGLE_CLIENT_ID</span> to enable Google sync. Create a
          free OAuth Web client in Google Cloud and allow this app's URL.
        </div>
      )}

      {configured && (
        <>
          {/* Header Row */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2.5">
              <Cloud className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Google Drive Sync</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-success/10 text-success border border-success/15">
              Configured
            </span>
          </div>
          <Divider />

          {/* Auto Sync Toggle */}
          <ActionRow
            icon={Cloud}
            label="Auto-sync changes"
            description="Automatically backup logs in the background"
            action={
              <button
                disabled={busy !== null}
                onClick={handleToggleAutoSync}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                  autoSync ? "bg-primary" : "bg-muted hairline"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoSync ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            }
          />
          <Divider />

          {/* Cloud Backup */}
          <ActionRow
            icon={Upload}
            label="Cloud Backup"
            description={
              lastBackupAt
                ? `Last synced: ${new Date(lastBackupAt).toLocaleString()}`
                : "No backup found yet"
            }
            action={
              <button
                disabled={busy !== null}
                onClick={() => run("backup")}
                className="rounded-full bg-surface-elevated border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-elevated/80 transition active:scale-95 disabled:opacity-55 flex items-center gap-1.5 cursor-pointer"
              >
                {busy === "backup" ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <Cloud className="h-3.5 w-3.5 text-primary" />
                )}
                {busy === "backup" ? "Backing up..." : "Backup now"}
              </button>
            }
          />
          <Divider />

          {/* Cloud Restore */}
          <ActionRow
            icon={Download}
            label="Cloud Restore"
            description="Replace local logs with cloud backup"
            action={
              <button
                disabled={busy !== null}
                onClick={() => run("restore")}
                className="rounded-full bg-surface-elevated border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-elevated/80 transition active:scale-95 disabled:opacity-55 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 text-primary ${busy === "restore" ? "animate-spin" : ""}`}
                />
                {busy === "restore" ? "Restoring..." : "Restore"}
              </button>
            }
          />
          <Divider />

          {/* Check Cloud Status */}
          <ActionRow
            icon={RefreshCw}
            label="Verify cloud backup"
            description="Verify current backup status in Google Drive"
            action={
              <button
                disabled={busy !== null}
                onClick={() => run("check")}
                className="rounded-full bg-surface-elevated border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-elevated/80 transition active:scale-95 disabled:opacity-55 flex items-center gap-1.5 cursor-pointer"
              >
                {busy === "check" && <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />}
                Check
              </button>
            }
          />
          <Divider />
        </>
      )}

      {/* Local Export */}
      <ActionRow
        icon={Download}
        iconColorClass="bg-primary/10 text-primary"
        label="Export to file"
        description="Download your data as a local JSON file"
        onClick={() => {
          const blob = new Blob([exportJson(data)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `ridelog-backup-${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}
        action={
          <span className="text-xs num text-muted-foreground bg-surface-elevated px-2.5 py-1 rounded-lg hairline">
            .json
          </span>
        }
      />
      <Divider />

      {/* Local Import */}
      <label className="block cursor-pointer">
        <ActionRow
          icon={Upload}
          iconColorClass="bg-primary/10 text-primary"
          label="Import from file"
          description="Load logs from a previously saved JSON file"
          action={
            <span className="text-xs text-muted-foreground bg-surface-elevated px-2.5 py-1 rounded-lg hairline">
              Upload
            </span>
          }
        />
        <input
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const text = await f.text();
              saveData(importJson(text));
            } catch {
              alert("Invalid backup file");
            }
          }}
        />
      </label>
      <Divider />

      {/* Reset everything */}
      <ActionRow
        icon={Trash2}
        label="Reset everything"
        description="Delete all logs, vehicle configurations, and profile"
        onClick={() => {
          if (confirm("Reset all data? This cannot be undone.")) {
            saveData({ vehicle: null, fuel: [], trips: [], maintenance: [] });
          }
        }}
        danger
      />
      {message && <p className="text-[11px] text-muted-foreground mt-2">{message}</p>}
    </Card>
  );
}
function MaintenanceList() {
  const { data, update } = useAppData();
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<string>(MAINT_PRESETS[0]);
  const [intervalKm, setIntervalKm] = useState("");
  const [intervalDays, setIntervalDays] = useState("");
  const [lastOdo, setLastOdo] = useState("");

  return (
    <>
      {data.maintenance.length === 0 && !adding && (
        <EmptyState
          illustration={<IllustrationMaintenance />}
          title="No reminders yet"
          hint="Track service intervals, oil changes, tyres, insurance and more."
        />
      )}
      {data.maintenance.map((m) => {
        const dueIn =
          m.intervalKm && m.lastOdo
            ? m.lastOdo + m.intervalKm - (data.vehicle?.odometer ?? 0)
            : null;
        return (
          <Card key={m.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warning/15 text-warning">
                <Wrench className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{m.type}</p>
                <p className="text-xs text-muted-foreground">
                  {dueIn !== null
                    ? `Due in ${Math.max(0, dueIn).toLocaleString()} km`
                    : m.intervalDays
                      ? `Every ${m.intervalDays} days`
                      : "Reminder set"}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                update((d) => ({
                  ...d,
                  maintenance: d.maintenance.filter((x) => x.id !== m.id),
                }))
              }
              className="text-xs text-muted-foreground/70 hover:text-danger"
            >
              Delete
            </button>
          </Card>
        );
      })}

      {adding ? (
        <Card className="space-y-3">
          <Row label="Type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-transparent text-right text-sm text-foreground outline-none"
            >
              {MAINT_PRESETS.map((p) => (
                <option key={p} value={p} className="bg-surface">
                  {p}
                </option>
              ))}
            </select>
          </Row>
          <Divider />
          <Row label="Every (km)">
            <input
              type="number"
              inputMode="decimal"
              value={intervalKm}
              onChange={(e) => setIntervalKm(e.target.value)}
              className="num w-24 bg-transparent text-right text-base font-semibold text-foreground outline-none"
              placeholder="—"
            />
          </Row>
          <Divider />
          <Row label="Every (days)">
            <input
              type="number"
              inputMode="decimal"
              value={intervalDays}
              onChange={(e) => setIntervalDays(e.target.value)}
              className="num w-24 bg-transparent text-right text-base font-semibold text-foreground outline-none"
              placeholder="—"
            />
          </Row>
          <Divider />
          <Row label="Last done @ odo">
            <input
              type="number"
              inputMode="decimal"
              value={lastOdo}
              onChange={(e) => setLastOdo(e.target.value)}
              className="num w-24 bg-transparent text-right text-base font-semibold text-foreground outline-none"
              placeholder="—"
            />
          </Row>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setAdding(false)}
              className="flex-1 rounded-2xl bg-surface-elevated px-4 py-3 text-sm text-muted-foreground hairline"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                update((d) => ({
                  ...d,
                  maintenance: [
                    ...d.maintenance,
                    {
                      id: uid(),
                      type,
                      intervalKm: intervalKm ? Number(intervalKm) : undefined,
                      intervalDays: intervalDays ? Number(intervalDays) : undefined,
                      lastOdo: lastOdo ? Number(lastOdo) : undefined,
                      lastDate: Date.now(),
                    },
                  ],
                }));
                setAdding(false);
                setIntervalKm("");
                setIntervalDays("");
                setLastOdo("");
              }}
              className="flex-[2] rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              Save reminder
            </button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm font-semibold text-foreground hairline"
        >
          <Plus className="h-4 w-4 text-primary" /> Add reminder
        </button>
      )}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
function Divider() {
  return <div className="h-px bg-border" />;
}
function NumIn({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(Number(e.target.value || 0))}
      className="num w-28 bg-transparent text-right text-base font-semibold text-foreground outline-none"
    />
  );
}
