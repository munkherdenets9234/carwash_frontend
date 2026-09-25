import { cookies } from "next/headers";
import { Suspense } from "react";

import { parseSessionUser, USER_COOKIE } from "@/lib/api/server";

import { EmployeeTimesheetScreen } from "../_components/timesheet-screen";

export const metadata = { title: "Миний цаг · Car Wash" };

// See employee/page.tsx for why this reads the session cookie itself rather
// than receiving it from the layout.
export default async function EmployeeTimesheetPage() {
  const store = await cookies();
  const user = parseSessionUser(store.get(USER_COOKIE)?.value);

  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Ачааллаж байна…</div>}>
      <EmployeeTimesheetScreen name={user?.name} email={user?.email} />
    </Suspense>
  );
}
