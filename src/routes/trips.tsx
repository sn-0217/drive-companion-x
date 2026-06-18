import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/ridelog/AppShell";
import { Card, EmptyState, SectionHeader } from "@/components/ridelog/primitives";
import { useAppData, uid, type Trip } from "@/lib/ridelog";
import { Play, Square, Plus, Navigation, Hand, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trips")({
  head: () => ({
    meta: [
      { title: "Trips · RideLog Pro" },
      { name: "description", content: "Log rides manually, with GPS, or auto-detect movement." },
      { property: "og:title", content: "Trips · RideLog Pro" },
      { property: "og:description", content: "Three ride-tracking modes built for offline use." },
    ],
  }),
  component: () => (
    <AppShell>
      <TripsPage />
    </AppShell>
  ),
});

type Mode = "manual" | "gps" | "auto";

function TripsPage() {
  const [mode, setMode] = useState<Mode>("manual");
  const { data, update } = useAppData();

  return (
    <div className="px-5 pt-12">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Trips</h1>
      <p className="text-sm text-muted-foreground">Choose how you want to log this ride.</p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {(
          [
            { k: "manual", label: "Manual", Icon: Hand },
            { k: "gps", label: "GPS", Icon: Navigation },
            { k: "auto", label: "Auto", Icon: Radio },
          ] as const
        ).map(({ k, label, Icon }) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl px-3 py-4 text-xs font-medium transition-all active:scale-[0.97]",
              mode === k
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted-foreground hairline",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {mode === "manual" && <ManualTrip />}
        {mode === "gps" && <GpsTrip />}
        {mode === "auto" && <AutoTrip />}
      </div>

      <div className="mt-8 space-y-3">
        <SectionHeader title="Recent rides" />
        {data.trips.length === 0 ? (
          <EmptyState title="No rides yet" hint="Your logged rides will appear here." />
        ) : (
          [...data.trips]
            .sort((a, b) => b.date - a.date)
            .slice(0, 20)
            .map((t) => (
              <Card key={t.id} className="flex items-center justify-between">
                <div>
                  <p className="num text-lg font-semibold text-foreground">
                    {t.distance.toFixed(2)} km
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.date).toLocaleString()} · {t.mode.toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() =>
                    update((d) => ({ ...d, trips: d.trips.filter((x) => x.id !== t.id) }))
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

function ManualTrip() {
  const { update } = useAppData();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const distance = Math.max(0, Number(end) - Number(start));

  return (
    <Card>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Manual entry
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <NumberField label="Start odo" value={start} onChange={setStart} />
        <NumberField label="End odo" value={end} onChange={setEnd} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Distance · <span className="num text-foreground">{distance.toFixed(2)} km</span>
      </p>
      <button
        disabled={distance <= 0}
        onClick={() => {
          update((d) => ({
            ...d,
            trips: [
              ...d.trips,
              {
                id: uid(),
                date: Date.now(),
                mode: "manual",
                startOdo: Number(start),
                endOdo: Number(end),
                distance,
              },
            ],
          }));
          setStart("");
          setEnd("");
        }}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
      >
        <Plus className="h-4 w-4" /> Save ride
      </button>
    </Card>
  );
}

function GpsTrip() {
  const { update } = useAppData();
  const [tracking, setTracking] = useState(false);
  const [distance, setDistance] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const lastPos = useRef<GeolocationPosition | null>(null);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (!tracking) return;
    const t = setInterval(() => setElapsed((Date.now() - startTime.current) / 1000), 1000);
    return () => clearInterval(t);
  }, [tracking]);

  const start = () => {
    if (!("geolocation" in navigator)) {
      setError("GPS not available on this device.");
      return;
    }
    setError(null);
    setDistance(0);
    setElapsed(0);
    startTime.current = Date.now();
    lastPos.current = null;
    setTracking(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (lastPos.current) {
          const d = haversine(
            lastPos.current.coords.latitude,
            lastPos.current.coords.longitude,
            pos.coords.latitude,
            pos.coords.longitude,
          );
          if (d > 0.005) setDistance((x) => x + d); // ignore < 5 m jitter
        }
        lastPos.current = pos;
      },
      (e) => setError(e.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
    );
  };

  const stop = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    setTracking(false);
    if (distance > 0.01) {
      update((d) => ({
        ...d,
        trips: [
          ...d.trips,
          {
            id: uid(),
            date: Date.now(),
            mode: "gps",
            distance,
            durationSec: elapsed,
          },
        ],
      }));
    }
    setDistance(0);
    setElapsed(0);
  };

  return (
    <Card>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        GPS tracking
      </p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="num text-5xl font-semibold text-foreground">
          {distance.toFixed(2)}
        </span>
        <span className="text-sm text-muted-foreground">km</span>
      </div>
      <p className="num mt-1 text-xs text-muted-foreground">
        {formatTime(elapsed)} · {tracking ? "live" : "idle"}
      </p>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <button
        onClick={tracking ? stop : start}
        className={cn(
          "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.97]",
          tracking
            ? "bg-danger text-white"
            : "bg-primary text-primary-foreground",
        )}
      >
        {tracking ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {tracking ? "Stop ride" : "Start ride"}
      </button>
    </Card>
  );
}

function AutoTrip() {
  const { update } = useAppData();
  const [armed, setArmed] = useState(false);
  const [status, setStatus] = useState<"idle" | "waiting" | "riding">("idle");
  const [distance, setDistance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const lastPos = useRef<GeolocationPosition | null>(null);
  const slowSince = useRef<number | null>(null);
  const distRef = useRef(0);

  const stopAll = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
  };

  useEffect(() => () => stopAll(), []);

  const arm = () => {
    if (!("geolocation" in navigator)) {
      setError("GPS not available.");
      return;
    }
    setError(null);
    setArmed(true);
    setStatus("waiting");
    distRef.current = 0;
    setDistance(0);
    lastPos.current = null;
    slowSince.current = null;
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const speed = pos.coords.speed ?? 0; // m/s
        if (status !== "riding" && speed > 2.5) {
          setStatus("riding");
        }
        if (lastPos.current) {
          const d = haversine(
            lastPos.current.coords.latitude,
            lastPos.current.coords.longitude,
            pos.coords.latitude,
            pos.coords.longitude,
          );
          if (d > 0.005) {
            distRef.current += d;
            setDistance(distRef.current);
          }
        }
        lastPos.current = pos;

        if (speed < 0.5) {
          slowSince.current ??= Date.now();
          if (
            status === "riding" &&
            slowSince.current &&
            Date.now() - slowSince.current > 60_000
          ) {
            // auto stop
            if (distRef.current > 0.05) {
              update((d) => ({
                ...d,
                trips: [
                  ...d.trips,
                  { id: uid(), date: Date.now(), mode: "auto", distance: distRef.current },
                ],
              }));
            }
            distRef.current = 0;
            setDistance(0);
            setStatus("waiting");
            slowSince.current = null;
          }
        } else {
          slowSince.current = null;
        }
      },
      (e) => setError(e.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    );
  };

  const disarm = () => {
    stopAll();
    setArmed(false);
    setStatus("idle");
    if (distRef.current > 0.05) {
      update((d) => ({
        ...d,
        trips: [
          ...d.trips,
          { id: uid(), date: Date.now(), mode: "auto", distance: distRef.current },
        ],
      }));
    }
    distRef.current = 0;
    setDistance(0);
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Auto detection
          </p>
          <p className="mt-1 text-sm text-foreground">
            {armed
              ? status === "riding"
                ? "Ride detected · logging"
                : "Armed · waiting for movement"
              : "Off"}
          </p>
        </div>
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            status === "riding"
              ? "bg-success"
              : armed
              ? "bg-warning animate-pulse"
              : "bg-muted-foreground/40",
          )}
        />
      </div>
      <div className="num mt-4 text-3xl font-semibold text-foreground">
        {distance.toFixed(2)} <span className="text-sm text-muted-foreground">km</span>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <button
        onClick={armed ? disarm : arm}
        className={cn(
          "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.97]",
          armed ? "bg-surface-elevated text-foreground hairline" : "bg-primary text-primary-foreground",
        )}
      >
        {armed ? "Disarm" : "Arm auto-detect"}
      </button>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Auto-detect uses GPS speed. Keep this tab open while riding.
      </p>
    </Card>
  );
}

function NumberField({
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

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h ? h + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// touch to satisfy type usage
export type _T = Trip;
