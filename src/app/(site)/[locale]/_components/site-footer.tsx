import Link from "next/link";

import { contact, legalName, localized } from "@/content/site";
import { listLocations } from "@/lib/api/public";
import { type Dictionary, type Locale, localePath } from "@/lib/i18n";

import { Wordmark } from "./wordmark";

/**
 * The footer.
 *
 * Async and server-rendered so the branch list is the real one: the same
 * cached `listLocations()` the map section uses, which costs nothing extra
 * here. When the API cannot answer, the column is left out rather than
 * rendered empty — the address and phone below it are static and still true.
 */
export async function SiteFooter({
  locale,
  dict,
  businessName,
}: {
  locale: Locale;
  dict: Dictionary;
  businessName?: string;
}) {
  const locations = await listLocations();
  const home = localePath(locale);

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4 md:px-10">
        <div className="flex flex-col gap-5">
          <Wordmark name={businessName} className="text-2xl" />
          <Link
            href="/book/new"
            className="w-fit border-b-2 border-foreground pb-1 text-2xl font-medium transition-colors hover:border-primary hover:text-primary"
          >
            {dict.nav.book}
          </Link>
        </div>

        <nav aria-label={dict.footer.site} className="flex flex-col gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{dict.footer.site}</h2>
          <Link href={`${home}#services`} className="text-sm hover:text-primary">
            {dict.nav.services}
          </Link>
          <Link href={`${home}#about`} className="text-sm hover:text-primary">
            {dict.nav.about}
          </Link>
          <Link href={`${home}#reviews`} className="text-sm hover:text-primary">
            {dict.nav.reviews}
          </Link>
          <Link href={localePath(locale, "gallery")} className="text-sm hover:text-primary">
            {dict.nav.gallery}
          </Link>
          <Link href="/login" className="text-sm hover:text-primary">
            {dict.nav.signIn}
          </Link>
        </nav>

        <div className="flex flex-col gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{dict.footer.findUs}</h2>
          {locations && locations.length > 0 ? (
            locations.map((location) => (
              <Link key={location.id} href={`${home}#find-us`} className="text-sm hover:text-primary">
                {location.name}
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{localized(contact.address, locale)}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {dict.footer.contact}
          </h2>
          <p className="text-sm text-muted-foreground">{localized(contact.address, locale)}</p>
          <a href={contact.phoneHref} className="text-sm hover:text-primary">
            {contact.phone}
          </a>
          <a href={`mailto:${contact.email}`} className="text-sm hover:text-primary">
            {contact.email}
          </a>
          <div className="flex gap-2 pt-1">
            {contact.social.map((item) => (
              <a
                key={item.label}
                href={item.href}
                aria-label={item.label}
                target="_blank"
                rel="noreferrer noopener"
                className="flex size-10 items-center justify-center rounded-full border border-border text-[13px] font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {item.short}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-border px-5 py-5 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-10">
        <p>
          © {new Date().getFullYear()} {localized(legalName, locale)}. {dict.footer.rights}
        </p>
        <div className="flex gap-5">
          <span>{dict.footer.privacy}</span>
          <span>{dict.footer.terms}</span>
        </div>
      </div>
    </footer>
  );
}
