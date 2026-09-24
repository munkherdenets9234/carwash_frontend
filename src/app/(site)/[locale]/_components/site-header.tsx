"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { type Dictionary, type Locale, localePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { LocaleSwitcher } from "./locale-switcher";
import { Wordmark } from "./wordmark";

/**
 * The public site's header.
 *
 * There is no search box, though the wireframe drew one: nothing on this site
 * is searchable — five sections and a gallery — and a field that only ever
 * finds nothing is worse than no field. It comes back if and when the site
 * gets enough content to need it.
 */
export function SiteHeader({
  locale,
  dict,
  businessName,
}: {
  locale: Locale;
  dict: Dictionary;
  businessName?: string;
}) {
  const [open, setOpen] = useState(false);
  const home = localePath(locale);

  const links = [
    { label: dict.nav.services, href: `${home}#services` },
    { label: dict.nav.about, href: `${home}#about` },
    { label: dict.nav.reviews, href: `${home}#reviews` },
    { label: dict.nav.gallery, href: localePath(locale, "gallery") },
    { label: dict.nav.findUs, href: `${home}#find-us` },
  ];

  // Escape closes the drawer, and while it is open the page behind it does not
  // scroll — without that, a phone scrolls the page under the overlay and the
  // visitor comes back to somewhere they did not choose.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5 md:h-20 md:px-10">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={dict.nav.openMenu}
          aria-expanded={open}
          className="-ml-2 flex size-11 items-center justify-center rounded-md lg:hidden"
        >
          <Menu aria-hidden className="size-5" />
        </button>

        <Link href={home} className="text-lg md:text-xl">
          <Wordmark name={businessName} />
        </Link>

        <nav aria-label={dict.nav.services} className="ml-6 hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitcher locale={locale} className="hidden sm:flex" />
          <Link
            href="/login"
            className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            {dict.nav.signIn}
          </Link>
          {/* /book/new is open. It used to sit behind the login guard, which
              meant a visitor who had just read a price and pressed this was
              shown a sign-in form — the surest way to lose them to the
              telephone. Booking now asks for a phone number and a plate and
              nothing else; signing in is for seeing a history. The Button
              component here is a real <button>, so a link that looks like one
              borrows its variants rather than wrapping it. */}
          <Link href="/book/new" className={cn(buttonVariants({ size: "sm" }), "h-10 px-4")}>
            {dict.nav.book}
          </Link>
        </div>
      </div>

      {/* Rendered only while open rather than hidden with opacity: a drawer
          that is merely transparent keeps every link in the tab order, and a
          keyboard visitor tabs through an invisible menu before reaching the
          page. */}
      {open && (
        <div className="fixed inset-0 z-50 bg-background lg:hidden">
          <div className="flex h-16 items-center justify-between px-5">
            <Wordmark name={businessName} className="text-lg" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={dict.nav.closeMenu}
              className="-mr-2 flex size-11 items-center justify-center rounded-md"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 px-5 pt-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-4 text-xl font-medium"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="py-4 text-xl font-medium text-muted-foreground"
            >
              {dict.nav.signIn}
            </Link>
            <LocaleSwitcher locale={locale} className="pt-2" />
          </nav>
        </div>
      )}
    </header>
  );
}
