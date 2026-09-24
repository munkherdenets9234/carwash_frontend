import { getBusiness } from "@/lib/api/public";

import { RegisterScreen } from "./_components/register-screen";

export const metadata = { title: "Create an account · Car Wash" };

export default async function RegisterPage() {
  const business = await getBusiness();

  return <RegisterScreen businessName={business?.name} />;
}
