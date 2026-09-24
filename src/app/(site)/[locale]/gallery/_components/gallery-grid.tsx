"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { GALLERY_PAGE_SIZE, GALLERY_TAGS, type GalleryTag, type Photo as PhotoRecord } from "@/content/gallery";
import { localized } from "@/content/site";
import { type Dictionary, interpolate, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { Photo } from "../../_components/photo";

type Filter = GalleryTag | "all";

/**
 * The full gallery: filters, a mosaic, and a lightbox.
 *
 * Paged with a button rather than infinite scroll. The footer carries the
 * address and the phone number, and infinite scroll is how a visitor is kept
 * from ever reaching a footer.
 */
export function GalleryGrid({ locale, dict, photos }: { locale: Locale; dict: Dictionary; photos: PhotoRecord[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(GALLERY_PAGE_SIZE);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const matching = filter === "all" ? photos : photos.filter((photo) => photo.tag === filter);
  const visible = matching.slice(0, shown);
  const open = openIndex === null ? null : (matching[openIndex] ?? null);

  function applyFilter(next: Filter) {
    setFilter(next);
    setShown(GALLERY_PAGE_SIZE);
  }

  // Escape closes, arrows move. A lightbox that can only be left with the
  // mouse is a trap for anyone navigating by keyboard.
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
      if (event.key === "ArrowRight") setOpenIndex((i) => (i === null ? null : (i + 1) % matching.length));
      if (event.key === "ArrowLeft") {
        setOpenIndex((i) => (i === null ? null : (i - 1 + matching.length) % matching.length));
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIndex, matching.length]);

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: dict.gallery.all },
    ...GALLERY_TAGS.map((tag) => ({ value: tag as Filter, label: dict.gallery.tags[tag] })),
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((entry) => (
          <button
            key={entry.value}
            type="button"
            onClick={() => applyFilter(entry.value)}
            aria-pressed={filter === entry.value}
            className={cn(
              "h-10 rounded-full border px-4 text-[13px] font-medium transition-colors",
              filter === entry.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary/60",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">{dict.gallery.empty}</p>
      ) : (
        <ul className="mt-8 grid auto-rows-[10rem] grid-cols-2 gap-4 md:grid-cols-4">
          {visible.map((photo, index) => (
            <li key={photo.id} className={cn(photo.feature && "col-span-2 row-span-2")}>
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-label={`${dict.gallery.open}: ${localized(photo.alt, locale)}`}
                className="size-full overflow-hidden rounded-xl border border-border transition-colors hover:border-primary"
              >
                <Tile photo={photo} locale={locale} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 flex flex-col items-center gap-3">
        {shown < matching.length && (
          <button
            type="button"
            onClick={() => setShown((value) => value + GALLERY_PAGE_SIZE)}
            className="h-12 rounded-full border border-border px-6 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
          >
            {dict.gallery.loadMore}
          </button>
        )}
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {interpolate(dict.gallery.showing, { shown: visible.length, total: matching.length })}
        </p>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={localized(open.alt, locale)}
          className="fixed inset-0 z-50 flex flex-col bg-background/95 p-4 backdrop-blur"
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpenIndex(null)}
              aria-label={dict.gallery.close}
              className="flex size-11 items-center justify-center rounded-full border border-border"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-hidden py-4">
            <Tile photo={open} locale={locale} className="max-h-full rounded-xl border border-border" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setOpenIndex((i) => (i === null ? null : (i - 1 + matching.length) % matching.length))}
              className="h-11 rounded-full border border-border px-5 text-sm"
            >
              {dict.gallery.previous}
            </button>
            <p className="text-center text-sm text-muted-foreground">{localized(open.alt, locale)}</p>
            <button
              type="button"
              onClick={() => setOpenIndex((i) => (i === null ? null : (i + 1) % matching.length))}
              className="h-11 rounded-full border border-border px-5 text-sm"
            >
              {dict.gallery.next}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Tile({ photo, locale, className }: { photo: PhotoRecord; locale: Locale; className?: string }) {
  return (
    <Photo
      src={photo.src}
      width={photo.width}
      height={photo.height}
      alt={localized(photo.alt, locale)}
      sizes="(max-width: 768px) 50vw, 25vw"
      className={cn("size-full", className)}
    />
  );
}
