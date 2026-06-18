import { useState, type ReactNode } from "react";
import { useAppData, type Vehicle } from "@/lib/ridelog";
import { BottomNav } from "./BottomNav";
import { Card } from "./primitives";
import { Bike } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const { data, ready, update } = useAppData();

  if (!ready) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!data.vehicle) {
    return (
      <Setup
        onComplete={(v) =>
          update((d) => ({ ...d, vehicle: { ...v, createdAt: Date.now() } }))
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-28">{children}</div>
      <BottomNav />
    </div>
  );
}

function Setup({ onComplete }: { onComplete: (v: Omit<Vehicle, "createdAt">) => void }) {
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Omit<Vehicle, "createdAt">>({
    name: "",
    odometer: 0,
    tankCapacity: 5,
    expectedMileage: 45,
    monthlyBudget: 2000,
  });

  const steps = [
    { key: "name", label: "Name your ride", hint: "e.g. Activa 6G", type: "text" as const },
    { key: "odometer", label: "Current odometer", hint: "kilometers", type: "number" as const },
    { key: "tankCapacity", label: "Tank capacity", hint: "litres", type: "number" as const },
    { key: "expectedMileage", label: "Expected mileage", hint: "km per litre", type: "number" as const },
    { key: "monthlyBudget", label: "Monthly fuel budget", hint: "total per month", type: "number" as const },
  ];

  const cur = steps[step];
  const value = (v as Record<string, string | number>)[cur.key];
  const valid = cur.type === "text" ? String(value).trim().length > 0 : Number(value) > 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-6 pb-12 pt-16">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="relative mx-auto flex max-w-md flex-col gap-10">
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

        <div key={cur.key} className="fade-in-up">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Step {step + 1} of {steps.length}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {cur.label}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{cur.hint}</p>

          <Card className="mt-8 p-0">
            <input
              autoFocus
              inputMode={cur.type === "number" ? "decimal" : "text"}
              type={cur.type}
              value={value === 0 && cur.type === "number" ? "" : String(value)}
              onChange={(e) =>
                setV((p) => ({
                  ...p,
                  [cur.key]:
                    cur.type === "number" ? Number(e.target.value || 0) : e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && valid) {
                  step < steps.length - 1 ? setStep(step + 1) : onComplete(v);
                }
              }}
              placeholder={cur.hint}
              className="num w-full bg-transparent px-6 py-7 text-4xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
            />
          </Card>
        </div>

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
            onClick={() => (step < steps.length - 1 ? setStep(step + 1) : onComplete(v))}
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
