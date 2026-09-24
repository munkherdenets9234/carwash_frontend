import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { localeFromAcceptLanguage, localePath } from "@/lib/i18n";

/**
 * `/` has no content of its own: every page of the public site lives under a
 * language prefix so each language has its own address.
 *
 * The visitor's own `Accept-Language` picks which one, falling back to
 * Mongolian. This replaced an older redirect that sent people to whichever
 * signed-in area matched their cookie — the front door of a car wash belongs
 * to its customers, not to whoever happens to be logged in, and the header
 * carries a sign-in link for the staff who need one.
 */
export default async function RootPage() {
  const requestHeaders = await headers();
  redirect(localePath(localeFromAcceptLanguage(requestHeaders.get("accept-language"))));
}
