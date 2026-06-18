import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/ridelog/AppShell";
import { Card, Stat } from "@/components/ridelog/primitives";
import {
  useAppData,
  currentOdometer,
  fuelRemaining,
  estimatedRange,
  todaysDistance,
  averageMileage,
  monthlySpend,
  smartInsight,
} from "@/lib/ridelog";
import { Sparkles, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RideLog Pro — Your offline ride companion" },
      {
        name: "description",
        content:
          "Premium offline-first dashboard for scooter and motorcycle owners. Track odometer, fuel, mileage, range and rides with zero login.",
      },
      { property: "og:title", content: "RideLog Pro — Your offline ride companion" },
      {
        property: "og:description",
        content:
          "Turn your scooter or motorcycle into a smart vehicle. Offline, no login, no ads.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

function Dashboard() {
  const { data } = useAppData();
  const v = data.vehicle!;
  const odo = currentOdometer(data);
  const fuel = fuelRemaining(data);
  const range = estimatedRange(data);
  const today = todaysDistance(data);
  const mpg = averageMileage(data);
  const spend = monthlySpend(data);
  const remainingBudget = Math.max(0, v.monthlyBudget - spend);
  const insight = smartInsight(data);
  const tankPct = v.tankCapacity > 0 ? Math.min(1, fuel / v.tankCapacity) : 0;

  return (
    <div className="px-5 pt-12">
      {/* Header */}
      <div className="flex items-center justify-between fade-in-up">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {v.name}
          </p>
          <p className="text-sm text-foreground/80">Good ride ahead</p>
        </div>
        <span className="flex h-9 items-center gap-2 rounded-full bg-surface px-3 text-[11px] text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Offline
        </span>
      </div>

      {/* Hero odometer */}
      <Card className="mt-6 overflow-hidden p-7 fade-in-up" >
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
          style={{ background: "var(--gradient-hero)" }}
        />
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Total Distance
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="num text-[64px] font-semibold leading-none text-foreground count-pulse">
            {odo.toLocaleString()}
          </span>
          <span className="text-base text-muted-foreground">km</span>
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Tank · {fuel.toFixed(2)} L of {v.tankCapacity} L</span>
            <span>{Math.round(tankPct * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-elevated">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${Math.max(4, tankPct * 100)}%`, boxShadow: "var(--shadow-glow)" }}
            />
          </div>
        </div>
      </Card>

      {/* Insight */}
      <Card className="mt-4 flex items-center gap-3 fade-in-up">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Smart insight
          </p>
          <p className="text-sm text-foreground">{insight}</p>
        </div>
      </Card>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 fade-in-up">
        <Stat label="Estimated Range" value={range.toFixed(0)} unit="km" accent="primary" />
        <Stat label="Today" value={today.toFixed(1)} unit="km" />
        <Stat
          label="Avg Mileage"
          value={mpg ? mpg.toFixed(1) : "—"}
          unit={mpg ? "km/L" : ""}
          accent={mpg && mpg >= v.expectedMileage ? "success" : "warning"}
        />
        <Stat label="Fuel Left" value={fuel.toFixed(1)} unit="L" />
        <Stat label="Spent" value={spend.toFixed(0)} unit="this month" />
        <Stat
          label="Budget Left"
          value={remainingBudget.toFixed(0)}
          unit={`/ ${v.monthlyBudget}`}
          accent={remainingBudget > 0 ? "success" : "danger"}
        />
      </div>

      {/* Budget bar */}
      <Card className="mt-4 fade-in-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> Monthly budget
          </div>
          <span className="num text-xs text-muted-foreground">
            {spend.toFixed(0)} / {v.monthlyBudget}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-elevated">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, (spend / Math.max(1, v.monthlyBudget)) * 100)}%`,
              background:
                spend > v.monthlyBudget
                  ? "var(--color-danger)"
                  : "var(--gradient-primary)",
            }}
          />
        </div>
      </Card>
    </div>
  );
}
