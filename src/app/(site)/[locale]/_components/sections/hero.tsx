import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { brand, localized } from "@/content/site";
import { getBusiness } from "@/lib/api/public";
import { getSiteMedia } from "@/lib/api/site-media";
import { type Dictionary, type Locale, localePath } from "@/lib/i18n";

import { Photo } from "../photo";

/**
 * The hero: the name set large, the car in front of it, one call to action.
 *
 * The wordmark behind the photograph is `aria-hidden` and sized in `vw` — it
 * is the same word the header already announces, so repeating it to a screen
 * reader adds nothing, and at this size a fixed px value either overflows a
 * phone or looks timid on a desktop.
 */
export async function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  // The same name the header draws, from the platform rather than from this
  // repository. The static brand remains as the fallback for the one case
  // where the API could not answer and the hero still needs a word.
  const business = await getBusiness();

  // The cover is now a photograph the business CHOSE, not whichever one
  // happened to sort first. A business that has not picked one yet falls
  // through to the head of the album, which is the old behaviour.
  const media = await getSiteMedia();
  const cover = media.hero ?? media.gallery[0];
  const second = media.gallery.find((p) => p.id !== cover?.id) ?? media.gallery[1];
  const word = (
    business?.name ?? `${brand.wordmark.before}${brand.wordmark.accent}${brand.wordmark.after}`
  ).toUpperCase();

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 pb-12 pt-10 md:px-10 md:pb-20 md:pt-16">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{dict.hero.eyebrow}</p>

        <div className="relative mt-8 flex justify-center md:mt-10">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-[12%] select-none text-center text-[19vw] font-bold leading-none tracking-tighter text-muted md:top-[18%]"
          >
            {word}
          </span>
          <Photo
            src={cover?.src}
            width={cover?.width}
            height={cover?.height}
            alt={cover ? localized(cover.alt, locale) : dict.hero.eyebrow}
            priority
            sizes="(max-width: 768px) 60vw, 340px"
            className="relative aspect-[3/5] w-[58%] max-w-[340px] rounded-xl border border-border"
          />
        </div>

        <div className="mt-10 flex flex-col gap-10 md:mt-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/book/new"
              className="inline-block border-b-4 border-foreground pb-2 text-5xl font-medium tracking-tight transition-colors hover:border-primary hover:text-primary md:text-6xl"
            >
              {dict.hero.bookCta}
            </Link>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {dict.hero.bookHint}
            </p>
          </div>

          <div className="flex flex-col gap-6 md:items-end">
            <p className="max-w-xs text-base text-muted-foreground md:text-right">{localized(brand.tagline, locale)}</p>

            <Link
              href={localePath(locale, "gallery")}
              className="flex w-full max-w-sm items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary md:w-auto"
            >
              <span className="flex flex-1 flex-col gap-1">
                <span className="text-lg font-medium">{dict.hero.galleryTitle}</span>
                <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  {dict.hero.galleryLink}
                  <ArrowRight aria-hidden className="size-3.5" />
                </span>
              </span>
              <Photo
                src={second?.src}
                width={second?.width}
                height={second?.height}
                alt={second ? localized(second.alt, locale) : dict.hero.galleryTitle}
                sizes="120px"
                className="h-20 w-28 shrink-0 rounded-lg"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
