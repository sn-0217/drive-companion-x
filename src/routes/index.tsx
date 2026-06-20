import { createFileRoute, Link } from "@tanstack/react-router";
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
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Bike,
  Fuel,
  Wrench,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
        content: "Turn your scooter or motorcycle into a smart vehicle. Offline, no login, no ads.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Page,
});

function Page() {
  return <Dashboard />;
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

  // 1. Compute Alerts
  const alerts: string[] = [];
  
  // Low Fuel Alert (only if at least one fuel fill-up exists to prevent initial false warnings)
  const showLowFuel = data.fuel.length > 0 && (tankPct < 0.15 || range < 40);
  if (showLowFuel) {
    alerts.push(`Low Fuel! Estimated range is ${range.toFixed(0)} km left.`);
  }

  // Maintenance reminders check
  data.maintenance.forEach((m) => {
    const dueIn =
      m.intervalKm && m.lastOdo
        ? m.lastOdo + m.intervalKm - odo
        : null;
    if (dueIn !== null && dueIn <= 0) {
      alerts.push(`${m.type} is overdue by ${Math.abs(dueIn).toLocaleString()} km.`);
    }
  });

  // 2. Compute Weekly Activity Chart Data (last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    d.setHours(0, 0, 0, 0);
    const dateStr = d.toLocaleDateString(undefined, { weekday: "short" });
    
    const dayStart = d.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const dist = data.trips
      .filter((t) => t.date >= dayStart && t.date < dayEnd)
      .reduce((sum, t) => sum + t.distance, 0);

    return {
      name: dateStr,
      distance: Number(dist.toFixed(1)),
    };
  });

  const hasActivityData = chartData.some((item) => item.distance > 0);

  const mockChartData = [
    { name: "Mon", distance: 12 },
    { name: "Tue", distance: 8 },
    { name: "Wed", distance: 18 },
    { name: "Thu", distance: 5 },
    { name: "Fri", distance: 14 },
    { name: "Sat", distance: 24 },
    { name: "Sun", distance: 10 },
  ];

  return (
    <div className="px-5 pt-12 pb-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between fade-in-up">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{v.name}</p>
          <p className="text-sm text-foreground/80">Good ride ahead</p>
        </div>
      </div>

      {/* Dynamic Alerts Banner */}
      {alerts.length > 0 && (
        <Card className="border border-warning/15 bg-warning/5 p-4 fade-in-up">
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning animate-pulse">
              <AlertTriangle className="h-4.5 w-4.5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-warning tracking-wide">Vehicle Attention Needed</p>
              <div className="mt-1.5 space-y-1">
                {alerts.map((alert, idx) => (
                  <p key={idx} className="text-xs text-foreground/90 flex items-center gap-2 leading-relaxed truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                    {alert}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Action Pills */}
      <div className="grid grid-cols-3 gap-3 fade-in-up">
        <Link
          to="/trips"
          className="flex flex-col items-center gap-2 rounded-2xl bg-surface px-3 py-3.5 text-xs font-semibold text-foreground hairline active:scale-95 transition"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bike className="h-4.5 w-4.5" />
          </span>
          Log Ride
        </Link>
        <Link
          to="/fuel"
          className="flex flex-col items-center gap-2 rounded-2xl bg-surface px-3 py-3.5 text-xs font-semibold text-foreground hairline active:scale-95 transition"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Fuel className="h-4.5 w-4.5" />
          </span>
          Log Fuel
        </Link>
        <Link
          to="/settings"
          className="flex flex-col items-center gap-2 rounded-2xl bg-surface px-3 py-3.5 text-xs font-semibold text-foreground hairline active:scale-95 transition"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wrench className="h-4.5 w-4.5" />
          </span>
          Maintain
        </Link>
      </div>

      {/* Hero odometer */}
      <Card className="overflow-hidden p-7 fade-in-up relative">
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
            <span>
              Tank · {fuel.toFixed(2)} L of {v.tankCapacity} L
            </span>
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

      {/* Weekly Activity Area Chart */}
      <Card className="p-5 fade-in-up relative overflow-hidden">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
          Weekly Ride Activity
        </p>
        
        <div className="h-[140px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hasActivityData ? chartData : mockChartData}>
              <defs>
                <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.85 0.07 250)" stopOpacity={hasActivityData ? 0.3 : 0.05}/>
                  <stop offset="95%" stopColor="oklch(0.85 0.07 250)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                stroke="oklch(0.65 0 0 / 40%)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                dy={6}
              />
              <Tooltip 
                content={hasActivityData ? <CustomTooltip /> : <span />}
                cursor={{ stroke: "oklch(1 0 0 / 5%)", strokeWidth: 1 }}
              />
              <Area 
                type="monotone" 
                dataKey="distance" 
                stroke="oklch(0.85 0.07 250)" 
                strokeWidth={hasActivityData ? 2 : 1}
                strokeDasharray={hasActivityData ? undefined : "3 3"}
                fillOpacity={1} 
                fill="url(#colorDistance)" 
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* overlay message if no activity */}
          {!hasActivityData && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-black/40 backdrop-blur-[1px] rounded-2xl p-4">
              <p className="text-xs font-semibold text-foreground">No rides tracked this week</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Logs will automatically plot distance trends here.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Insight */}
      <Card className="flex items-center gap-3 fade-in-up">
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
      <div className="grid grid-cols-2 gap-3 fade-in-up">
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
      <Card className="fade-in-up">
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
                spend > v.monthlyBudget ? "var(--color-danger)" : "var(--gradient-primary)",
            }}
          />
        </div>
      </Card>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-elevated/95 backdrop-blur-md px-3 py-1.5 rounded-2xl hairline border border-border/10 shadow-lg">
        <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
          {payload[0].payload.name}
        </p>
        <p className="num text-xs font-semibold text-foreground mt-0.5">
          {payload[0].value} <span className="text-[10px] text-muted-foreground font-normal">km</span>
        </p>
      </div>
    );
  }
  return null;
};
