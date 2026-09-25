import { redirect } from "next/navigation";

import { DEFAULT_LOCALE, localePath } from "@/lib/i18n";

/**
 * `/` has no content of its own: every page of the public site lives under a
 * language prefix so each language has its own address.
 *
 * It sends everyone to Mongolian, and does NOT read `Accept-Language`.
 * Negotiation sounds more considerate than it is here: a large share of phones
 * sold in Ulaanbaatar report `en-US` whatever language their owner actually
 * reads, so honouring the header handed the English page to the very
 * customers this site is written for. The header carries a visible language
 * switch, which is a better answer for the minority who do want English than
 * a guess that is wrong for the majority.
 *
 * Deliberately the same in every environment. A redirect that behaves one way
 * on a laptop and another way in production is a bug nobody can reproduce.
 */
export default function RootPage() {
  redirect(localePath(DEFAULT_LOCALE));
}
