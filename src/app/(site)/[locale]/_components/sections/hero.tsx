import { Phone } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { reviews } from "@/content/reviews";
import { contact, hero, localized } from "@/content/site";
import { getBusiness } from "@/lib/api/public";
import { getSiteMedia } from "@/lib/api/site-media";
import { type Dictionary, interpolate, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { Photo } from "../photo";
import { Rating } from "../rating";

/**
 * The hero: the promise on the left, one photograph on the right.
 *
 * The oversized wordmark that used to sit behind the photograph is gone. This
 * layout puts a headline where it stood, and two pieces of type that large
 * competing for the same space reads as a mistake rather than as emphasis —
 * the name is still in the header and the footer, which is where a visitor
 * looks for it.
 */
export async function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const business = await getBusiness();
  const media = await getSiteMedia();
  const cover = media.hero ?? media.gallery[0];

  const headline = hero.headline[locale];

  // The pill is computed from the reviews the site already shows, not typed
  // into a config file. A rating nobody can click through to is the kind of
  // number visitors have learned to discount, and one that disagrees with the
  // cards further down the page is worse than none at all. No reviews, no
  // pill — an empty five stars is a claim this business has not earned yet.
  const average = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const summary = reviews.length === 1 ? dict.hero.ratingSummaryOne : dict.hero.ratingSummary;

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* The text column is first in the DOM as well as on screen: it
              carries the headline, so it is what a reader on a phone and a
              crawler should both meet first. */}
          <div className="flex flex-col items-start gap-6">
            {reviews.length > 0 && (
              <a
                href="#reviews"
                className="flex items-center gap-3 rounded-full border border-border py-2 pl-4 pr-5 transition-colors hover:border-primary"
              >
                <span className="text-lg font-semibold tabular-nums">{average.toFixed(1)}</span>
                <Rating rating={average} label={interpolate(dict.hero.ratingLabel, { rating: average.toFixed(1) })} />
                <span className="text-[13px] text-muted-foreground">
                  {interpolate(summary, { count: reviews.length })}
                </span>
              </a>
            )}

            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              {headline.lead} <span className="text-muted-foreground">{headline.muted}</span>
            </h1>

            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">{localized(hero.subhead, locale)}</p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/book/new" className={cn(buttonVariants({ size: "lg" }), "rounded-full px-7")}>
                {dict.hero.bookCta}
              </Link>
              <a
                href={contact.phoneHref}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2 rounded-full px-7")}
              >
                <Phone aria-hidden />
                {dict.hero.callCta}
              </a>
            </div>
          </div>

          <div className="relative">
            <Photo
              src={cover?.src}
              width={cover?.width}
              height={cover?.height}
              alt={cover ? localized(cover.alt, locale) : (business?.name ?? "")}
              priority
              sizes="(max-width: 1024px) 100vw, 560px"
              className="aspect-[4/5] w-full rounded-2xl border border-border"
            />

            {cover && (
              // Sits over the photograph, so it needs its own backdrop rather
              // than borrowing the page's: whatever the picture is, the
              // caption has to stay readable on top of it.
              <p className="absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-background/85 px-4 py-3 text-[13px] backdrop-blur">
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-primary" />
                <span className="font-medium">{dict.gallery.tags[cover.tag]}</span>
                <span className="text-muted-foreground">· {localized(cover.alt, locale)}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
