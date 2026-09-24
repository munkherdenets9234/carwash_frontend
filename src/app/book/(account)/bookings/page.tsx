import { getBusiness } from "@/lib/api/public";

import { MyBookingsScreen } from "../../_components/my-bookings-screen";

export const metadata = { title: "My bookings · Car Wash" };

export default async function MyBookingsPage() {
  const business = await getBusiness();

  return <MyBookingsScreen businessName={business?.name} />;
}
