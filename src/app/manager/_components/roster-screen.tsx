"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/page-header";
import { RangePicker } from "@/components/app/range-picker";
import { DataState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { useApi } from "@/hooks/use-api";
import { useQueryParam } from "@/hooks/use-query-param";
import { api, errorMessage } from "@/lib/api/client";
import type { Location, Shift, StaffMember } from "@/lib/api/types";
import { addDays, businessToday, formatDay, formatTime, isoDayOf } from "@/lib/utils";

export function RosterScreen() {
  const today = businessToday();
  const [from, setFrom] = useQueryParam("from", today);
  const [to, setTo] = useQueryParam("to", addDays(today, 6));

  const shifts = useApi<Shift[]>("manager/shifts", { from, to });
  const staff = useApi<StaffMember[]>("manager/staff");
  const locations = useApi<Location[]>("manager/locations");

  const employees = (staff.data ?? []).filter((p) => p.role === "employee" && p.status === "active");

  return (
    <>
      <PageHeader
        title="Хуваарь"
        description="Харилцагч зөвхөн ажлын ээлж дотор байгаа цагийг захиалах боломжтой."
        actions={
          <RangePicker
            from={from}
            to={to}
            onChange={(next) => {
              setFrom(next.from);
              setTo(next.to);
            }}
          />
        }
      />

      <div className="flex flex-col gap-6 p-6 sm:p-8 xl:flex-row">
        <div className="min-w-0 flex-1">
          <DataState
            query={shifts}
            isEmpty={(rows) => rows.length === 0}
            empty={{ title: "Энэ хугацаанд ээлж алга", description: "Нэмэхэд шууд захиалах боломжтой болно." }}
          >
            {(rows) => <RosterGrid shifts={rows} onDeleted={shifts.refresh} />}
          </DataState>
        </div>

        <AddShiftPanel employees={employees} locations={locations.data ?? []} onAdded={shifts.refresh} />
      </div>
    </>
  );
}

/**
 * Shifts grouped by employee, then by day.
 *
 * Grouped in the client rather than asked of the API per person: the roster
 * for a week is a few dozen rows, and one request beats one per employee.
 */
function RosterGrid({ shifts, onDeleted }: { shifts: Shift[]; onDeleted: () => void }) {
  const byEmployee = new Map<string, { name: string; shifts: Shift[] }>();
  for (const shift of shifts) {
    const key = shift.employee.id;
    const entry = byEmployee.get(key) ?? { name: shift.employee.name ?? "—", shifts: [] };
    entry.shifts.push(shift);
    byEmployee.set(key, entry);
  }

  return (
    <div className="flex flex-col gap-4">
      {[...byEmployee.entries()].map(([id, group]) => (
        <section key={id} className="rounded-lg border border-border">
          <h2 className="border-b border-border px-4 py-2.5 text-sm font-semibold">{group.name}</h2>
          <ul className="flex flex-wrap gap-2 p-4">
            {group.shifts.map((shift) => (
              <li
                key={shift.id}
                className="flex items-center gap-2 rounded-md border border-primary/30 bg-accent px-3 py-2"
              >
                <span className="flex flex-col">
                  <span className="text-xs font-semibold text-accent-foreground">
                    {/* formatDay, not toLocaleDateString("mn-MN") — see lib/utils.ts on
                        why asking Intl for Mongolian words is not reliable across browsers. */}
                    {formatDay(shift.start_at)}
                  </span>
                  <span className="font-mono text-[11px] text-accent-foreground">
                    {formatTime(shift.start_at)}–{formatTime(shift.end_at)} · {shift.location.name ?? "—"}
                  </span>
                </span>
                <DeleteShiftButton shift={shift} onDeleted={onDeleted} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function DeleteShiftButton({ shift, onDeleted }: { shift: Shift; onDeleted: () => void }) {
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    try {
      await api.delete(`manager/shifts/${shift.id}`);
      toast.success("Ээлж устгагдлаа", { description: "Тэдгээр цагууд цаашид захиалах боломжгүй болно." });
      onDeleted();
    } catch (err) {
      toast.error("Ээлжийг устгаж чадсангүй", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      disabled={pending}
      aria-label={`${shift.employee.name ?? "энэ ажилтны"} ${formatTime(shift.start_at)} цагийн ээлжийг устгах`}
      onClick={remove}
    >
      <Trash2 aria-hidden className="size-3.5" />
    </Button>
  );
}

function AddShiftPanel({
  employees,
  locations,
  onAdded,
}: {
  employees: StaffMember[];
  locations: Location[];
  onAdded: () => void;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [day, setDay] = useState(businessToday());
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [pending, setPending] = useState(false);

  const employee = employeeId || employees[0]?.id || "";
  // Default to the employee's home site, which is what a roster entry usually
  // is; the select still allows any site for covering another branch.
  const homeLocation = employees.find((w) => w.id === employee)?.home_location_id;
  const location = locationId || homeLocation || locations[0]?.id || "";

  async function add() {
    setPending(true);
    try {
      // The API takes absolute instants. `new Date("2026-09-22T09:00")` is
      // parsed in the BROWSER's zone, which is only correct when the operator
      // sits in the business timezone — true here, and the assumption is
      // recorded rather than hidden: a manager abroad would need the offset
      // computed from the business zone instead.
      await api.post("manager/shifts", {
        employee_id: employee,
        location_id: location,
        start_at: new Date(`${day}T${start}`).toISOString(),
        end_at: new Date(`${day}T${end}`).toISOString(),
      });
      toast.success("Ээлж нэмэгдлээ", { description: "Одоо эдгээр цагийг захиалах боломжтой." });
      onAdded();
    } catch (err) {
      toast.error("Ээлж нэмж чадсангүй", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="h-fit w-full shrink-0 xl:w-80">
      <CardHeader>
        <CardTitle>Ээлж нэмэх</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field id="shift-employee" label="Ажилтан">
          <Select id="shift-employee" value={employee} onChange={(e) => setEmployeeId(e.target.value)}>
            {employees.length === 0 && <option value="">Идэвхтэй ажилтан алга</option>}
            {employees.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="shift-site" label="Байршил">
          <Select id="shift-site" value={location} onChange={(e) => setLocationId(e.target.value)}>
            {locations.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
                {site.active ? "" : " (хаалттай)"}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="shift-day" label="Өдөр">
          <Input
            id="shift-day"
            type="date"
            value={day}
            min={isoDayOf(new Date())}
            onChange={(e) => setDay(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id="shift-start" label="Эхлэх">
            <Input id="shift-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field id="shift-end" label="Дуусах">
            <Input id="shift-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>

        <Button onClick={add} disabled={pending || !employee || !location}>
          {pending ? "Нэмж байна…" : "Ээлж нэмэх"}
        </Button>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Нэг ажилтан давхцсан хоёр ээлжтэй байж болохгүй — API хоёр дахь ээлжийг татгалзана, учир нь эсрэг тохиолдолд
          хоёр байршилд зэрэг захиалга авах боломжтой болно.
        </p>
      </CardContent>
    </Card>
  );
}
