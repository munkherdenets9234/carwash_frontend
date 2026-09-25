"use client";

import { DayPicker } from "@/components/app/day-picker";
import { PageHeader } from "@/components/app/page-header";
import { Stat, StatRow } from "@/components/app/stat";
import { DataState } from "@/components/app/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { useQueryParam } from "@/hooks/use-query-param";
import type { DailyReport } from "@/lib/api/types";
import { businessToday, formatDay, formatHours, formatMNT } from "@/lib/utils";

export function DailyReportScreen() {
  const [day, setDay] = useQueryParam("day", businessToday());
  const query = useApi<DailyReport>("manager/reports/daily", { day });

  return (
    <>
      <PageHeader
        // formatDay, not toLocaleDateString("mn-MN") — see lib/utils.ts on
        // why asking Intl for Mongolian words is not reliable across browsers.
        eyebrow={formatDay(`${day}T00:00:00`)}
        title="Өдрийн тайлан"
        actions={<DayPicker value={day} onChange={setDay} label="Тайлангийн өдөр" />}
      />

      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <DataState query={query}>
          {(report) => (
            <>
              <StatRow>
                <Stat label="Угаалга" value={report.washes} />
                <Stat label="Орлого" value={formatMNT(report.revenue_mnt)} />
                <Stat label="Өгөх урамшуулал" value={formatMNT(report.bonus_mnt)} />
                <Stat label="Цэвэр дүн" value={formatMNT(report.net_mnt)} emphasis />
              </StatRow>

              <section className="flex flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ажилтнаар</h2>

                {report.employees.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    Энэ өдөр хэн ч ажиллаагүй, юу ч зарагдаагүй байна.
                  </p>
                ) : (
                  <div className="rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ажилтан</TableHead>
                          <TableHead className="text-right">Угаалга</TableHead>
                          <TableHead className="text-right">Орлого</TableHead>
                          <TableHead className="text-right">Урамшуулал</TableHead>
                          <TableHead className="text-right">Цаг</TableHead>
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
                                <span className="text-warning">ажиллаж байна</span>
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
                  Цаг болон угаалгын тоо тус тусдаа бүртгэгдэнэ, нэгээс нь нөгөөг тооцдоггүй — юу ч зарагдаагүй бүтэн
                  ээлж анхаарал татах ёстой мөр юм. Дүнгүүд нь захиалсан үеийн үнэ тул үнийн жагсаалтыг өөрчилсөн ч аль
                  хэдийн тайлагдсан өдрийг өөрчлөхгүй.
                </p>
              </section>
            </>
          )}
        </DataState>
      </div>
    </>
  );
}
