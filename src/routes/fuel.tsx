import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/ridelog/AppShell";
import { Card, EmptyState, SectionHeader } from "@/components/ridelog/primitives";
import { useAppData, uid, type FuelEntry } from "@/lib/ridelog";
import { Plus, Fuel as FuelIcon, Pencil } from "lucide-react";

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
  const [price, setPrice] = useState("");
  const [totalPaid, setTotalPaid] = useState("");
  const [odo, setOdo] = useState("");

  const liters = Number(price) > 0 ? Number(totalPaid) / Number(price) : 0;
  const fuelHistory = [...data.fuel]
    .sort((a, b) => a.date - b.date)
    .map((entry, index, entries) => {
      const previous = entries[index - 1];
      const distance = previous ? entry.odometer - previous.odometer : 0;
      const mileage = previous && distance > 0 && entry.liters > 0 ? distance / entry.liters : null;
      return { entry, mileage, isBaseline: index === 0 };
    })
    .reverse();

  const closeForm = () => {
    setOpen(false);
    setEditingId(null);
    setPrice("");
    setTotalPaid("");
    setOdo("");
  };

  const edit = (entry: FuelEntry) => {
    setEditingId(entry.id);
    setPrice(String(entry.pricePerLiter));
    setTotalPaid(String(entry.totalCost));
    setOdo(String(entry.odometer));
    setOpen(true);
  };

  const save = () => {
    const pricePerLiter = Number(price);
    const totalCost = Number(totalPaid);
    const odometer = Number(odo);
    if (pricePerLiter <= 0 || totalCost <= 0 || odometer <= 0) return;

    update((d) => {
      const values = { liters, pricePerLiter, totalCost, odometer };
      if (editingId) {
        return {
          ...d,
          fuel: d.fuel.map((entry) => (entry.id === editingId ? { ...entry, ...values } : entry)),
        };
      }
      return {
        ...d,
        fuel: [...d.fuel, { id: uid(), date: Date.now(), ...values }],
      };
    });
    closeForm();
  };

  return (
    <div className="px-5 pt-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fuel</h1>
          <p className="text-sm text-muted-foreground">Every fill, every metric.</p>
        </div>
        <button
          onClick={() => {
            closeForm();
            setOpen(true);
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {open && (
        <Card className="mt-5 fade-in-up">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {editingId ? "Edit fill" : "New fill"}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="₹ / Litre" value={price} onChange={setPrice} />
            <Field label="Total paid" value={totalPaid} onChange={setTotalPaid} />
            <Field label="Odometer" value={odo} onChange={setOdo} />
            <div className="rounded-2xl bg-surface-elevated px-4 py-3 hairline">
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Calculated litres
              </span>
              <p className="num mt-1 text-lg font-semibold text-foreground">
                {liters > 0 && Number.isFinite(liters) ? `${liters.toFixed(2)} L` : "—"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={closeForm}
              className="flex-1 rounded-2xl bg-surface-elevated px-4 py-3 text-sm font-medium text-muted-foreground hairline"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="flex-[2] rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              {editingId ? "Save changes" : "Save fill"}
            </button>
          </div>
        </Card>
      )}

      <div className="mt-6 space-y-3">
        <SectionHeader title="History" />
        {data.fuel.length === 0 ? (
          <EmptyState title="No fills yet" hint="Add your first fill to start tracking mileage." />
        ) : (
          fuelHistory.map(({ entry: f, mileage, isBaseline }) => (
            <Card key={f.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FuelIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="num text-base font-semibold text-foreground">
                    {f.liters.toFixed(2)} L · ₹{f.totalCost.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(f.date).toLocaleDateString()} · @ {f.odometer.toLocaleString()} km
                  </p>
                  <p className="num mt-1 text-xs font-medium text-success">
                    {mileage
                      ? `${mileage.toFixed(1)} km/L since previous fill`
                      : isBaseline
                        ? "Baseline fill"
                        : "Mileage unavailable"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => edit(f)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() =>
                    update((d) => ({ ...d, fuel: d.fuel.filter((x) => x.id !== f.id) }))
                  }
                  className="text-xs text-muted-foreground/70 hover:text-danger"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))
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
        className="num mt-1 w-full bg-transparent text-lg font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
      />
    </label>
  );
}
