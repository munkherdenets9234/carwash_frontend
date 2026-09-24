import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  /** Small line above the title — a date, a section, a status. */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-6 py-5 sm:px-8">
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow && (
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</span>
        )}
        <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
