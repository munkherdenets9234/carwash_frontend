import { Suspense } from "react";

import { getBusiness } from "@/lib/api/public";

import { BookingFlow } from "../_components/booking-flow";

export const metadata = { title: "Book a wash · Car Wash" };

/**
 * The trading name is fetched HERE and passed down, for the same reason the
 * site layout does it: the flow is a Client Component and cannot read the
 * tenant key or await a server fetch, and fetching once above it is also the
 * only arrangement in which the booking header and the site header cannot
 * end up showing different names.
 */
export default async function NewBookingPage() {
  const business = await getBusiness();

  return (
    <Suspense fallback={<div className="p-10 text-sm text-muted-foreground">Loading…</div>}>
      <BookingFlow businessName={business?.name} />
    </Suspense>
  );
}
