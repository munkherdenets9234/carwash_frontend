import "server-only";

import { photos as fallbackPhotos, GALLERY_TAGS, type GalleryTag, type Photo } from "@/content/gallery";
import type { Localized } from "@/content/site";

import { listMedia } from "./public";
import type { Media } from "./types";

/**
 * What the site draws: photographs uploaded by the business, or the shipped
 * placeholders when there are none.
 *
 * The fallback is not defensive padding. The content modules were written so
 * the site is complete and honest before any photograph exists — an entry
 * with no `src` renders a labelled frame rather than a broken tile — and that
 * is exactly the state a business is in on its first day. Losing it the
 * moment uploads arrived would mean a new tenant's home page is a row of
 * broken images instead of a row of captions.
 *
 * So: uploaded photographs when there are any, placeholders when there are
 * not, and the components below cannot tell the difference.
 */
export interface SiteMedia {
  /** The home page cover. Undefined falls through to the first gallery tile. */
  hero?: Photo;
  /** The photograph beside the about text. */
  about?: Photo;
  /** The album, in display order. */
  gallery: Photo[];
}

/** Turns an uploaded image into the shape the site components already take. */
function toPhoto(m: Media): Photo {
  return {
    id: m.id,
    src: m.url,
    width: m.width,
    height: m.height,
    // The API sends the whole locale map; Localized is the same shape, so
    // this is a cast in spirit rather than a conversion. A missing language
    // falls back to the other one at render time.
    alt: { mn: m.alt.mn ?? m.alt.en ?? "", en: m.alt.en ?? m.alt.mn ?? "" } satisfies Localized,
    tag: isGalleryTag(m.tag) ? m.tag : "exterior",
    feature: m.feature,
  };
}

function isGalleryTag(tag: string | undefined): tag is GalleryTag {
  return !!tag && (GALLERY_TAGS as readonly string[]).includes(tag);
}

/**
 * Reads the business's photographs once per render pass.
 *
 * Every section calls this independently rather than being handed the result
 * from one place. Next dedupes the underlying fetch within a pass, so that is
 * still one request — and it means adding a photograph to a new section is a
 * call, not a prop threaded through three components that did not care.
 */
export async function getSiteMedia(): Promise<SiteMedia> {
  const uploaded = await listMedia();

  if (!uploaded || uploaded.length === 0) {
    // Nothing uploaded, or the API could not answer. Either way the site
    // renders its placeholders, which is what it did before uploads existed.
    return { gallery: fallbackPhotos };
  }

  const gallery = uploaded.filter((m) => m.role === "gallery").map(toPhoto);

  return {
    hero: pick(uploaded, "hero"),
    about: pick(uploaded, "about"),
    // A business that uploaded only a cover still needs an album to draw;
    // the placeholders fill it rather than leaving the gallery empty.
    gallery: gallery.length > 0 ? gallery : fallbackPhotos,
  };
}

function pick(items: Media[], role: Media["role"]): Photo | undefined {
  const found = items.find((m) => m.role === role);
  return found ? toPhoto(found) : undefined;
}
