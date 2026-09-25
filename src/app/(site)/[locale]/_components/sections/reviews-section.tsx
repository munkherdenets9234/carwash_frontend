"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";

import { type Review, reviews } from "@/content/reviews";
import { localized } from "@/content/site";
import { type Dictionary, interpolate, type Locale } from "@/lib/i18n";
import { cn, initialsOf } from "@/lib/utils";

import { Rating } from "../rating";

/**
 * The review carousel.
 *
 * Scroll-snap rather than a transform-driven slider: the native scroller works
 * with a trackpad, a touch swipe, a scrollbar drag and the arrow keys without
 * any of it being reimplemented, and the arrows below simply scroll it. Every
 * card stays in the DOM, so a search engine sees all of the reviews rather
 * than only the one that happens to be showing.
 */
export function ReviewsSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const trackRef = useRef<HTMLUListElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 24 : track.clientWidth;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  return (
    <section id="reviews" className="scroll-mt-20 border-b border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{dict.reviews.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">{dict.reviews.title}</h2>
        </div>

        {reviews.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">{dict.reviews.empty}</p>
        ) : (
          <>
            <ul
              ref={trackRef}
              className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} locale={locale} dict={dict} />
              ))}
            </ul>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                aria-label={dict.reviews.previous}
                className="flex size-11 items-center justify-center rounded-full border border-border transition-colors hover:border-primary hover:text-primary"
              >
                <ArrowLeft aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                aria-label={dict.reviews.next}
                className="flex size-11 items-center justify-center rounded-full border border-border transition-colors hover:border-primary hover:text-primary"
              >
                <ArrowRight aria-hidden className="size-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ review, locale, dict }: { review: Review; locale: Locale; dict: Dictionary }) {
  const [expanded, setExpanded] = useState(false);
  const body = localized(review.body, locale);

  return (
    <li className="w-[85vw] max-w-sm shrink-0 snap-start rounded-xl border border-border bg-card p-6 sm:w-96">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {formatReviewDate(review.date)}
        </span>
        <Rating rating={review.rating} label={interpolate(dict.reviews.ratingLabel, { rating: review.rating })} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-11 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground"
        >
          {initialsOf(review.author)}
        </span>
        <span className="text-lg font-medium">{review.author}</span>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className={cn("text-sm leading-relaxed text-muted-foreground", !expanded && "line-clamp-5")}>{body}</p>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 text-[13px] font-medium text-primary"
        >
          {expanded ? dict.reviews.readLess : dict.reviews.readMore}
        </button>
      </div>
    </li>
  );
}

/**
 * `02.09.2026` — the numeric form the wireframes use.
 *
 * Built from the string rather than handed to Intl with a locale. `Intl` needs
 * locale DATA to name a month, and the two runtimes here do not carry the same
 * set: Node renders mn-MN as "2026 оны 9-р сарын 2" while this browser falls
 * back to "Sep 2, 2026". In a Client Component that is a hydration mismatch,
 * and React throws away the server HTML to recover from it. Digits and dots
 * mean the same thing in both languages and cannot disagree.
 */
function formatReviewDate(isoDay: string): string {
  const [year, month, day] = isoDay.split("-");
  return `${day}.${month}.${year}`;
}
