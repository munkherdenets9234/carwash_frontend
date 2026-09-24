"use client";

import { Mail, MapPin, Navigation, Phone } from "lucide-react";
import { useState } from "react";

import { contact, localized, openingHours } from "@/content/site";
import type { Location } from "@/lib/api/types";
import { type Dictionary, interpolate, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The map and the branch list.
 *
 * OpenStreetMap's own embed, in an iframe, rather than a mapping SDK: it needs
 * no API key, no billing account and no third-party script on the page, and
 * the coordinates it is centred on are the ones the API already returns for
 * every branch. "Get directions" hands off to whatever map application the
 * visitor's phone already has rather than routing in here.
 */
export function FindUsSection({
  locale,
  dict,
  locations,
}: {
  locale: Locale;
  dict: Dictionary;
  locations: Location[] | null;
}) {
  const [selectedId, setSelectedId] = useState(locations?.[0]?.id ?? "");
  const selected = locations?.find((location) => location.id === selectedId) ?? locations?.[0];

  return (
    <section id="find-us" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{dict.findUs.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">{dict.findUs.title}</h2>

        <div className="mt-10 grid gap-8 lg:grid-cols-[22rem_1fr]">
          <div className="flex flex-col gap-6">
            {locations && locations.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {locations.map((location) => {
                  const active = location.id === selected?.id;
                  return (
                    <li key={location.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(location.id)}
                        aria-pressed={active}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                          active ? "border-primary bg-accent" : "border-border hover:border-primary/60",
                        )}
                      >
                        <MapPin aria-hidden className={cn("mt-0.5 size-4 shrink-0", active && "text-primary")} />
                        <span className="flex flex-col gap-1">
                          <span className="font-medium">{location.name}</span>
                          {location.address && (
                            <span className="text-[13px] text-muted-foreground">{location.address}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                {dict.findUs.unavailable}
              </p>
            )}

            {selected && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                target="_blank"
                rel="noreferrer noopener"
                className="flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Navigation aria-hidden className="size-4" />
                {dict.findUs.directions}
              </a>
            )}

            <div className="flex flex-col gap-3 rounded-lg border border-border p-5">
              <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {dict.findUs.openingHours}
              </h3>
              {openingHours.map((entry) => (
                <p key={entry.hours} className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">{localized(entry.days, locale)}</span>
                  <span className="font-mono tabular-nums">{entry.hours}</span>
                </p>
              ))}
              <a href={contact.phoneHref} className="mt-2 flex items-center gap-2 text-sm hover:text-primary">
                <Phone aria-hidden className="size-4 text-muted-foreground" />
                {contact.phone}
              </a>
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                <Mail aria-hidden className="size-4 text-muted-foreground" />
                {contact.email}
              </a>
            </div>
          </div>

          <div className="min-h-[24rem] overflow-hidden rounded-xl border border-border bg-muted lg:min-h-full">
            {selected ? (
              <iframe
                key={selected.id}
                title={interpolate(dict.findUs.mapTitle, { name: selected.name })}
                src={embedUrl(selected.lat, selected.lng)}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="size-full min-h-[24rem]"
              />
            ) : (
              <div className="flex size-full min-h-[24rem] items-center justify-center p-6 text-center text-sm text-muted-foreground">
                {dict.findUs.unavailable}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * An OpenStreetMap embed centred on one branch.
 *
 * The box is about 600 m across — close enough to show which corner the
 * entrance is on, wide enough to recognise the surrounding streets. The
 * longitude span is widened by latitude so the box stays square on the ground
 * rather than stretching as you move away from the equator.
 */
function embedUrl(lat: number, lng: number): string {
  const latSpan = 0.003;
  const lngSpan = latSpan / Math.max(Math.cos((lat * Math.PI) / 180), 0.1);
  const bbox = [lng - lngSpan, lat - latSpan, lng + lngSpan, lat + latSpan].map((n) => n.toFixed(6)).join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}
