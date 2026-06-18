import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/ridelog/AppShell";
import { Card, EmptyState, SectionHeader } from "@/components/ridelog/primitives";
import { useAppData, uid } from "@/lib/ridelog";
import { Plus, Fuel as FuelIcon } from "lucide-react";

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
  const [liters, setLiters] = useState("");
  const [price, setPrice] = useState("");
  const [odo, setOdo] = useState("");

  const total = Number(liters) * Number(price);

  const save = () => {
    if (!liters || !price || !odo) return;
    update((d) => ({
      ...d,
      fuel: [
        ...d.fuel,
        {
          id: uid(),
          date: Date.now(),
          liters: Number(liters),
          pricePerLiter: Number(price),
          totalCost: total,
          odometer: Number(odo),
        },
      ],
    }));
    setOpen(false);
    setLiters("");
    setPrice("");
    setOdo("");
  };

  return (
    <div className="px-5 pt-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fuel</h1>
          <p className="text-sm text-muted-foreground">Every fill, every metric.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center gap-1.5 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {open && (
        <Card className="mt-5 fade-in-up">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            New fill
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Litres" value={liters} onChange={setLiters} />
            <Field label="₹ / Litre" value={price} onChange={setPrice} />
            <Field label="Odometer" value={odo} onChange={setOdo} />
            <div className="rounded-2xl bg-surface-elevated px-4 py-3 hairline">
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Total
              </span>
              <p className="num mt-1 text-lg font-semibold text-foreground">
                {total ? total.toFixed(2) : "—"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 rounded-2xl bg-surface-elevated px-4 py-3 text-sm font-medium text-muted-foreground hairline"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="flex-[2] rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              Save fill
            </button>
          </div>
        </Card>
      )}

      <div className="mt-6 space-y-3">
        <SectionHeader title="History" />
        {data.fuel.length === 0 ? (
          <EmptyState title="No fills yet" hint="Add your first fill to start tracking mileage." />
        ) : (
          [...data.fuel]
            .sort((a, b) => b.date - a.date)
            .map((f) => (
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
                  </div>
                </div>
                <button
                  onClick={() =>
                    update((d) => ({ ...d, fuel: d.fuel.filter((x) => x.id !== f.id) }))
                  }
                  className="text-xs text-muted-foreground/70 hover:text-danger"
                >
                  Delete
                </button>
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
      <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
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
