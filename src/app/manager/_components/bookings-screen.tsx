"use client";

import Link from "next/link";

import { DayPicker } from "@/components/app/day-picker";
import { PageHeader } from "@/components/app/page-header";
import { DataState } from "@/components/app/states";
import { ReservationBadge } from "@/components/app/status-badge";
import { Select } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { useQueryParam } from "@/hooks/use-query-param";
import type { StaffReservation } from "@/lib/api/types";
import { businessToday, formatMNT, formatRange } from "@/lib/utils";

export function BookingsScreen() {
  const [day, setDay] = useQueryParam("day", businessToday());
  const [status, setStatus] = useQueryParam("status", "");

  const bookings = useApi<StaffReservation[]>("manager/reservations", {
    from: day,
    to: day,
    status: status || undefined,
  });

  return (
    <>
      <PageHeader
        title="Захиалгууд"
        actions={
          <>
            <Select
              aria-label="Төлөв"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-[10.5rem]"
            >
              <option value="">Бүх төлөв</option>
              <option value="booked">Захиалсан</option>
              <option value="in_progress">Хийгдэж байна</option>
              <option value="completed">Дууссан</option>
              <option value="cancelled">Цуцалсан</option>
              <option value="no_show">Ирээгүй</option>
            </Select>
            <DayPicker value={day} onChange={setDay} />
          </>
        }
      />

      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <DataState
          query={bookings}
          isEmpty={(rows) => rows.length === 0}
          empty={{
            title: "Энэ өдөр захиалга алга",
            description: "Өөр өдөр сонгох, эсвэл төлөвийн шүүлтүүрийг цэвэрлэнэ үү.",
          }}
        >
          {(rows) => (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Цаг</TableHead>
                    <TableHead>Машин</TableHead>
                    {/* A phone shows time, car and washer. The rest is a tap
                        away on the detail page, and four more columns squeezed
                        into 375px makes the three that matter unreadable. */}
                    <TableHead className="hidden md:table-cell">Үйлчилгээ</TableHead>
                    <TableHead>Ажилтан</TableHead>
                    <TableHead className="hidden md:table-cell">Төлөв</TableHead>
                    <TableHead className="hidden text-right md:table-cell">Үнэ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} className="relative hover:bg-muted/50">
                      <TableCell className="whitespace-nowrap font-mono text-[13px]">
                        {formatRange(row.start_at, row.end_at)}
                      </TableCell>
                      <TableCell className="font-mono text-[13px]">
                        {/* One real anchor, stretched over the whole row by
                            the pseudo-element: the row is clickable anywhere,
                            and it is still a link a keyboard can reach and a
                            middle click can open in a new tab. */}
                        <Link
                          href={`/manager/bookings/${row.id}`}
                          className="after:absolute after:inset-0 hover:underline"
                        >
                          {row.car.plate || "—"}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{row.service.name ?? "—"}</TableCell>
                      <TableCell className="font-semibold">{row.employee.name ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <ReservationBadge status={row.status} />
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">
                        {formatMNT(row.price_mnt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DataState>
      </div>
    </>
  );
}
