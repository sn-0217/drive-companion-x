import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/ridelog/AppShell";
import { Card, EmptyState, SectionHeader, Stat } from "@/components/ridelog/primitives";
import { useAppData, uid, averageMileage, type FuelEntry } from "@/lib/ridelog";
import { Plus, Fuel as FuelIcon, Pencil, Calendar, Activity, Coins, Trash2 } from "lucide-react";
import { IllustrationFuel } from "@/components/ridelog/illustrations";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/fuel")({
  head: () => ({
    meta: [
      { title: "Fuel · RideLog Pro" },
      { name: "description", content: "Log fuel fills and watch mileage update automatically." },
      { property: "og:title", content: "Fuel · RideLog Pro" },
      { property: "og:description", content: "Track every refill, price, and odometer reading." },
    ],
  }),
  component: () => (
    <AppShell>
      <FuelPage />
    </AppShell>
  ),
});

function FuelPage() {
  const { data, update } = useAppData();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form fields
  const [calcMode, setCalcMode] = useState<"price" | "liters">("price");
  const [price, setPrice] = useState("");
  const [litersInput, setLitersInput] = useState("");
  const [totalPaid, setTotalPaid] = useState("");
  const [odo, setOdo] = useState("");
  const [date, setDate] = useState(() => toLocalDateTimeInput(Date.now()));

  // Auto-calculated litres or price depending on selected mode
  const calculatedLiters = calcMode === "price"
    ? (Number(price) > 0 ? Number(totalPaid) / Number(price) : 0)
    : Number(litersInput);

  const calculatedPrice = calcMode === "liters"
    ? (Number(litersInput) > 0 ? Number(totalPaid) / Number(litersInput) : 0)
    : Number(price);

  // Compute fuel history with mileage offsets
  const fuelHistory = [...data.fuel]
    .sort((a, b) => a.date - b.date)
    .map((entry, index, entries) => {
      const previous = entries[index - 1];
      const distance = previous ? entry.odometer - previous.odometer : 0;
      const mileage = previous && distance > 0 && entry.liters > 0 ? distance / entry.liters : null;
      return { entry, mileage, isBaseline: index === 0 };
    })
    .reverse();

  // 1. Overall stats calculations
  const totalSpend = data.fuel.reduce((sum, f) => sum + f.totalCost, 0);
  const totalLitres = data.fuel.reduce((sum, f) => sum + f.liters, 0);
  const avgPrice = totalLitres > 0 ? totalSpend / totalLitres : 0;
  const avgMpg = averageMileage(data);
  const expectedMileage = data.vehicle?.expectedMileage || 45;

  // 2. Prepare Recharts mileage trend data (sorted chronologically)
  const chartData = [...fuelHistory]
    .reverse()
    .filter((item) => item.mileage !== null)
    .map(({ entry, mileage }) => ({
      date: new Date(entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      mileage: Number(mileage!.toFixed(1)),
      odometer: entry.odometer,
    }));

  const hasChartData = chartData.length > 0;

  const mockChartData = [
    { date: "May 10", mileage: 42.5, odometer: 1200 },
    { date: "May 24", mileage: 44.8, odometer: 1450 },
    { date: "Jun 02", mileage: 43.1, odometer: 1720 },
    { date: "Jun 14", mileage: 46.2, odometer: 1980 },
  ];

  const closeForm = () => {
    setOpen(false);
    setEditingId(null);
    setPrice("");
    setLitersInput("");
    setTotalPaid("");
    setOdo("");
    setDate(toLocalDateTimeInput(Date.now()));
    setCalcMode("price");
  };

  const edit = (entry: FuelEntry) => {
    setEditingId(entry.id);
    setPrice(String(entry.pricePerLiter));
    setLitersInput(String(entry.liters));
    setTotalPaid(String(entry.totalCost));
    setOdo(String(entry.odometer));
    setDate(toLocalDateTimeInput(entry.date));
    setCalcMode("price"); // Default view mode, fields are synced anyway
    setOpen(true);
  };

  const save = () => {
    const finalPrice = Number(calculatedPrice);
    const finalLiters = Number(calculatedLiters);
    const odometer = Number(odo);
    const totalCost = Number(totalPaid);
    const dateTimestamp = new Date(date).getTime();

    if (finalPrice <= 0 || finalLiters <= 0 || odometer <= 0 || !Number.isFinite(dateTimestamp)) return;

    update((d) => {
      const values = { liters: finalLiters, pricePerLiter: finalPrice, totalCost, odometer, date: dateTimestamp };
      if (editingId) {
        return {
          ...d,
          fuel: d.fuel.map((entry) => (entry.id === editingId ? { ...entry, ...values } : entry)),
        };
      }
      return {
        ...d,
        fuel: [...d.fuel, { id: uid(), ...values }],
      };
    });
    closeForm();
  };

  return (
    <div className="px-5 pt-12 pb-8 space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fuel</h1>
          <p className="text-sm text-muted-foreground">Log fill-ups and track metrics.</p>
        </div>
        <button
          onClick={() => {
            closeForm();
            setOpen(true);
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.97] transition"
        >
          <Plus className="h-4 w-4" /> Add log
        </button>
      </div>

      {/* Analytics Summary Cards */}
      {data.fuel.length > 0 && (
        <div className="grid grid-cols-3 gap-3 fade-in-up">
          <Stat
            label="Avg Mileage"
            value={avgMpg ? avgMpg.toFixed(1) : "—"}
            unit={avgMpg ? "km/L" : ""}
            accent={avgMpg && avgMpg >= expectedMileage ? "success" : "warning"}
          />
          <Stat
            label="Avg Price"
            value={avgPrice > 0 ? `₹${avgPrice.toFixed(0)}` : "—"}
            unit="/ L"
          />
          <Stat
            label="Spent"
            value={totalSpend > 0 ? `₹${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
            unit="total"
          />
        </div>
      )}

      {/* Refuel Form Card */}
      {open && (
        <Card className="fade-in-up space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {editingId ? "Edit fill record" : "New fill record"}
            </p>
            {/* Calculation Toggle Switch */}
            <div className="flex items-center gap-1 rounded-xl bg-surface-elevated p-1 hairline">
              <button
                type="button"
                onClick={() => setCalcMode("price")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all",
                  calcMode === "price"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground"
                )}
              >
                By Price
              </button>
              <button
                type="button"
                onClick={() => setCalcMode("liters")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all",
                  calcMode === "liters"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground"
                )}
              >
                By Volume
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {calcMode === "price" ? (
              <Field label="₹ / Litre" value={price} onChange={setPrice} />
            ) : (
              <Field label="Litres filled" value={litersInput} onChange={setLitersInput} />
            )}
            
            <Field label="Total paid (₹)" value={totalPaid} onChange={setTotalPaid} />
            <Field label="Odometer (km)" value={odo} onChange={setOdo} />

            <label className="block rounded-2xl bg-surface-elevated px-4 py-3 hairline">
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Date & time
              </span>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="num mt-1 w-full bg-transparent text-sm font-semibold text-foreground outline-none"
              />
            </label>
          </div>

          {/* Calculated Output display row */}
          <div className="rounded-2xl bg-surface-elevated/40 px-4 py-3 hairline flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {calcMode === "price" ? "Calculated Litres" : "Calculated Price / Litre"}
            </span>
            <p className="num text-base font-semibold text-foreground">
              {calcMode === "price"
                ? (calculatedLiters > 0 && Number.isFinite(calculatedLiters) ? `${calculatedLiters.toFixed(2)} L` : "—")
                : (calculatedPrice > 0 && Number.isFinite(calculatedPrice) ? `₹${calculatedPrice.toFixed(2)} / L` : "—")}
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={closeForm}
              className="flex-1 rounded-2xl bg-surface-elevated px-4 py-3 text-sm font-medium text-muted-foreground hairline cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="flex-[2] rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground cursor-pointer"
            >
              {editingId ? "Save changes" : "Save log"}
            </button>
          </div>
        </Card>
      )}

      {/* Refueling Efficiency Trend Chart */}
      {data.fuel.length > 0 && (
        <Card className="p-5 fade-in-up relative overflow-hidden">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
            Fuel Mileage Trend
          </p>

          <div className="h-[140px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hasChartData ? chartData : mockChartData}>
                <XAxis 
                  dataKey="date" 
                  stroke="oklch(0.65 0 0 / 40%)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dy={6}
                />
                <Tooltip 
                  content={hasChartData ? <FuelTooltip /> : <span />}
                  cursor={{ stroke: "oklch(1 0 0 / 5%)", strokeWidth: 1 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mileage" 
                  stroke="oklch(0.72 0.17 145)" // success green
                  strokeWidth={hasChartData ? 2 : 1}
                  strokeDasharray={hasChartData ? undefined : "3 3"}
                  dot={{ r: hasChartData ? 3 : 0, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Empty state graph note overlay */}
            {!hasChartData && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-black/40 backdrop-blur-[1px] rounded-2xl p-4">
                <p className="text-xs font-semibold text-foreground">Need 2 refuels to compute trend</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Logs will plot fuel efficiency (km/L) trends here.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* History Log Section */}
      <div className="space-y-3">
        <SectionHeader title="Fuel Logs" />
        
        {data.fuel.length === 0 ? (
          <EmptyState
            illustration={<IllustrationFuel />}
            title="No fills yet"
            hint="Add your first fill to start tracking mileage and spend."
          />
        ) : (
          fuelHistory.map(({ entry: f, mileage, isBaseline }) => {
            const isGoodMileage = mileage !== null && mileage >= expectedMileage;
            return (
              <Card key={f.id} className="flex items-center justify-between transition-all">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FuelIcon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="num text-base font-semibold text-foreground">
                      {f.liters.toFixed(2)} L · ₹{f.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(f.date).toLocaleDateString()} · @ {f.odometer.toLocaleString()} km · ₹{f.pricePerLiter.toFixed(1)}/L
                    </p>
                    
                    {/* Dynamic Mileage Badge */}
                    <div className="mt-2 flex">
                      {mileage ? (
                        <span className={cn(
                          "num inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                          isGoodMileage 
                            ? "bg-success/10 text-success border-success/15" 
                            : "bg-warning/10 text-warning border-warning/15"
                        )}>
                          {mileage.toFixed(1)} km/L
                        </span>
                      ) : isBaseline ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-elevated text-muted-foreground border border-border">
                          Baseline fill
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-elevated text-muted-foreground border border-border">
                          Pending mileage
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-2">
                  <button
                    onClick={() => edit(f)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this fuel fill log?")) {
                        update((d) => ({ ...d, fuel: d.fuel.filter((x) => x.id !== f.id) }));
                      }
                    }}
                    className="text-xs text-muted-foreground/70 hover:text-danger transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block rounded-2xl bg-surface-elevated px-4 py-3 hairline">
      <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="num mt-1 w-full bg-transparent text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
      />
    </label>
  );
}

function toLocalDateTimeInput(timestamp: number) {
  const date = new Date(timestamp - new Date(timestamp).getTimezoneOffset() * 60_000);
  return date.toISOString().slice(0, 16);
}

const FuelTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-elevated/95 backdrop-blur-md px-3 py-1.5 rounded-2xl hairline border border-border/10 shadow-lg">
        <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
          {payload[0].payload.date}
        </p>
        <p className="num text-xs font-semibold text-success mt-0.5">
          {payload[0].value} <span className="text-[10px] text-muted-foreground font-normal">km/L</span>
        </p>
        <p className="num text-[10px] text-muted-foreground mt-0.5">
          Odo: {payload[0].payload.odometer.toLocaleString()} km
        </p>
      </div>
    );
  }
  return null;
};
