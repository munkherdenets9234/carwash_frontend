import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { parseSessionUser, USER_COOKIE } from "@/lib/api/server";

export const metadata = { title: "Employee · Car Wash" };

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const user = parseSessionUser(store.get(USER_COOKIE)?.value);

  if (!user) redirect("/login?next=/employee");
  if (user.role !== "employee") redirect("/");

  return <>{children}</>;
}
