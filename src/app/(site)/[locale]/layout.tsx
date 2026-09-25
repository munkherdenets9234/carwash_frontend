import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBusiness } from "@/lib/api/public";
import { DEFAULT_LOCALE, getDictionary, hasLocale, LOCALE_TAGS, LOCALES, localePath } from "@/lib/i18n";

import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";

/**
 * Both languages are known at build time, so both are prerendered. Anything
 * else in this position — /fr, or a stray /favicon-like path — is not a locale
 * and 404s below rather than rendering an English page under a wrong name.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const dict = getDictionary(locale);

  return {
    title: { default: dict.meta.homeTitle, template: `%s · ${dict.meta.homeTitle}` },
    description: dict.meta.homeDescription,
    alternates: {
      canonical: localePath(locale),
      // hreflang alternates are the only thing that tells a search engine the
      // two URLs are the same page in different languages rather than
      // duplicate content competing with each other.
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l], localePath(l)])),
        // What a search engine should serve when it matches neither
        // language. Same answer as `/` gives a visitor: Mongolian.
        "x-default": localePath(DEFAULT_LOCALE),
      },
    },
    openGraph: {
      title: dict.meta.homeTitle,
      description: dict.meta.homeDescription,
      locale: LOCALE_TAGS[locale],
      type: "website",
    },
  };
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = getDictionary(locale);

  // The trading name, fetched once here and handed to both the header and the
  // footer. This is the server boundary above the header, which is a Client
  // Component and cannot fetch it itself — and fetching once is also what
  // stops the two ever rendering different names.
  //
  // Null when the API could not answer; Wordmark then falls back to the name
  // in content/site.ts rather than rendering an empty header.
  const business = await getBusiness();

  return (
    // `lang` sits here rather than on <html>: the root layout is shared with
    // the three signed-in areas, which are English-only, and a document that
    // claims one language for all of them would be lying to a screen reader on
    // whichever half it got wrong. `lang` is valid on any element, and the
    // nearest one wins.
    <div lang={LOCALE_TAGS[locale]} className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        {dict.nav.skipToContent}
      </a>
      <SiteHeader locale={locale} dict={dict} businessName={business?.name} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter locale={locale} dict={dict} businessName={business?.name} />
    </div>
  );
}
