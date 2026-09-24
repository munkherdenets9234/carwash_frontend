import { AlertTriangle } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { listServices } from "@/lib/api/public";
import type { Dictionary } from "@/lib/i18n";
import { cn, formatMNT } from "@/lib/utils";

/**
 * The price list, straight from the API.
 *
 * Not a copy in `content/`: the manager edits prices in the back office, and a
 * second list here would be wrong the first time they did. `listServices()`
 * returns null when the API cannot answer, which is a stated fallback rather
 * than an empty grid — the phone number in the footer still works.
 */
// Service names and descriptions come from the API in whatever language the
// manager typed them, so this section takes no locale: translating a price
// list would mean a second set of names nobody maintains.
export async function ServicesSection({ dict }: { dict: Dictionary }) {
  const services = await listServices();

  return (
    <section id="services" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{dict.services.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">{dict.services.title}</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">{dict.services.subtitle}</p>

        {services === null ? (
          <p className="mt-10 flex items-center gap-3 rounded-lg border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
            <AlertTriangle aria-hidden className="size-4 shrink-0" />
            {dict.services.unavailable}
          </p>
        ) : services.length === 0 ? (
          <p className="mt-10 rounded-lg border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
            {dict.services.empty}
          </p>
        ) : (
          <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/60"
              >
                <div>
                  <h3 className="text-2xl font-medium tracking-tight">{service.name}</h3>
                  {service.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-border px-3 py-1 font-mono text-[12px] text-muted-foreground">
                    {formatDuration(service.duration_min, dict)}
                  </span>
                  <span className="rounded-full border border-border px-3 py-1 font-mono text-[12px] text-muted-foreground">
                    {formatMNT(service.price_mnt)}
                  </span>
                </div>

                <Link
                  // The service id travels with the link so the booking flow
                  // opens on the right one — a visitor who has just read this
                  // card should not have to find it again in a list.
                  href={`/book/new?service=${service.id}`}
                  className={cn(buttonVariants({ variant: "outline" }), "mt-auto w-full")}
                >
                  {dict.services.book}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** "45 min", or "2 h" when it divides cleanly — never "120 min". */
function formatDuration(minutes: number, dict: Dictionary): string {
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} ${dict.services.hours}`;
  return `${minutes} ${dict.services.minutes}`;
}
