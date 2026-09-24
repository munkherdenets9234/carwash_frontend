import { Suspense } from "react";

import { TimesheetsScreen } from "../_components/timesheets-screen";

export const metadata = { title: "Timesheets · Car Wash" };

export default function ManagerTimesheetsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <TimesheetsScreen />
    </Suspense>
  );
}
