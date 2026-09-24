// Mongolian UI copy.
//
// Written to be checked by a native speaker before this goes live: the shape
// is right and the terms are the ordinary ones, but marketing wording is worth
// a second pair of eyes. Every key is typed against `en.ts`, so a missing or
// misspelled one is a build error rather than an English word leaking onto a
// Mongolian page.

import type { Dictionary } from "./en";

export const mn = {
  nav: {
    services: "Үйлчилгээ",
    about: "Бидний тухай",
    reviews: "Сэтгэгдэл",
    gallery: "Зургийн цомог",
    findUs: "Байршил",
    book: "Цаг захиалах",
    signIn: "Нэвтрэх",
    openMenu: "Цэс нээх",
    closeMenu: "Цэс хаах",
    skipToContent: "Үндсэн хэсэг рүү шилжих",
  },
  hero: {
    eyebrow: "Авто угаалга",
    bookCta: "Цаг захиалах",
    bookHint: "Ойролцоогоор нэг минут",
    scroll: "Үйлчилгээг харах",
    galleryTitle: "Цомог",
    galleryLink: "Ажлаа харуулъя",
  },
  services: {
    eyebrow: "Үйлчилгээ",
    title: "Угаалгаа сонгоно уу",
    subtitle: "Үнэ нь нэг удаагийн угаалганх. Захиалахад төлбөр аваагүй — газар дээр нь төлнө.",
    book: "Захиалах",
    minutes: "мин",
    hours: "ц",
    unavailable: "Үнийн жагсаалт одоогоор ачаалагдахгүй байна. Утсаар холбогдвол бид хэлж өгнө.",
    empty: "Одоогоор үйлчилгээ бүртгэгдээгүй байна.",
  },
  about: {
    eyebrow: "Бидний тухай",
    readMore: "Дэлгэрэнгүй",
    stats: {
      branches: "Салбар",
      services: "Үйлчилгээ",
      since: "Үйл ажиллагаа эхэлсэн",
    },
  },
  reviews: {
    eyebrow: "Үйлчлүүлэгчид юу гэж байна",
    title: "Сэтгэгдэл",
    readMore: "Дэлгэрэнгүй",
    readLess: "Хураах",
    previous: "Өмнөх сэтгэгдэл",
    next: "Дараах сэтгэгдэл",
    ratingLabel: "5-аас {rating} үнэлгээ",
    empty: "Одоогоор сэтгэгдэл алга байна.",
  },
  gallery: {
    eyebrow: "Зургийн цомог",
    title: "Бидний ажил",
    viewAll: "Цомгийг бүтнээр нь үзэх",
    all: "Бүгд",
    loadMore: "Цааш үзэх",
    showing: "Нийт {total}-аас {shown}-г харуулж байна",
    open: "Зургийг нээх",
    close: "Хаах",
    previous: "Өмнөх зураг",
    next: "Дараах зураг",
    empty: "Одоогоор зураг алга байна.",
    tags: {
      exterior: "Гадна тал",
      interior: "Салон",
      detailing: "Нарийн арчилгаа",
      beforeAfter: "Өмнө ба дараа",
    },
  },
  findUs: {
    eyebrow: "Байршил",
    title: "Бидэнтэй хаана уулзах вэ",
    directions: "Замын заавар",
    mapTitle: "{name} байршлын газрын зураг",
    openingHours: "Ажиллах цаг",
    phone: "Утас",
    email: "И-мэйл",
    unavailable: "Салбарын жагсаалт одоогоор ачаалагдахгүй байна. Доорх утас үргэлж ажиллана.",
  },
  footer: {
    site: "Хуудсууд",
    findUs: "Байршил",
    contact: "Холбоо барих",
    privacy: "Нууцлал",
    terms: "Үйлчилгээний нөхцөл",
    rights: "Бүх эрх хуулиар хамгаалагдсан.",
  },
  meta: {
    homeTitle: "Улаанбаатар дахь авто угаалга",
    homeDescription:
      "Гар угаалга, салон цэвэрлэгээ, нарийн арчилгаа. Онлайнаар нэг минутын дотор цаг захиалж, газар дээр нь төлнө.",
    galleryTitle: "Зургийн цомог",
    galleryDescription: "Угаалга, арчилгааны ажлын зургууд.",
  },
} satisfies Dictionary;
