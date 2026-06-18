// Offline-first local storage layer for RideLog Pro
import { useEffect, useState, useCallback } from "react";

export type Vehicle = {
  name: string;
  odometer: number;          // km
  tankCapacity: number;      // L
  expectedMileage: number;   // km/L
  monthlyBudget: number;     // currency
  createdAt: number;
};

export type FuelEntry = {
  id: string;
  date: number;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  odometer: number;
};

export type Trip = {
  id: string;
  date: number;
  mode: "manual" | "gps" | "auto";
  startOdo?: number;
  endOdo?: number;
  distance: number;          // km
  durationSec?: number;
};

export type Maintenance = {
  id: string;
  type: string;              // Service, Oil, Tyre, Insurance, PUC, Custom
  lastDate?: number;
  lastOdo?: number;
  intervalDays?: number;
  intervalKm?: number;
  notes?: string;
};

export type AppData = {
  vehicle: Vehicle | null;
  fuel: FuelEntry[];
  trips: Trip[];
  maintenance: Maintenance[];
};

const KEY = "ridelog-pro:v1";

const empty: AppData = { vehicle: null, fuel: [], trips: [], maintenance: [] };

function read(): AppData {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

function write(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("ridelog:update"));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function useAppData() {
  const [data, setData] = useState<AppData>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(read());
    setReady(true);
    const on = () => setData(read());
    window.addEventListener("ridelog:update", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("ridelog:update", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  const update = useCallback((mutator: (d: AppData) => AppData) => {
    const next = mutator(read());
    write(next);
    setData(next);
  }, []);

  return { data, ready, update };
}

// ---------- Derived analytics ----------

export function currentOdometer(data: AppData): number {
  const v = data.vehicle?.odometer ?? 0;
  const tripExtra = data.trips.reduce((s, t) => s + (t.distance || 0), 0);
  // If user logs trips after setup, odometer = base + trips.
  // Fuel entries also include the current odometer; pick max.
  const fuelMax = data.fuel.reduce((m, f) => Math.max(m, f.odometer || 0), 0);
  return Math.max(v + tripExtra, fuelMax, v);
}

export function averageMileage(data: AppData): number | null {
  const sorted = [...data.fuel].sort((a, b) => a.odometer - b.odometer);
  if (sorted.length < 2) return null;
  const distance = sorted[sorted.length - 1].odometer - sorted[0].odometer;
  // exclude last fill (not yet consumed)
  const liters = sorted.slice(0, -1).reduce((s, f) => s + f.liters, 0);
  if (liters <= 0 || distance <= 0) return null;
  return distance / liters;
}

export function fuelRemaining(data: AppData): number {
  // approximate: assume tank refilled to capacity at last fill, then subtract usage since
  if (!data.vehicle || data.fuel.length === 0) return 0;
  const sorted = [...data.fuel].sort((a, b) => a.odometer - b.odometer);
  const last = sorted[sorted.length - 1];
  const odo = currentOdometer(data);
  const mpg = averageMileage(data) ?? data.vehicle.expectedMileage;
  const distSinceFill = Math.max(0, odo - last.odometer);
  const used = distSinceFill / mpg;
  const remaining = Math.min(data.vehicle.tankCapacity, last.liters) - used;
  return Math.max(0, remaining);
}

export function estimatedRange(data: AppData): number {
  if (!data.vehicle) return 0;
  const mpg = averageMileage(data) ?? data.vehicle.expectedMileage;
  return fuelRemaining(data) * mpg;
}

export function todaysDistance(data: AppData): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return data.trips
    .filter((t) => t.date >= start.getTime())
    .reduce((s, t) => s + t.distance, 0);
}

export function distanceInRange(data: AppData, fromMs: number): number {
  return data.trips.filter((t) => t.date >= fromMs).reduce((s, t) => s + t.distance, 0);
}

export function monthlySpend(data: AppData): number {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return data.fuel
    .filter((f) => f.date >= start.getTime())
    .reduce((s, f) => s + f.totalCost, 0);
}

export function smartInsight(data: AppData): string {
  if (!data.vehicle) return "Set up your vehicle to unlock insights.";
  const mpg = averageMileage(data);
  if (mpg && data.vehicle.expectedMileage) {
    const delta = ((mpg - data.vehicle.expectedMileage) / data.vehicle.expectedMileage) * 100;
    if (Math.abs(delta) >= 3) {
      return `Mileage ${delta > 0 ? "improved" : "dropped"} by ${Math.abs(delta).toFixed(1)}% vs expected.`;
    }
  }
  const range = estimatedRange(data);
  if (range > 0) {
    const days = Math.floor(range / Math.max(15, todaysDistance(data) || 25));
    if (days > 0) return `Fuel may last ${days} more day${days > 1 ? "s" : ""} at current pace.`;
  }
  return "Log a few rides to reveal trends.";
}

export function exportJson(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importJson(json: string): AppData {
  const parsed = JSON.parse(json);
  return { ...empty, ...parsed };
}

export function resetAll() {
  write(empty);
}

export function saveData(data: AppData) {
  write(data);
}
