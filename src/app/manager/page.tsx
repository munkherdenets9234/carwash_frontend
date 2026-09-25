import { Suspense } from "react";

import { DailyReportScreen } from "./_components/daily-report-screen";

export const metadata = { title: "Өдрийн тайлан · Car Wash" };

export default function ManagerHomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <DailyReportScreen />
    </Suspense>
  );
}
