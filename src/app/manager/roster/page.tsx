import { Suspense } from "react";

import { RosterScreen } from "../_components/roster-screen";

export const metadata = { title: "Roster · Car Wash" };

export default function ManagerRosterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <RosterScreen />
    </Suspense>
  );
}
