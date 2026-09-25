import { cookies } from "next/headers";

import { parseSessionUser, USER_COOKIE } from "@/lib/api/server";

import { JobsScreen } from "../_components/jobs-screen";

export const metadata = { title: "Ажлууд · Car Wash" };

// See employee/page.tsx for why this reads the session cookie itself rather
// than receiving it from the layout.
export default async function EmployeeJobsPage() {
  const store = await cookies();
  const user = parseSessionUser(store.get(USER_COOKIE)?.value);

  return <JobsScreen name={user?.name} email={user?.email} />;
}
