"use client";

import { Menu, X } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SignOutButton } from "@/components/app/sign-out-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { managerNav } from "@/navigation/sidebar-items";

/**
 * `/manager` is a prefix of every other manager route, so a plain
 * startsWith would light up "Day report" on every page. Exact match for the
 * index, prefix match for the rest.
 */
function isActive(pathname: string, href: string) {
  return href === "/manager" ? pathname === href : pathname.startsWith(href);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Sections" className="flex flex-col gap-0.5">
      {managerNav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
  );
}

export function ManagerSidebar({ name, email }: { name: string; email: string }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-4 border-r border-border bg-muted/40 p-4 lg:flex">
      <div className="flex flex-col gap-0.5 px-2 pb-2">
        <span className="text-[15px] font-bold">Car wash</span>
        <span className="truncate font-mono text-[11px] text-muted-foreground">{name || email}</span>
      </div>
      <NavLinks />
      <SignOutButton className="mt-auto" />
    </aside>
  );
}

export function ManagerMobileNav({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);

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
            <NavLinks onNavigate={() => setOpen(false)} />
            <SignOutButton className="mt-auto" />
          </div>
        </div>
      )}
    </div>
  );
}
