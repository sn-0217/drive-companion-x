import { cn } from "@/lib/utils";

interface PageSkeletonProps {
  pathname: string;
}

export function PageSkeleton({ pathname }: PageSkeletonProps) {
  // Map pathnames to specific skeleton structures
  switch (pathname) {
    case "/":
      return <DashboardSkeleton />;
    case "/fuel":
      return <FuelSkeleton />;
    case "/trips":
      return <TripsSkeleton />;
    case "/insights":
      return <InsightsSkeleton />;
    case "/settings":
      return <SettingsSkeleton />;
    default:
      return <DefaultSkeleton />;
  }
}

function DashboardSkeleton() {
  return (
    <div className="px-5 pt-12 pb-8 space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-surface-elevated" />
          <div className="h-4.5 w-32 rounded bg-surface-elevated" />
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-3.5 hairline">
            <div className="h-9 w-9 rounded-xl bg-surface-elevated" />
            <div className="h-3 w-14 rounded bg-surface-elevated" />
          </div>
        ))}
      </div>

      {/* Hero Odometer Card */}
      <div className="rounded-[28px] bg-surface p-7 h-48 w-full hairline flex flex-col justify-between">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-surface-elevated" />
          <div className="flex items-baseline gap-2 mt-2">
            <div className="h-14 w-40 rounded-xl bg-surface-elevated" />
            <div className="h-4 w-6 rounded bg-surface-elevated" />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <div className="flex justify-between">
            <div className="h-3 w-28 rounded bg-surface-elevated" />
            <div className="h-3 w-8 rounded bg-surface-elevated" />
          </div>
          <div className="h-2 rounded-full bg-surface-elevated w-full" />
        </div>
      </div>

      {/* Weekly Activity Card */}
      <div className="rounded-[28px] bg-surface p-5 h-44 w-full hairline flex flex-col justify-between">
        <div className="h-3 w-32 rounded bg-surface-elevated" />
        <div className="h-24 w-full rounded-xl bg-surface-elevated/40 mt-4" />
      </div>

      {/* Smart Insight Card */}
      <div className="rounded-[28px] bg-surface p-4 h-16 w-full hairline flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-surface-elevated shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-2.5 w-20 rounded bg-surface-elevated" />
          <div className="h-3 w-5/6 rounded bg-surface-elevated" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[28px] bg-surface h-20 w-full hairline" />
        ))}
      </div>
    </div>
  );
}

function FuelSkeleton() {
  return (
    <div className="px-5 pt-12 pb-8 space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6.5 w-20 rounded bg-surface-elevated" />
          <div className="h-3.5 w-44 rounded bg-surface-elevated" />
        </div>
        <div className="h-11 w-24 rounded-2xl bg-surface" />
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[28px] bg-surface h-20 w-full hairline" />
        ))}
      </div>

      {/* Mileage Chart Card */}
      <div className="rounded-[28px] bg-surface p-5 h-44 w-full hairline flex flex-col justify-between">
        <div className="h-3 w-28 rounded bg-surface-elevated" />
        <div className="h-24 w-full rounded-xl bg-surface-elevated/40 mt-4" />
      </div>

      {/* Recent History Logs */}
      <div className="space-y-3">
        <div className="h-3.5 w-24 rounded bg-surface-elevated" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[28px] bg-surface h-24 w-full hairline" />
        ))}
      </div>
    </div>
  );
}

function TripsSkeleton() {
  return (
    <div className="px-5 pt-12 pb-8 space-y-4 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-6.5 w-20 rounded bg-surface-elevated" />
        <div className="h-3.5 w-48 rounded bg-surface-elevated" />
      </div>

      {/* Mode Selectors */}
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-surface h-16 w-full hairline" />
        ))}
      </div>

      {/* Logging Card */}
      <div className="rounded-[28px] bg-surface p-5 h-48 w-full hairline" />

      {/* Recent Rides History */}
      <div className="space-y-3 pt-4">
        <div className="h-3.5 w-24 rounded bg-surface-elevated" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[28px] bg-surface h-20 w-full hairline" />
        ))}
      </div>
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="px-5 pt-12 pb-8 space-y-4 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-6.5 w-28 rounded bg-surface-elevated" />
        <div className="h-3.5 w-56 rounded bg-surface-elevated" />
      </div>

      {/* Selector Tabs */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-surface h-9 w-full hairline" />
        ))}
      </div>

      {/* Stats Summary Panel */}
      <div className="rounded-[28px] bg-surface p-5 h-20 w-full hairline" />

      {/* Charts List */}
      <div className="space-y-4 pt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[28px] bg-surface p-5 h-44 w-full hairline flex flex-col justify-between">
            <div className="h-3 w-32 rounded bg-surface-elevated" />
            <div className="h-24 w-full rounded-xl bg-surface-elevated/40 mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="px-5 pt-12 pb-8 space-y-5 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-6.5 w-28 rounded bg-surface-elevated" />
        <div className="h-3.5 w-40 rounded bg-surface-elevated" />
      </div>

      {/* Sections Cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-[28px] bg-surface p-6 h-48 w-full hairline" />
      ))}
    </div>
  );
}

function DefaultSkeleton() {
  return (
    <div className="px-5 pt-12 pb-8 space-y-5 animate-pulse">
      <div className="h-6 w-32 rounded bg-surface-elevated" />
      <div className="rounded-[28px] bg-surface h-48 w-full hairline" />
      <div className="rounded-[28px] bg-surface h-24 w-full hairline" />
      <div className="rounded-[28px] bg-surface h-24 w-full hairline" />
    </div>
  );
}
