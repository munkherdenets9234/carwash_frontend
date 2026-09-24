"use client";

import { useState } from "react";

import { toast } from "sonner";

import { DayPicker } from "@/components/app/day-picker";
import { PageHeader } from "@/components/app/page-header";
import { DataState } from "@/components/app/states";
import { ReservationBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { useQueryParam } from "@/hooks/use-query-param";
import { api, errorMessage } from "@/lib/api/client";
import type { EmployeeCard, StaffReservation } from "@/lib/api/types";
import { businessToday, formatMNT, formatRange } from "@/lib/utils";

export function BookingsScreen() {
  const [day, setDay] = useQueryParam("day", businessToday());
  const [status, setStatus] = useQueryParam("status", "");

  const bookings = useApi<StaffReservation[]>("manager/reservations", {
    from: day,
    to: day,
    status: status || undefined,
  });
  const employees = useApi<EmployeeCard[]>("customer/employees");

  const [selected, setSelected] = useState<StaffReservation | null>(null);

  return (
    <>
      <PageHeader
        title="Bookings"
        actions={
          <>
            <Select
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-[10.5rem]"
            >
              <option value="">All statuses</option>
              <option value="booked">Booked</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No show</option>
            </Select>
            <DayPicker value={day} onChange={setDay} />
          </>
        }
      />

      <div className="flex flex-col gap-6 p-6 sm:p-8 xl:flex-row">
        <div className="min-w-0 flex-1">
          <DataState
            query={bookings}
            isEmpty={(rows) => rows.length === 0}
            empty={{ title: "No bookings on this day", description: "Try another day, or clear the status filter." }}
          >
            {(rows) => (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Car</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const open = row.status === "booked" || row.status === "in_progress";
                      return (
                        <TableRow key={row.id} className={selected?.id === row.id ? "bg-accent/60" : undefined}>
                          <TableCell className="whitespace-nowrap font-mono text-[13px]">
                            {formatRange(row.start_at, row.end_at)}
                          </TableCell>
                          <TableCell className="font-mono text-[13px]">{row.car.plate || "—"}</TableCell>
                          <TableCell>{row.service.name ?? "—"}</TableCell>
                          <TableCell className="font-semibold">{row.employee.name ?? "—"}</TableCell>
                          <TableCell>
                            <ReservationBadge status={row.status} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{formatMNT(row.price_mnt)}</TableCell>
                          <TableCell className="text-right">
                            {/* Only an open job can move. Rendering a disabled
                                button on a completed one would invite the
                                question; leaving it out answers it. */}
                            {open && (
                              <Button variant="outline" size="sm" onClick={() => setSelected(row)}>
                                Reassign
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </DataState>
        </div>

        {selected && (
          <ReassignPanel
            booking={selected}
            employees={employees.data ?? []}
            onClose={() => setSelected(null)}
            onDone={() => {
              setSelected(null);
              bookings.refresh();
            }}
          />
        )}
      </div>
    </>
  );
}

function ReassignPanel({
  booking,
  employees,
  onClose,
  onDone,
}: {
  booking: StaffReservation;
  employees: EmployeeCard[];
  onClose: () => void;
  onDone: () => void;
}) {
  const others = employees.filter((e) => e.id !== booking.employee.id);
  const [employeeId, setEmployeeId] = useState(others[0]?.id ?? "");
  const [pending, setPending] = useState(false);

  async function reassign() {
    if (!employeeId) return;
    setPending(true);
    try {
      await api.put(`manager/reservations/${booking.id}/assign`, { employee_id: employeeId });
      toast.success("Reassigned", { description: "The bonus moves with the job." });
      onDone();
    } catch (err) {
      // The API answers 409 SLOT_UNAVAILABLE when the new employee is off shift
      // or already booked. Its message says which, so it is shown verbatim
      // rather than replaced with a guess.
      toast.error("Could not reassign", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="h-fit w-full shrink-0 xl:w-80">
      <CardHeader>
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {formatRange(booking.start_at, booking.end_at)} · {booking.car.plate}
        </span>
        <CardTitle>Reassign this job</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field id="reassign-to" label="Move to">
          <Select id="reassign-to" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            {others.length === 0 && <option value="">No other employee available</option>}
            {others.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-baseline gap-3 rounded-md border border-border bg-muted px-3 py-2.5">
          <span className="flex-1 text-[13px] text-muted-foreground">Bonus moves with it</span>
          <span className="text-sm font-bold tabular-nums">{formatMNT(booking.bonus_mnt)}</span>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={reassign} disabled={pending || !employeeId}>
            {pending ? "Reassigning…" : "Reassign"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Availability is re-checked when you confirm: if that employee is off shift or already booked at this time, the
          API refuses and says which.
        </p>
      </CardContent>
    </Card>
  );
}
