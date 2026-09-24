import { getBusiness } from "@/lib/api/public";

import { GarageScreen } from "../_components/garage-screen";

export const metadata = { title: "My garage · Car Wash" };

export default async function GaragePage() {
  const business = await getBusiness();

  return <GarageScreen businessName={business?.name} />;
}
