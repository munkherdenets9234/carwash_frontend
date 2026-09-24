"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/navigation/sidebar-items";

/**
 * The phone shell: a title bar, the screen, and a bottom tab bar.
 *
 * Bottom tabs rather than a drawer because both phone audiences use this
 * one-handed — an employee with wet hands, a customer in a queue — and the
 * bottom of the screen is the part a thumb reaches without regripping.
 */
export function MobileShell({
  title,
  subtitle,
  nav,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  /**
   * The tab bar. Omitted for a screen an anonymous visitor can reach: a
   * guest booking has no Garage and no Bookings to tab to, and showing
   * those would be three links that all bounce off the login guard.
   */
  nav?: NavItem[];
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col border-border sm:border-x">
      <header className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {subtitle && (
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{subtitle}</span>
          )}
          <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
        </div>
        {action}
      </header>

      {/* pb-24 clears the fixed tab bar so the last card is never hidden
          behind it — the bug you only notice at the bottom of a long list. */}
      {/* The bottom padding only has to clear a tab bar that is there. */}
      <main className={cn("flex-1 px-5 pt-5", nav ? "pb-24" : "pb-10")}>{children}</main>

      {nav && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-lg border-t border-border bg-background"
        >
          {nav.map((item) => {
            const active =
              item.href === pathname ||
              (item.href !== "/employee" && item.href !== "/book" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 border-t-2 px-2 pb-4 pt-3 text-[11px] font-medium",
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground",
                )}
              >
                <item.icon aria-hidden className="size-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
