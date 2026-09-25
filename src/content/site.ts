// Business copy and contact details for the public site.
//
// This is the file a non-developer edits. Nothing here is fetched: the API
// knows the price list and the branches, but it has never been told the
// company's story, its phone number or the year it opened. Keep UI labels out
// of it — those live in `src/lib/i18n/dictionaries/*`.
//
// Every value marked TODO is a placeholder and must be replaced with the real
// one before this site is published.

import type { Locale } from "@/lib/i18n";

/** A string that exists in both languages. */
export type Localized = Record<Locale, string>;

export function localized(value: Localized, locale: Locale): string {
  return value[locale];
}

export const brand = {
  // Rendered as one word with the middle piece in the accent colour, the way
  // the wordmark is drawn in the wireframes.
  // TODO: replace with the real trading name.
  wordmark: { before: "Car", accent: "W", after: "ash" },
  tagline: {
    mn: "Цэвэрхэн. Хурдан. 1966 оноос хойш.",
    en: "Clean. Fast. Since 1966.",
  } satisfies Localized,
  /** Shown in the about section's third statistic. TODO: the real year. */
  foundedYear: 1966,
} as const;

/**
 * The hero headline, split into two pieces, and the line under it.
 *
 * Split because the second half is set in a lighter colour: one string with
 * markup in it would either put HTML in a content file or force every
 * language to break at the same word, and Mongolian does not put the emphasis
 * where English does. Two plain strings let each language choose.
 *
 * Business copy, so it lives here rather than in the dictionaries: a manager
 * rewording their own promise should not be editing UI labels.
 */
export const hero: {
  headline: Record<Locale, { lead: string; muted: string }>;
  subhead: Localized;
} = {
  headline: {
    mn: { lead: "Дараалалгүй", muted: "авто угаалга" },
    en: { lead: "A car wash", muted: "without the queue" },
  },
  subhead: {
    mn: "Гадна, салон болон бүрэн арчилгаа. Онлайнаар цаг сонгоход таны машин товлосон минутдаа угаалгад орно.",
    en: "Exterior, interior and full detailing. Pick a time online and your car goes in at the minute you booked.",
  },
};

export const contact = {
  // TODO: real details. The phone number is the one fallback the site offers
  // when the API is unreachable, so it must be correct even if nothing else is.
  phone: "+976 7000 0000",
  phoneHref: "tel:+9767000000",
  email: "hello@example.mn",
  address: {
    mn: "Улаанбаатар хот, Сүхбаатар дүүрэг",
    en: "Sukhbaatar District, Ulaanbaatar",
  } satisfies Localized,
  social: [
    { label: "Facebook", href: "https://facebook.com/", short: "FB" },
    { label: "Instagram", href: "https://instagram.com/", short: "IG" },
  ],
} as const;

/**
 * Opening hours as plain lines.
 *
 * Deliberately not structured data: the backend has no opening-hours model, so
 * anything computed from this would be a second source of truth about when the
 * business is open. Availability comes from the roster, through the booking
 * flow; these lines are for a visitor deciding whether to drive over.
 */
export const openingHours: { days: Localized; hours: string }[] = [
  { days: { mn: "Даваа – Баасан", en: "Mon – Fri" }, hours: "09:00 – 19:00" },
  { days: { mn: "Бямба – Ням", en: "Sat – Sun" }, hours: "10:00 – 17:00" },
];

/**
 * The about section. Paragraphs, not one blob, because the second one is
 * hidden behind "read more" on a phone.
 */
export const about: { title: Localized; paragraphs: Localized[] } = {
  title: {
    mn: "Яагаад бид гэж?",
    en: "Why us",
  },
  paragraphs: [
    {
      mn: "Бид машин бүрийг гараар угаадаг. Хөөс, ус, даавуу — тэгээд л болоо. Гүйлгээ бүрийг нэг угаагч эхнээс нь дуустал хийж, ажлаа өөрөө хариуцдаг.",
      en: "Every car is washed by hand. Foam, water, cloth — that is the whole method. One washer takes a car from start to finish and answers for the result.",
    },
    {
      mn: "Цаг захиалга нь жинхэнэ цаг: захиалсан минутдаа таны машин угаалгын байранд ордог. Тиймээс дараалалд хүлээх шаардлагагүй.",
      en: "A booking is a real time slot, not a place in a queue: your car goes in at the minute you booked, so there is nothing to wait in.",
    },
  ],
};

/** Legal footer line. TODO: the registered company name. */
export const legalName: Localized = {
  mn: "Жишээ ХХК",
  en: "Example LLC",
};
