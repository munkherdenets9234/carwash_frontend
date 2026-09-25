// The public site is bilingual; the three signed-in areas are not.
//
// Locale is a URL segment (/mn, /en) rather than a cookie so each language has
// its own address: a shared link, a search result and an hreflang alternate
// all need one, and a cookie gives none of them. The signed-in areas keep
// their own unprefixed URLs — translating the manager's back office is a
// separate decision from translating the shopfront.

export const LOCALES = ["mn", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * Mongolian first: the customers of a Ulaanbaatar car wash are the audience,
 * and English is the second language here rather than the neutral default.
 */
export const DEFAULT_LOCALE: Locale = "mn";

export function hasLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** The label each language shows for itself, never translated. */
export const LOCALE_NAMES: Record<Locale, string> = {
  mn: "Монгол",
  en: "English",
};

/** BCP 47 tags for `lang` attributes and `hreflang`. */
export const LOCALE_TAGS: Record<Locale, string> = {
  mn: "mn-MN",
  en: "en",
};

/** `/mn`, `/en/gallery` — the one place a site path gets its prefix. */
export function localePath(locale: Locale, path = ""): string {
  const suffix = path.replace(/^\/+/, "");
  return suffix ? `/${locale}/${suffix}` : `/${locale}`;
}
