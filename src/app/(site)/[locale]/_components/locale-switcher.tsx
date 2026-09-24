"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LOCALE_NAMES, LOCALE_TAGS, LOCALES, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Two links, not a select.
 *
 * With exactly two languages a dropdown costs a click and gives nothing back,
 * and real links mean the other language is crawlable and can be opened in a
 * new tab. Each one points at the SAME page in the other language rather than
 * at its home page, which is the thing language switchers most often get
 * wrong.
 */
export function LocaleSwitcher({ locale, className }: { locale: Locale; className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {LOCALES.map((candidate) => {
        const active = candidate === locale;
        return (
          <Link
            key={candidate}
            href={swapLocale(pathname, candidate)}
            hrefLang={LOCALE_TAGS[candidate]}
            lang={LOCALE_TAGS[candidate]}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-md px-2 py-1 text-[13px] font-medium transition-colors",
              active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {LOCALE_NAMES[candidate]}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Replaces the locale segment of the current path.
 *
 * The first segment is always a locale on this site — the layout 404s anything
 * else — so swapping it is enough, and the rest of the path (and therefore the
 * page the visitor is on) survives.
 */
function swapLocale(pathname: string, next: Locale): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return `/${next}`;
  segments[0] = next;
  return `/${segments.join("/")}`;
}
