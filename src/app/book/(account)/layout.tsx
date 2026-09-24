import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { parseSessionUser, USER_COOKIE } from "@/lib/api/server";

/**
 * The half of /book that needs an account.
 *
 * This guard used to sit at src/app/book/layout.tsx and so covered the whole
 * area, including the booking form. That was right while booking required
 * registration and wrong the moment it stopped: a visitor who pressed Book
 * was bounced to a sign-in page by a redirect that the proxy's public-path
 * list could do nothing about, because this one runs later and independently.
 *
 * A route group is what separates them. (account) does not appear in any URL
 * — /book and /book/bookings are unchanged — it exists so that the guard sits
 * with the pages it guards rather than over their neighbours. Anything added
 * in here is protected by construction; anything added beside it is public by
 * construction, and neither is a thing to remember.
 *
 * What belongs here is a HISTORY: the garage, and every booking a person has
 * made. Booking one wash, and finding it again with its code, do not.
 */
export default async function CustomerAccountLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const user = parseSessionUser(store.get(USER_COOKIE)?.value);

  if (!user) redirect("/login?next=/book");
  if (user.role !== "customer") redirect("/");

  return <>{children}</>;
}
