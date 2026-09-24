import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { localized } from "@/content/site";
import { getSiteMedia } from "@/lib/api/site-media";
import { type Dictionary, type Locale, localePath } from "@/lib/i18n";

import { Photo } from "../photo";

/** The gallery teaser: five tiles and a way through to the rest. */
export async function GallerySection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const preview = (await getSiteMedia()).gallery.slice(0, 5);

  return (
    <section id="gallery" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {dict.gallery.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">{dict.gallery.title}</h2>
          </div>
          <Link
            href={localePath(locale, "gallery")}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            {dict.gallery.viewAll}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        {preview.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">{dict.gallery.empty}</p>
        ) : (
          <div className="mt-10 grid auto-rows-[9rem] grid-cols-2 gap-4 md:grid-cols-4">
            {preview.map((photo, index) => (
              <Photo
                key={photo.id}
                src={photo.src}
                width={photo.width}
                height={photo.height}
                alt={localized(photo.alt, locale)}
                sizes="(max-width: 768px) 50vw, 25vw"
                className={
                  // The first tile carries two rows and two columns, which is
                  // what stops a grid of equal squares from reading as a
                  // contact sheet.
                  index === 0
                    ? "col-span-2 row-span-2 h-full w-full rounded-xl border border-border"
                    : "h-full w-full rounded-xl border border-border"
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
