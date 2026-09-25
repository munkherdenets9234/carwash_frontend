import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSiteMedia } from "@/lib/api/site-media";
import { DEFAULT_LOCALE, getDictionary, hasLocale, LOCALE_TAGS, LOCALES, localePath } from "@/lib/i18n";

import { GalleryGrid } from "./_components/gallery-grid";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const dict = getDictionary(locale);

  return {
    title: dict.meta.galleryTitle,
    description: dict.meta.galleryDescription,
    alternates: {
      canonical: localePath(locale, "gallery"),
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l], localePath(l, "gallery")])),
        // What a search engine should serve when it matches neither
        // language. Same answer as `/` gives a visitor: Mongolian.
        "x-default": localePath(DEFAULT_LOCALE, "gallery"),
      },
    },
  };
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const { gallery } = await getSiteMedia();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-20">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{dict.gallery.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">{dict.gallery.title}</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">{dict.meta.galleryDescription}</p>

      <div className="mt-10">
        <GalleryGrid locale={locale} dict={dict} photos={gallery} />
      </div>
    </div>
  );
}
