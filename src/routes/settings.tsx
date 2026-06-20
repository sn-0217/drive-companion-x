import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/ridelog/AppShell";
import { Card, SectionHeader, EmptyState } from "@/components/ridelog/primitives";
import { useAppData, uid, exportJson, importJson, saveData } from "@/lib/ridelog";
import {
  backupToGoogleDrive,
  getGoogleDriveBackupInfo,
  isGoogleDriveConfigured,
  restoreFromGoogleDrive,
} from "@/lib/googleDrive";
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
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
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
        <Card className="space-y-3">
          <GoogleDriveSync />
          <Divider />
          <button
            onClick={() => {
              const blob = new Blob([exportJson(data)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `ridelog-backup-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex w-full items-center justify-between rounded-2xl bg-surface-elevated px-4 py-3 hairline"
          >
            <span className="flex items-center gap-3 text-sm text-foreground">
              <Download className="h-4 w-4 text-primary" /> Export backup
            </span>
            <span className="text-xs text-muted-foreground">.json</span>
          </button>
          <label className="flex w-full cursor-pointer items-center justify-between rounded-2xl bg-surface-elevated px-4 py-3 hairline">
            <span className="flex items-center gap-3 text-sm text-foreground">
              <Upload className="h-4 w-4 text-primary" /> Restore backup
            </span>
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
          <button
            onClick={() => {
              if (confirm("Reset all data? This cannot be undone.")) {
                saveData({ vehicle: null, fuel: [], trips: [], maintenance: [] });
              }
            }}
            className="flex w-full items-center gap-3 rounded-2xl bg-surface-elevated px-4 py-3 text-sm text-danger hairline"
          >
            <Trash2 className="h-4 w-4" /> Reset everything
          </button>
        </Card>
      </div>

      <p className="mt-8 text-center text-[11px] text-muted-foreground/70">
        RideLog Pro · Offline-first · v1.0
      </p>
    </div>
  );
}

function GoogleDriveSync() {
  const { data } = useAppData();
  const [busy, setBusy] = useState<"backup" | "restore" | "check" | null>(null);
  const [message, setMessage] = useState("");
  const [lastBackupAt, setLastBackupAt] = useState("");
  const configured = isGoogleDriveConfigured();

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
    <div className="space-y-3">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Cloud className="h-4 w-4 text-primary" /> Google Drive sync
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Stores one hidden backup file in Google Drive app data. Free, private to this app.
        </p>
      </div>

      {configured ? (
        <div className="flex items-center gap-2 rounded-2xl bg-success/10 px-4 py-3 text-xs text-success hairline">
          <CheckCircle2 className="h-4 w-4" /> Google sync is configured
        </div>
      ) : (
        <div className="rounded-2xl bg-warning/10 px-4 py-3 text-xs text-warning hairline">
          Add <span className="num">VITE_GOOGLE_CLIENT_ID</span> to enable Google sync. Create a
          free OAuth Web client in Google Cloud and allow this app's URL.
        </div>
      )}

      {lastBackupAt && (
        <p className="text-xs text-muted-foreground">
          Last backup:{" "}
          <span className="num text-foreground">{new Date(lastBackupAt).toLocaleString()}</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={!configured || busy !== null}
          onClick={() => run("backup")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {busy === "backup" ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Cloud className="h-4 w-4" />
          )}
          {busy === "backup" ? "Backing up..." : "Backup"}
        </button>
        <button
          disabled={!configured || busy !== null}
          onClick={() => run("restore")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-surface-elevated px-4 py-3 text-sm font-semibold text-foreground hairline disabled:opacity-40"
        >
          <RefreshCw className={`h-4 w-4 ${busy === "restore" ? "animate-spin" : ""}`} />
          {busy === "restore" ? "Restoring..." : "Restore"}
        </button>
      </div>

      <button
        disabled={!configured || busy !== null}
        onClick={() => run("check")}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-elevated px-4 py-3 text-xs font-medium text-muted-foreground hairline disabled:opacity-40"
      >
        {busy === "check" && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
        {busy === "check" ? "Checking cloud backup..." : "Check cloud backup"}
      </button>

      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
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
