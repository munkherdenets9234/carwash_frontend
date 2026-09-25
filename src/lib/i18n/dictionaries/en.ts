// English UI copy, and the shape every other dictionary must match.
//
// This file holds CHROME only — labels, actions, headings, states. Anything a
// business owner would want to reword without a developer (about paragraphs,
// reviews, opening hours, addresses) lives in `src/content/*`, keyed by
// locale. The split is deliberate: chrome changes when the interface changes,
// copy changes when the business does.

export const en = {
  nav: {
    services: "Services",
    about: "About us",
    reviews: "Reviews",
    gallery: "Gallery",
    findUs: "Find us",
    book: "Book",
    signIn: "Sign in",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    skipToContent: "Skip to content",
  },
  hero: {
    bookCta: "Book a wash",
    callCta: "Call us",
    // {count} rather than a bare number so a language can put the word first.
    ratingSummary: "{count} reviews",
    ratingSummaryOne: "{count} review",
    ratingLabel: "Rated {rating} out of 5",
  },
  services: {
    eyebrow: "Services",
    title: "Pick a wash",
    subtitle: "Prices are per wash. Pay at the site — nothing is taken when you book.",
    book: "Book",
    minutes: "min",
    hours: "h",
    unavailable: "The price list is not available right now. Call us and we will tell you over the phone.",
    empty: "No services are listed yet.",
  },
  about: {
    eyebrow: "About us",
    readMore: "Read more",
    stats: {
      branches: "Branches",
      services: "Services",
      since: "Serving since",
    },
  },
  reviews: {
    eyebrow: "What guests say",
    title: "Reviews",
    readMore: "Read more",
    readLess: "Read less",
    previous: "Previous review",
    next: "Next review",
    ratingLabel: "Rated {rating} out of 5",
    empty: "No reviews yet.",
  },
  gallery: {
    eyebrow: "Gallery",
    title: "Our work",
    viewAll: "View the gallery",
    all: "All",
    loadMore: "Load more",
    showing: "Showing {shown} of {total}",
    open: "Open photo",
    close: "Close",
    previous: "Previous photo",
    next: "Next photo",
    empty: "No photos yet.",
    tags: {
      exterior: "Exterior",
      interior: "Interior",
      detailing: "Detailing",
      beforeAfter: "Before & after",
    },
  },
  findUs: {
    eyebrow: "Find us",
    title: "Where to find us",
    directions: "Get directions",
    mapTitle: "Map of {name}",
    openingHours: "Opening hours",
    phone: "Phone",
    email: "Email",
    unavailable: "Our branch list is not available right now. The phone number below always works.",
  },
  footer: {
    site: "Site",
    findUs: "Find us",
    contact: "Contact",
    privacy: "Privacy",
    terms: "Terms",
    rights: "All rights reserved.",
  },
  meta: {
    homeTitle: "Car wash in Ulaanbaatar",
    homeDescription:
      "Hand car wash, interior cleaning and detailing. Book a time online in about a minute and pay at the site.",
    galleryTitle: "Gallery",
    galleryDescription: "Photographs of washes and detailing work.",
  },
} as const;

/**
 * The contract every dictionary keeps.
 *
 * Derived from the English one rather than declared separately so a new key
 * cannot be added here and silently forgotten in Mongolian — `mn.ts` fails to
 * compile until it has the same key with the same shape.
 */
export type Dictionary = {
  readonly [K in keyof typeof en]: {
    readonly [P in keyof (typeof en)[K]]: (typeof en)[K][P] extends string
      ? string
      : { readonly [Q in keyof (typeof en)[K][P]]: string };
  };
};
