"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { Sidebar } from "@/components/app/sidebar";
import { cn } from "@/lib/utils";
import { isNavItemActive, type NavItem } from "@/navigation/sidebar-items";

/**
 * The phone shell — bottom tab bar below `lg`, a manager-style sidebar and
 * page header at `lg` and up.
 *
 * Below `lg` this is unchanged from what it always was: a title bar, the
 * screen, and a bottom tab bar, all capped at a phone's width even on a
 * wider window. Bottom tabs rather than a drawer because the phone
 * audiences that reach this — an employee with wet hands, a customer in a
 * queue — use it one-handed, and the bottom of the screen is the part a
 * thumb reaches without regripping. Nothing about that changes here.
 *
 * At `lg` and up this stopped being a narrow card floating in a wide window
 * and gained the same chrome the back office uses: a fixed sidebar naming
 * the sections, and `PageHeader` for the title. The mobile header and the
 * bottom tab bar are the ones that disappear at that width, not the other
 * way round — a sidebar and a bottom tab bar answering the same question
 * twice would be the tell that this was patched rather than designed.
 *
 * `children` renders exactly once. It is written for the constraints of the
 * phone-width column, and it keeps that shape at `lg` too — nothing here
 * asks the screens themselves to grow a second, wider layout, only the
 * chrome AROUND them changes.
 */
export function MobileShell({
  title,
  subtitle,
  nav,
  action,
  name,
  email,
  children,
}: {
  title: string;
  subtitle?: string;
  /**
   * The tab bar, and the sidebar's section list — the two are drawn from
   * the same array so a route reachable from one is reachable from the
   * other. Omitted for a screen an anonymous visitor can reach: a guest
   * booking has no Garage and no Bookings to tab to, and showing those
   * would be links that all bounce off the login guard.
   */
  nav?: NavItem[];
  action?: React.ReactNode;
  /** Who is signed in, shown in the `lg`+ sidebar. Omit along with `nav`. */
  name?: string;
  email?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh w-full flex-col lg:flex-row">
      {nav && <Sidebar navItems={nav} name={name ?? ""} email={email ?? ""} />}

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col border-border sm:border-x lg:mx-0 lg:min-w-0 lg:max-w-none lg:border-x-0">
        <header className="flex items-center gap-3 border-b border-border px-5 py-4 lg:hidden">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {subtitle && (
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {subtitle}
              </span>
            )}
            <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
          </div>
          {action}
        </header>

        <div className="hidden lg:block">
          <PageHeader eyebrow={subtitle} title={title} actions={action} />
        </div>

        {/* pb-24 clears the fixed tab bar so the last card is never hidden
            behind it — the bug you only notice at the bottom of a long list.
            The bottom padding only has to clear a tab bar that is there, and
            only below `lg`, where that bar still renders. */}
        <main className={cn("flex-1 px-5 pt-5 lg:px-8 lg:pt-6", nav ? "pb-24 lg:pb-10" : "pb-10 lg:pb-10")}>
          {children}
        </main>

        {nav && (
          <nav
            aria-label="Main"
            className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-lg border-t border-border bg-background lg:hidden"
          >
            {nav.map((item) => {
              const active = isNavItemActive(pathname, item, nav);
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
    </div>
  );
}
