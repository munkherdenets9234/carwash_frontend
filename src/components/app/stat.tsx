import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** One tile per row may carry the accent — the figure the screen is about. */
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border p-4",
        emphasis ? "border-primary/30 bg-accent" : "border-border bg-card",
      )}
    >
      <span
        className={cn(
          "font-mono text-[11px] uppercase tracking-wider",
          emphasis ? "text-accent-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-2xl font-bold leading-none tabular-nums",
          emphasis ? "text-accent-foreground" : "text-foreground",
        )}
      >
        {value}
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>;
}
