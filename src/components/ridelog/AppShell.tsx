import { useState, useRef, useEffect, type ReactNode } from "react";
import { AppDataProvider, useAppDataStore, type Vehicle } from "@/lib/ridelog";
import { BottomNav } from "./BottomNav";
import { Card } from "./primitives";
import { Bike, Cloud, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useLocation } from "@tanstack/react-router";
import {
  isGoogleDriveConfigured,
  restoreFromGoogleDrive,
} from "@/lib/googleDrive";

/** Tab order used to compute slide direction */
const TAB_ORDER: Record<string, number> = {
  "/": 0,
  "/trips": 1,
  "/fuel": 2,
  "/insights": 3,
  "/settings": 4,
};

function getTabIndex(pathname: string) {
  return TAB_ORDER[pathname] ?? -1;
}

export function AppShell({ children }: { children: ReactNode }) {
  const store = useAppDataStore();
  const { data, ready, update } = store;
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const prevPathRef = useRef<string | null>(null);

  // Compute slide direction from tab order
  const prevIdx = prevPathRef.current !== null ? getTabIndex(prevPathRef.current) : -1;
  const curIdx = getTabIndex(location.pathname);
  const isFirstRender = prevPathRef.current === null;
  const animClass = isFirstRender
    ? ""
    : curIdx === -1 || prevIdx === -1
      ? "page-enter-fade"
      : curIdx >= prevIdx
        ? "page-enter-right"
        : "page-enter-left";

  // Track previous path after each render
  useEffect(() => {
    prevPathRef.current = location.pathname;
  });

  // Scroll content back to top on every route change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  if (!ready) {
    return <div className="fixed inset-0 bg-background" />;
  }

  if (!data.vehicle) {
    return (
      <Setup
        onComplete={(v) => update((d) => ({ ...d, vehicle: { ...v, createdAt: Date.now() } }))}
      />
    );
  }

  return (
    <AppDataProvider value={store}>
      {/*
        Fixed-viewport shell: the outer div locks to the screen dimensions so
        no layout shift occurs when pages with different content heights mount.
        The inner div scrolls independently — the bottom nav never moves.
      */}
      <div className="fixed inset-0 bg-background">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overflow-x-hidden"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom)" }}
        >
          {/* key forces remount on route change, replaying the CSS animation */}
          <div key={location.pathname} className={`mx-auto max-w-md ${animClass}`}>
            {children}
          </div>
        </div>
        <BottomNav />
      </div>
    </AppDataProvider>
  );
}

type GoogleState = "idle" | "loading" | "success" | "error";

