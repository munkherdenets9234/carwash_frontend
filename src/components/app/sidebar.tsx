"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/app/sign-out-button";
import { cn } from "@/lib/utils";
import { isNavItemActive, type NavItem } from "@/navigation/sidebar-items";

/**
 * The desktop-only left sidebar shared by every signed-in staff area.
 *
 * One component rather than one per role, because the shape is identical —
 * a brand mark, who is signed in, the section links, sign out — and only
 * WHICH links differ. A second, separately maintained copy of this markup
 * for employees is the one that quietly stops matching the manager's the
 * next time its spacing or active-state styling changes.
 *
 * `hidden ... lg:flex`: this never renders below the `lg` breakpoint. The
 * phone-width areas (an employee's shift, a customer's booking) keep their
 * own bottom tab bar instead, because they are used one-handed and the
 * bottom of the screen is what a thumb reaches without regripping. A
 * sidebar earns its keep once there is a pointer and room for one.
 */
export function Sidebar({ navItems, name, email }: { navItems: NavItem[]; name: string; email: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-4 border-r border-border bg-muted/40 p-4 lg:flex">
      <div className="flex flex-col gap-0.5 px-2 pb-2">
        <span className="text-[15px] font-bold">Car wash</span>
        <span className="truncate font-mono text-[11px] text-muted-foreground">{name || email}</span>
      </div>

      <nav aria-label="Sections" className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = isNavItemActive(pathname, item, navItems);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors",
                active ? "bg-primary font-semibold text-primary-foreground" : "text-foreground hover:bg-muted",
              )}
            >
              <item.icon aria-hidden className="size-4 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <SignOutButton className="mt-auto" />
    </aside>
  );
}
