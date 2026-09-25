import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { parseSessionUser, USER_COOKIE } from "@/lib/api/server";

import { ManagerMobileNav, ManagerSidebar } from "./_components/manager-nav";

export const metadata = { title: "Удирдлагын хэсэг · Car Wash" };

/**
 * The back-office shell.
 *
 * The role is re-checked here even though `proxy.ts` already gated the route:
 * the proxy is a navigation convenience and can be bypassed by a direct
 * request in some deployments, and a layout that renders the manager chrome
 * for a customer would be a confusing lie even with every call behind it
 * failing. Neither check is the real one — the API decides — but the shell
 * should agree with it.
 */
export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const user = parseSessionUser(store.get(USER_COOKIE)?.value);

  if (!user) redirect("/login?next=/manager");
  if (user.role !== "manager") redirect("/");

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <ManagerSidebar name={user.name} email={user.email} />
      <ManagerMobileNav name={user.name} email={user.email} />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
