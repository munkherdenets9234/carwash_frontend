// Server-side reads of the two endpoints that need no sign-in.
//
// The BFF proxy at /api/bff/* deliberately refuses anonymous callers, so the
// public site does not use it: these Server Components call the Go API
// directly with the tenant key, which never leaves the server. That also means
// the price list is in the HTML, which is the point — a brochure page whose
// prices arrive by client fetch is a brochure page with no prices in it as far
// as a search engine is concerned.

import "server-only";

import { API_BASE, TENANT_API_KEY } from "./server";
import type { ApiEnvelope, Business, Location, Media, WashService } from "./types";

/**
 * Five minutes.
 *
 * Prices and branches change a few times a year, so this is not about
 * freshness — it is about the shopfront surviving a backend restart. Within
 * the window the cached copy is served and nobody sees an empty page.
 */
const REVALIDATE_SECONDS = 300;

async function getPublic<T>(path: string): Promise<T | null> {
  if (!TENANT_API_KEY) {
    // Misconfiguration, not a runtime failure: without the key the backend
    // cannot tell which business is asking and answers 401 to everything.
    console.error(`[public-api] TENANT_API_KEY is not set; skipping GET ${path}`);
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/${path}`, {
      headers: { "X-API-Key": TENANT_API_KEY },
      next: { revalidate: REVALIDATE_SECONDS, tags: ["catalogue"] },
    });
    if (!res.ok) {
      console.error(`[public-api] GET ${path} → ${res.status}`);
      return null;
    }
    const envelope = (await res.json()) as ApiEnvelope<T>;
    if (!envelope.success) {
      console.error(`[public-api] GET ${path} → ${envelope.error?.code ?? "unknown error"}`);
      return null;
    }
    return envelope.data ?? null;
  } catch (err) {
    // Swallowed on purpose. A marketing page that 500s because the API is
    // down is worse than one that shows an address and a phone number: the
    // sections below each render a stated fallback when they get null.
    console.error(`[public-api] GET ${path} failed`, err);
    return null;
  }
}

/** The active price list, or null when the API could not answer. */
export function listServices(): Promise<WashService[] | null> {
  return getPublic<WashService[]>("services");
}

/** The active branches, or null when the API could not answer. */
export function listLocations(): Promise<Location[] | null> {
  return getPublic<Location[]>("locations");
}

/**
 * The tenant's display identity — the trading name this storefront puts on
 * its header, footer and hero.
 *
 * Fetched rather than compiled in, so renaming the business in the platform
 * console reaches the site on the next revalidation instead of needing a
 * rebuild. `content/site.ts` still holds a name, and it is now a fallback for
 * exactly one case: the API could not answer and a header still has to render
 * something.
 *
 * Next dedupes identical fetches within a render pass, so the header, the
 * footer and the hero calling this independently is one request, not three.
 */
export function getBusiness(): Promise<Business | null> {
  return getPublic<Business>("tenant");
}

/**
 * Every photograph the business has published, in display order.
 *
 * Active only — the API decides that, not this client. A withdrawn image is
 * still in the back office so it can be brought back, and must not reach a
 * visitor; keeping that rule on the server means a second client cannot get
 * it wrong.
 */
export function listMedia(): Promise<Media[] | null> {
  return getPublic<Media[]>("media");
}
