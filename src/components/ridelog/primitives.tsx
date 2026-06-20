import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-[28px] bg-surface hairline p-5 transition-all duration-300",
        onClick && "active:scale-[0.98] cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  accent,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent?: "primary" | "success" | "warning" | "danger";
  className?: string;
}) {
  const tone =
    accent === "success"
      ? "text-success"
      : accent === "warning"
        ? "text-warning"
        : accent === "danger"
          ? "text-danger"
          : accent === "primary"
            ? "text-primary"
            : "text-foreground";
  return (
    <Card className={cn("flex flex-col gap-1 px-3 py-3.5 md:p-5", className)}>
      <span className="text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-muted-foreground truncate w-full block">{label}</span>
      <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
        <span className={cn("num text-xl md:text-2xl font-semibold leading-none", tone)}>{value}</span>
        {unit && <span className="text-[10px] md:text-xs text-muted-foreground font-medium">{unit}</span>}
      </div>
    </Card>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between px-1">
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  illustration,
}: {
  title: string;
  hint?: string;
  illustration?: ReactNode;
}) {
  return (
    <Card className="py-8 text-center">
      {illustration && <div className="mb-4">{illustration}</div>}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
