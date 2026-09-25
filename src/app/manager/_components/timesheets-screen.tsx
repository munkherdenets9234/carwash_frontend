"use client";

import { PageHeader } from "@/components/app/page-header";
import { RangePicker } from "@/components/app/range-picker";
import { Stat, StatRow } from "@/components/app/stat";
import { DataState } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { useQueryParam } from "@/hooks/use-query-param";
import type { StaffMember, Timesheet } from "@/lib/api/types";
import { addDays, businessToday, formatDay, formatDistance, formatHours, formatTime } from "@/lib/utils";

export function TimesheetsScreen() {
  const today = businessToday();
  const [from, setFrom] = useQueryParam("from", addDays(today, -6));
  const [to, setTo] = useQueryParam("to", today);
  const [employeeId, setEmployeeId] = useQueryParam("employee_id", "");

  const sheet = useApi<Timesheet>("manager/timesheets", {
    from,
    to,
    employee_id: employeeId || undefined,
  });
  const staff = useApi<StaffMember[]>("manager/staff");
  const employees = (staff.data ?? []).filter((person) => person.role === "employee");

  return (
    <>
      <PageHeader
        title="Ирцийн бүртгэл"
        actions={
          <>
            <Select
              aria-label="Ажилтан"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-[11rem]"
            >
              <option value="">Бүгд</option>
              {employees.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
            <RangePicker
              from={from}
              to={to}
              onChange={(next) => {
                setFrom(next.from);
                setTo(next.to);
              }}
            />
          </>
        }
      />

      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <DataState query={sheet}>
          {(data) => (
            <>
              <StatRow>
                <Stat label="Цаг" value={data.worked_hours.toFixed(1)} />
                <Stat label="Бүртгэл" value={data.total_entries} />
                <Stat
                  label="Нээлттэй"
                  value={data.open_entries}
                  hint={data.open_entries > 0 ? "Гарсан цаг бүртгэгдэх хүртэл 0 цаг тоологдоно" : undefined}
                  emphasis={data.open_entries > 0}
                />
              </StatRow>

              {data.entries.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  Энэ хугацаанд ирц бүртгэгдээгүй байна.
                </p>
              ) : (
                <div className="rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ажилтан</TableHead>
                        <TableHead>Өдөр</TableHead>
                        <TableHead>Байршил</TableHead>
                        <TableHead>Ирсэн</TableHead>
                        <TableHead>Явсан</TableHead>
                        <TableHead>Ирсэн/явсан зай</TableHead>
                        <TableHead className="text-right">Цаг</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.entries.map((entry) => (
                        <TableRow key={entry.id} className={entry.running ? "bg-warning/5" : undefined}>
                          <TableCell className="font-semibold">{entry.employee.name ?? "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatDay(entry.clock_in_at)}</TableCell>
                          <TableCell className="text-muted-foreground">{entry.location.name ?? "—"}</TableCell>
                          <TableCell className="font-mono text-[13px]">{formatTime(entry.clock_in_at)}</TableCell>
                          <TableCell className="font-mono text-[13px]">
                            {entry.running ? (
                              <Badge tone="warning">Ажиллаж байна</Badge>
                            ) : (
                              formatTime(entry.clock_out_at)
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-[13px] text-muted-foreground">
                            {/* Both readings, because this column is the
                                evidence a disputed shift turns on. A far
                                clock-out is flagged, never blocked. */}
                            {formatDistance(entry.clock_in_distance_m)} / {formatDistance(entry.clock_out_distance_m)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {entry.running ? "—" : formatHours(entry.worked_minutes / 60)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <p className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
                Ажилтан яг ижил мөрүүдийг зайн хамт харна. Байршлаас хол гарсан ч бүртгэгдэнэ, татгалзахгүй — гэртээ
                харьсан хүн ирцтэй үлдэж болохгүй.
              </p>
            </>
          )}
        </DataState>
      </div>
    </>
  );
}
