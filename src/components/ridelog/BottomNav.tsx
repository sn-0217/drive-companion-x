import { Link, useLocation } from "@tanstack/react-router";
import { Gauge, Route as RouteIcon, Fuel, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/trips", label: "Trips", icon: RouteIcon },
  { to: "/fuel", label: "Fuel", icon: Fuel },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const loc = useLocation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-black/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-2 pb-2">
        {tabs.map((t) => {
          const active =
            t.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <li key={t.to} className="flex-1">
              <Link
                to={t.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium uppercase tracking-wider transition-all",
                  active
                    ? "text-primary"
                    : "text-muted-foreground active:scale-95",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl transition-all",
                    active && "bg-primary/15",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.8} />
                </span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
