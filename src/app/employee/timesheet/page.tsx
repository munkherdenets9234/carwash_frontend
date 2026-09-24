import { Suspense } from "react";

import { EmployeeTimesheetScreen } from "../_components/timesheet-screen";

export const metadata = { title: "My hours · Car Wash" };

export default function EmployeeTimesheetPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <EmployeeTimesheetScreen />
    </Suspense>
  );
}
