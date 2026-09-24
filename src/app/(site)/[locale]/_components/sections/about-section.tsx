import { about, brand, localized } from "@/content/site";
import { listLocations, listServices } from "@/lib/api/public";
import { getSiteMedia } from "@/lib/api/site-media";
import type { Dictionary, Locale } from "@/lib/i18n";

import { Photo } from "../photo";

/**
 * About, with three statistics.
 *
 * Two of the three are counted from the API rather than typed into content —
 * a hard-coded "20 branches" is wrong the day a branch opens, and nobody
 * remembers to come back and change it. The founding year has no source but
 * the business itself, so it stays in `content/site.ts`. When a count cannot
 * be fetched its tile is left out rather than shown as a zero.
 */
export async function AboutSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [locations, services] = await Promise.all([listLocations(), listServices()]);
  // Its own role now. It used to be photos[4], which meant the picture
  // beside the about text was whatever landed at index four.
  const media = await getSiteMedia();
  const photo = media.about ?? media.gallery[0];

  const stats = [
    locations ? { value: String(locations.length), label: dict.about.stats.branches } : null,
    services ? { value: String(services.length), label: dict.about.stats.services } : null,
    { value: String(brand.foundedYear), label: dict.about.stats.since },
  ].filter((stat) => stat !== null);

  return (
    <section id="about" className="scroll-mt-20 border-b border-border">
      <div className="grid md:grid-cols-2">
        <Photo
          src={photo?.src}
          width={photo?.width}
          height={photo?.height}
          alt={photo ? localized(photo.alt, locale) : localized(about.title, locale)}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="h-64 w-full border-b border-border md:h-full md:min-h-[32rem] md:border-b-0 md:border-r"
        />

        <div className="flex flex-col gap-6 px-5 py-16 md:px-12 md:py-24">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{dict.about.eyebrow}</p>
          <h2 className="text-3xl font-medium tracking-tight md:text-4xl">{localized(about.title, locale)}</h2>

          <p className="max-w-prose leading-relaxed text-muted-foreground">{localized(about.paragraphs[0], locale)}</p>

          {about.paragraphs.length > 1 && (
            // A native <details> rather than a state hook: it works before
            // hydration, it is keyboard-operable for free, and a printed page
            // or a crawler still gets the text inside it.
            <details className="group max-w-prose">
              <summary className="w-fit cursor-pointer list-none text-sm font-medium text-primary marker:content-none group-open:hidden">
                {dict.about.readMore}
              </summary>
              <div className="flex flex-col gap-4">
                {about.paragraphs.slice(1).map((paragraph) => (
                  <p key={paragraph.en} className="leading-relaxed text-muted-foreground">
                    {localized(paragraph, locale)}
                  </p>
                ))}
              </div>
            </details>
          )}

          <dl className="mt-2 flex flex-wrap gap-x-12 gap-y-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{stat.label}</dt>
                <dd className="mt-1 text-3xl font-medium tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
