import { cookies } from "next/headers";

import { parseSessionUser, USER_COOKIE } from "@/lib/api/server";

import { TodayScreen } from "./_components/today-screen";

export const metadata = { title: "Өнөөдөр · Car Wash" };

/**
 * Reads the session cookie again here, even though `layout.tsx` already
 * read it to decide whether to redirect. A layout cannot pass props to the
 * page it wraps — `children` is opaque — so the only way this screen learns
 * who is signed in, to show it in the `lg`+ sidebar, is to ask again itself.
 * The read is a cheap, synchronous cookie parse, not a network call.
 */
export default async function EmployeeTodayPage() {
  const store = await cookies();
  const user = parseSessionUser(store.get(USER_COOKIE)?.value);

  return <TodayScreen name={user?.name} email={user?.email} />;
}