function Setup({ onComplete }: { onComplete: (v: Omit<Vehicle, "createdAt">) => void }) {
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Omit<Vehicle, "createdAt">>({
    name: "",
    odometer: 0,
    tankCapacity: 5,
    expectedMileage: 45,
    monthlyBudget: 2000,
  });
  const [googleState, setGoogleState] = useState<GoogleState>("idle");
  const [googleError, setGoogleError] = useState<string>("");

  const steps = [
    { key: "name", label: "Vehicle Profile", hint: "e.g. Vespa GTS, Activa 6G", type: "text" as const },
    { key: "odometer", label: "Current odometer", hint: "kilometers", type: "number" as const },
    { key: "tankCapacity", label: "Tank capacity", hint: "litres", type: "number" as const },
    {
      key: "expectedMileage",
      label: "Expected mileage",
      hint: "km per litre",
      type: "number" as const,
    },
    {
      key: "monthlyBudget",
      label: "Monthly Fuel Budget",
      hint: "total per month",
      type: "number" as const,
    },
  ];

  const cur = steps[step];
  const value = (v as Record<string, string | number>)[cur.key];
  const valid = cur.type === "text" ? String(value).trim().length > 0 : Number(value) > 0;

  const goNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(v);
    }
  };

  async function handleGetFromGoogle() {
    setGoogleState("loading");
    setGoogleError("");
    try {
      const restored = await restoreFromGoogleDrive();
      if (restored.vehicle) {
        setGoogleState("success");
        // Brief success flash then complete setup with restored vehicle data
        setTimeout(() => {
          onComplete({
            name: restored.vehicle!.name,
            odometer: restored.vehicle!.odometer,
            tankCapacity: restored.vehicle!.tankCapacity,
            expectedMileage: restored.vehicle!.expectedMileage,
            monthlyBudget: restored.vehicle!.monthlyBudget,
          });
        }, 900);
      } else {
        setGoogleState("error");
        setGoogleError("No vehicle data found in your Google Drive backup.");
      }
    } catch (err: unknown) {
      setGoogleState("error");
      setGoogleError(
        err instanceof Error ? err.message : "Could not connect to Google Drive.",
      );
    }
  }

  const showGoogleButton = isGoogleDriveConfigured() && step === 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-6 pb-12 pt-16">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="relative mx-auto flex max-w-md flex-col gap-10">
        {/* Header */}
        <div className="flex items-center gap-3 fade-in-up">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Bike className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              RideLog Pro
            </p>
            <h1 className="text-lg font-semibold text-foreground">Quick setup</h1>
          </div>
        </div>

        {/* Step progress dots */}
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= step ? "bg-primary" : "bg-surface-elevated"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div key={cur.key} className="fade-in-up">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Step {step + 1} of {steps.length}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {cur.label}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 0
              ? "Tell us about your scooter or motorcycle to compute fuel consumption."
              : cur.hint}
          </p>

          {/* Input field */}
          <Card className="mt-6 p-0">
            <input
              autoFocus
              inputMode={cur.type === "number" ? "decimal" : "text"}
              type={cur.type}
              value={value === 0 && cur.type === "number" ? "" : String(value)}
              onChange={(e) =>
                setV((p) => ({
                  ...p,
                  [cur.key]: cur.type === "number" ? Number(e.target.value || 0) : e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && valid) {
                  goNext();
                }
              }}
              placeholder={
                step === 0 ? "Vehicle Name (e.g., Vespa GTS)" : cur.hint
              }
              className="num w-full bg-transparent px-6 py-7 text-4xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
            />
          </Card>

          {/* Get from Google — only on step 0, only when client ID is set */}
          {showGoogleButton && (
            <div className="mt-5 fade-in-up">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: "oklch(1 0 0 / 8%)" }} />
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  or get from Google
                </p>
                <div className="h-px flex-1" style={{ background: "oklch(1 0 0 / 8%)" }} />
              </div>

              <button
                id="get-from-google-btn"
                onClick={handleGetFromGoogle}
                disabled={googleState === "loading" || googleState === "success"}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/10 px-5 py-4 text-sm font-medium text-foreground transition-all active:scale-[0.97] disabled:opacity-60"
                style={{
                  background:
                    googleState === "success"
                      ? "oklch(0.72 0.17 145 / 0.15)"
                      : googleState === "error"
                        ? "oklch(0.7 0.22 25 / 0.1)"
                        : "var(--surface)",
                  boxShadow:
                    googleState === "idle"
                      ? "0 0 0 1px oklch(0.85 0.07 250 / 0.2), 0 4px 20px oklch(0.85 0.07 250 / 0.08)"
                      : "none",
                }}
              >
                {googleState === "loading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {googleState === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                )}
                {googleState === "error" && (
                  <AlertCircle className="h-4 w-4 text-danger" />
                )}
                {googleState === "idle" && (
                  <Cloud className="h-4 w-4 text-primary" />
                )}
                <span>
                  {googleState === "idle" && "Get from Google"}
                  {googleState === "loading" && "Connecting to Google…"}
                  {googleState === "success" && "Backup restored!"}
                  {googleState === "error" && "Try again"}
                </span>
              </button>

              {googleState === "error" && googleError && (
                <p className="mt-2 text-center text-xs text-danger/80">{googleError}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-auto flex items-center justify-between gap-3">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="rounded-2xl px-5 py-3 text-sm font-medium text-muted-foreground disabled:opacity-30"
          >
            Back
          </button>
          <button
            disabled={!valid}
            onClick={goNext}
            className="flex-1 rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-all active:scale-[0.97] disabled:opacity-40"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            {step < steps.length - 1 ? "Continue" : "Start riding"}
          </button>
        </div>
      </div>
    </div>
  );
}
