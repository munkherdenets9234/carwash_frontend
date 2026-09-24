import { getBusiness } from "@/lib/api/public";

import { FindBookingScreen } from "../_components/find-booking-screen";

export const metadata = { title: "Find your booking · Car Wash" };

export default async function FindBookingPage() {
  const business = await getBusiness();

  return <FindBookingScreen businessName={business?.name} />;
}
