// Customer reviews shown on the public site.
//
// The API has no review endpoint, so these are static. When one appears, this
// module keeps its shape and `reviews` becomes the fallback for a fetch — the
// sections read `Review[]` and do not care where it came from.
//
// TODO: every entry below is an example. Replace them with reviews the
// business actually received, and do not publish a name without permission.

import type { Localized } from "./site";

export interface Review {
  id: string;
  /** Shown as written. Names are not translated. */
  author: string;
  /** ISO day, formatted for display in the visitor's language. */
  date: string;
  /** 1–5. Anything outside that range is a data error, not a design case. */
  rating: number;
  body: Localized;
}

export const reviews: Review[] = [
  {
    id: "r1",
    author: "Б. Мөнхбат",
    date: "2026-09-02",
    rating: 5,
    body: {
      mn: "Товлосон цагтаа яг орлоо. Машин маань шинэ мэт болж, дугуйны хөө бүрэн арилсан байсан. Ажилтан нь юу хийж байгаагаа тайлбарлаж өгсөн нь таалагдсан.",
      en: "Went in exactly at the booked time. The car came out looking new and the brake dust was completely gone. I liked that the washer explained what he was doing.",
    },
  },
  {
    id: "r2",
    author: "Emily Johnson",
    date: "2026-08-21",
    rating: 5,
    body: {
      mn: "Салоны бүрэн цэвэрлэгээ авсан. Суудлын завсар, агаарын хоолой хүртэл цэвэрлэсэн байсан. Үнэ нь ажлынхаа хэмжээнд тохирсон.",
      en: "Booked the full interior clean. They got into the seat rails and even the air vents. The price matched the amount of work that went in.",
    },
  },
  {
    id: "r3",
    author: "Ж. Энхтүвшин",
    date: "2026-08-14",
    rating: 4,
    body: {
      mn: "Хурдан, цэгцтэй. Ганцхан зүйл — хүлээх хэсэгт суудал цөөн байна. Угаалгын чанарт гомдолгүй.",
      en: "Fast and tidy. My one note is that the waiting area is short on seats. No complaints about the wash itself.",
    },
  },
];
