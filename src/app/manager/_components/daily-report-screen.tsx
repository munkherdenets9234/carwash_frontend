"use client";

import { DayPicker } from "@/components/app/day-picker";
import { PageHeader } from "@/components/app/page-header";
import { Stat, StatRow } from "@/components/app/stat";
import { DataState } from "@/components/app/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { useQueryParam } from "@/hooks/use-query-param";
import type { DailyReport } from "@/lib/api/types";
import { businessToday, formatHours, formatMNT } from "@/lib/utils";

export function DailyReportScreen() {
  const [day, setDay] = useQueryParam("day", businessToday());
  const query = useApi<DailyReport>("manager/reports/daily", { day });

  return (
    <>
      <PageHeader
        eyebrow={new Date(`${day}T00:00:00`).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title="Day report"
        actions={<DayPicker value={day} onChange={setDay} label="Report day" />}
      />

      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <DataState query={query}>
          {(report) => (
            <>
              <StatRow>
                <Stat label="Washes" value={report.washes} />
                <Stat label="Revenue" value={formatMNT(report.revenue_mnt)} />
                <Stat label="Bonus owed" value={formatMNT(report.bonus_mnt)} />
                <Stat label="Net" value={formatMNT(report.net_mnt)} emphasis />
              </StatRow>

              <section className="flex flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">By employee</h2>

                {report.employees.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    Nobody worked and nothing was sold on this day.
                  </p>
                ) : (
                  <div className="rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead className="text-right">Washes</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Bonus</TableHead>
                          <TableHead className="text-right">Hours</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.employees.map((row) => (
                          <TableRow key={row.employee_id}>
                            <TableCell className="font-semibold">{row.name}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.washes}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.revenue_mnt ? formatMNT(row.revenue_mnt) : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.bonus_mnt ? formatMNT(row.bonus_mnt) : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {/* Zero hours with washes on the board means the
                                  entry is still open. Saying so beats a bare
                                  0.0, which reads as "did not work". */}
                              {row.worked_minutes === 0 && row.washes > 0 ? (
                                <span className="text-warning">still in</span>
                              ) : (
                                formatHours(row.worked_hours)
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <p className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
                  Hours and washes are separate figures, neither derived from the other — a full shift with nothing sold
                  is the row worth noticing. Amounts are what each wash was sold for at the time it was booked, so
                  editing the price list never changes a day already reported.
                </p>
              </section>
            </>
          )}
        </DataState>
      </div>
    </>
  );
}
