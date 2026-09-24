// The photo gallery.
//
// Photographs are files in `public/media/gallery/`; this module is the index
// of them. An entry with no `src` renders as a labelled placeholder rather
// than a broken image, so the site is complete and honest before the
// photographs arrive — drop the file in, add the path here, and the tile
// becomes the real thing.
//
// TODO: shoot and add the real photographs.

import type { Localized } from "./site";

export const GALLERY_TAGS = ["exterior", "interior", "detailing", "beforeAfter"] as const;

export type GalleryTag = (typeof GALLERY_TAGS)[number];

export interface Photo {
  id: string;
  /** Path under `public/`, e.g. "/media/gallery/wash-01.jpg". Absent = placeholder. */
  src?: string;
  /** Intrinsic size, needed by next/image. Required once `src` is set. */
  width?: number;
  height?: number;
  /** Describes the photograph for someone who cannot see it. Never decorative here. */
  alt: Localized;
  tag: GalleryTag;
  /** Tiles that carry more weight in the grid. Keep it to two or three. */
  feature?: boolean;
}

export const photos: Photo[] = [
  { id: "g01", tag: "exterior", feature: true, alt: { mn: "Угаасны дараах гадна тал", en: "Exterior after a wash" } },
  { id: "g02", tag: "detailing", alt: { mn: "Гэрлийн арчилгаа", en: "Headlight detailing" } },
  { id: "g03", tag: "interior", alt: { mn: "Салоны цэвэрлэгээ", en: "Interior cleaning" } },
  { id: "g04", tag: "exterior", alt: { mn: "Хөөсөн угаалга", en: "Foam wash" } },
  { id: "g05", tag: "detailing", feature: true, alt: { mn: "Өнгөлгөөний ажил", en: "Paint polishing" } },
  { id: "g06", tag: "interior", alt: { mn: "Хөтчийн суудлын хэсэг", en: "Driver's cabin" } },
  { id: "g07", tag: "beforeAfter", alt: { mn: "Өмнө ба дараа", en: "Before and after" } },
  { id: "g08", tag: "exterior", alt: { mn: "Дугуй, дискний цэвэрлэгээ", en: "Wheels and rims" } },
  { id: "g09", tag: "detailing", alt: { mn: "Хаалганы хүрээний арчилгаа", en: "Door frame detailing" } },
  { id: "g10", tag: "interior", alt: { mn: "Салоны хийн хоолой", en: "Interior air vents" } },
  { id: "g11", tag: "beforeAfter", alt: { mn: "Гадна талын харьцуулалт", en: "Exterior comparison" } },
];

/** How many tiles the gallery page shows before "load more". */
export const GALLERY_PAGE_SIZE = 8;
