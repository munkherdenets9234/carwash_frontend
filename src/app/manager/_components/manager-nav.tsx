"use client";

import { Menu, X } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sidebar } from "@/components/app/sidebar";
import { SignOutButton } from "@/components/app/sign-out-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isNavItemActive, managerNav } from "@/navigation/sidebar-items";

/** The desktop sidebar, using the manager's own section list. */
export function ManagerSidebar({ name, email }: { name: string; email: string }) {
  return <Sidebar navItems={managerNav} name={name} email={email} />;
}

/**
 * The manager's mobile chrome: a hamburger that opens a full drawer of the
 * same links, rather than a bottom tab bar.
 *
 * The back office has seven sections, not three — Day report, Bookings,
 * Roster, Timesheets, Staff, Prices & sites, Photographs. Seven tabs do not
 * fit a thumb-width bottom bar, so this is the one signed-in area that keeps
 * a drawer on a phone instead of adopting the bottom-tab pattern the smaller
 * employee and customer surfaces use.
 */
export function ManagerMobileNav({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="outline" size="icon" aria-expanded={open} aria-label="Sections" onClick={() => setOpen(true)}>
          <Menu aria-hidden />
        </Button>
        <span className="text-[15px] font-bold">Car wash</span>
      </div>

      {open && (
        // A plain overlay rather than a dialog primitive: it is one panel with
        // links in it, and pulling in a modal library for it would be the
        // "unnecessary dependency" the reference's conventions warn about.
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close sections"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="relative flex w-72 max-w-[85%] flex-col gap-4 border-r border-border bg-background p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5 px-2">
                <span className="text-[15px] font-bold">Car wash</span>
                <span className="truncate font-mono text-[11px] text-muted-foreground">{name || email}</span>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close sections" onClick={() => setOpen(false)}>
                <X aria-hidden />
              </Button>
            </div>

            <nav aria-label="Sections" className="flex flex-col gap-0.5">
              {managerNav.map((item) => {
                const active = isNavItemActive(pathname, item, managerNav);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
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
          </div>
        </div>
      )}
    </div>
  );
}
