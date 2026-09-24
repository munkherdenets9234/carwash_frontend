import { Suspense } from "react";

import { BookingsScreen } from "../_components/bookings-screen";

export const metadata = { title: "Bookings · Car Wash" };

export default function ManagerBookingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <BookingsScreen />
    </Suspense>
  );
}
