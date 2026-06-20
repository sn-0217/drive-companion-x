import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/ridelog/AppShell";
import { DeferredRender } from "@/components/ridelog/DeferredRender";
import { InsightsSkeleton } from "@/components/ridelog/PageSkeleton";
import { Card, SectionHeader } from "@/components/ridelog/primitives";
import { useAppData, distanceInRange } from "@/lib/ridelog";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights · RideLog Pro" },
      {
        name: "description",
        content: "Distance, mileage and spend trends across day, week, month and year.",
      },
      { property: "og:title", content: "Insights · RideLog Pro" },
      { property: "og:description", content: "Beautiful interactive charts for your ride data." },
    ],
  }),
  component: () => (
    <AppShell>
      <DeferredRender fallback={<InsightsSkeleton />}>
        <Insights />
      </DeferredRender>
    </AppShell>
  ),
});

const RANGES = [
  { k: "D", label: "Day", days: 1 },
  { k: "W", label: "Week", days: 7 },
  { k: "M", label: "Month", days: 30 },
  { k: "Y", label: "Year", days: 365 },
] as const;

function Insights() {
  const { data } = useAppData();
  const [rangeKey, setRangeKey] = useState<(typeof RANGES)[number]["k"]>("W");
  const range = RANGES.find((r) => r.k === rangeKey)!;

  const now = Date.now();
  const since = now - range.days * 86400000;

  const totals = useMemo(() => {
    return {
      day: distanceInRange(data, now - 86400000),
      week: distanceInRange(data, now - 7 * 86400000),
      month: distanceInRange(data, now - 30 * 86400000),
      year: distanceInRange(data, now - 365 * 86400000),
    };
  }, [data, now]);

  const distanceSeries = useMemo(() => {
    const buckets = range.days <= 1 ? 24 : range.days <= 7 ? 7 : range.days <= 30 ? 30 : 12;
    const bucketSize = (range.days * 86400000) / buckets;
    const arr = Array.from({ length: buckets }, (_, i) => ({
      t: since + i * bucketSize,
      km: 0,
    }));
    for (const trip of data.trips) {
      if (trip.date < since) continue;
      const idx = Math.min(buckets - 1, Math.floor((trip.date - since) / bucketSize));
      arr[idx].km += trip.distance;
    }
    return arr.map((p) => ({
      ...p,
      label: formatLabel(p.t, range.days),
    }));
  }, [data, range, since]);

  const mileageSeries = useMemo(() => {
    const sorted = [...data.fuel].sort((a, b) => a.odometer - b.odometer);
    const series: { label: string; mileage: number }[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const d = sorted[i].odometer - sorted[i - 1].odometer;
      if (d > 0 && sorted[i - 1].liters > 0) {
        series.push({
          label: new Date(sorted[i].date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          mileage: +(d / sorted[i - 1].liters).toFixed(2),
        });
      }
    }
    return series;
  }, [data]);

  const spendSeries = useMemo(() => {
    const arr = data.fuel.filter((f) => f.date >= since).sort((a, b) => a.date - b.date);
    let cum = 0;
    return arr.map((f) => {
      cum += f.totalCost;
      return {
        label: new Date(f.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        spend: +cum.toFixed(0),
      };
    });
  }, [data, since]);

  return (
    <div className="px-5 pt-12">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Insights</h1>
      <p className="text-sm text-muted-foreground">Patterns in your ride.</p>

      <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl bg-surface p-1 hairline">
        {RANGES.map((r) => (
          <button
            key={r.k}
            onClick={() => setRangeKey(r.k)}
            className={`rounded-xl py-2 text-xs font-semibold transition-all ${
              r.k === rangeKey ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Mini label="Day" value={totals.day.toFixed(1)} />
        <Mini label="Week" value={totals.week.toFixed(1)} />
        <Mini label="Month" value={totals.month.toFixed(0)} />
        <Mini label="Year" value={totals.year.toFixed(0)} />
      </div>

      <div className="mt-6 space-y-4">
        <SectionHeader title="Distance trend" />
        <Card className="px-1 py-4">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={distanceSeries}>
                <defs>
                  <linearGradient id="d" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.85 0.07 250)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.85 0.07 250)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="oklch(0.6 0 0)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip content={<ChartTooltip suffix=" km" />} />
                <Area
                  type="monotone"
                  dataKey="km"
                  stroke="oklch(0.85 0.07 250)"
                  strokeWidth={2}
                  fill="url(#d)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <SectionHeader title="Mileage trend" />
        <Card className="px-1 py-4">
          <div className="h-40">
            {mileageSeries.length < 2 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Add two or more fills to see mileage.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mileageSeries}>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="oklch(0.6 0 0)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip content={<ChartTooltip suffix=" km/L" />} />
                  <Line
                    type="monotone"
                    dataKey="mileage"
                    stroke="oklch(0.72 0.17 145)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "oklch(0.72 0.17 145)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <SectionHeader title="Cumulative spend" />
        <Card className="px-1 py-4">
          <div className="h-40">
            {spendSeries.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No fills in this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendSeries}>
                  <defs>
                    <linearGradient id="s" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.82 0.16 80)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.82 0.16 80)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="oklch(0.6 0 0)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip prefix="₹" />} />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke="oklch(0.82 0.16 80)"
                    strokeWidth={2}
                    fill="url(#s)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <Card className="py-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="num mt-1 text-2xl font-semibold text-foreground">
        {value} <span className="text-xs text-muted-foreground">km</span>
      </p>
    </Card>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  prefix = "",
  suffix = "",
}: {
  active?: boolean;
  payload?: Array<{ value: number | string }>;
  label?: string;
  prefix?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground">{label}</p>
      <p className="num font-semibold text-foreground">
        {prefix}
        {payload[0].value}
        {suffix}
      </p>
    </div>
  );
}

function formatLabel(t: number, days: number) {
  const d = new Date(t);
  if (days <= 1) return `${d.getHours()}h`;
  if (days <= 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  if (days <= 30) return `${d.getDate()}`;
  return d.toLocaleDateString(undefined, { month: "short" });
}
