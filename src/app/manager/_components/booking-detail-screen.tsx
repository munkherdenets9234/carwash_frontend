"use client";

import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/page-header";
import { DataState } from "@/components/app/states";
import { ReservationBadge } from "@/components/app/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { useApi } from "@/hooks/use-api";
import { api, errorMessage } from "@/lib/api/client";
import type { EmployeeCard, ReservationStatus, StaffReservation, StaffWashService } from "@/lib/api/types";
import { businessLocalToISO, cn, formatDateTime, formatMNT, formatRange, isoToBusinessLocal } from "@/lib/utils";

/**
 * One booking, and the three corrections a manager actually needs to make:
 * the plate was mistyped, the wrong service was tapped, or the car went in
 * before anyone registered it.
 *
 * A page rather than a panel, because it is what a row on a phone links to —
 * the list there shows time, car and washer, and everything else lives here.
 * That also gives a booking its own address, so it survives being sent to
 * somebody in a message.
 */
export function BookingDetailScreen({ id }: { id: string }) {
  const booking = useApi<StaffReservation>(`manager/reservations/${id}`);

  return (
    <>
      <PageHeader
        title="Захиалгын дэлгэрэнгүй"
        actions={
          <>
            <Link href="/manager/bookings" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
              <ArrowLeft aria-hidden className="size-4" />
              Буцах
            </Link>
            {/* Rendered from the outer component because that is where the
                booking is fetched; the header needs the current status to know
                which moves are even possible. Absent while it loads rather
                than disabled, so nothing offers a choice it cannot honour. */}
            {booking.data && <StatusActions row={booking.data} onChanged={() => booking.refresh()} />}
          </>
        }
      />

      <div className="p-6 sm:p-8">
        <DataState query={booking}>{(row) => <Loaded row={row} onChanged={() => booking.refresh()} />}</DataState>
      </div>
    </>
  );
}

/**
 * Mongolian for each status. The same words the bookings filter uses, so a
 * manager reads one vocabulary across the two screens.
 */
const STATUS_LABEL: Record<ReservationStatus, string> = {
  booked: "Захиалсан",
  in_progress: "Хийгдэж байна",
  completed: "Дууссан",
  cancelled: "Цуцалсан",
  no_show: "Ирээгүй",
};

/**
 * Дуусгах and Цуцлах, beside the back link. No dropdown: these are the two
 * things that happen to a job, and a select costs open, find, tap, close
 * before anything has been decided.
 *
 * They appear only while the booking is open. Nothing leaves completed,
 * cancelled or no_show — `allowedTransition` in the Go service is the
 * authority and this mirrors it — so a finished job shows no buttons rather
 * than buttons that would 409.
 *
 * Дуусгах fires on one tap. It is the ordinary end of every wash, the manager
 * is standing at the car, and this page is already one they had to open for
 * this booking specifically — so the cost of the extra press outweighs the
 * mis-tap it would prevent.
 *
 * Цуцлах takes two, and the asymmetry is deliberate rather than an
 * oversight: cancelling is the rare one, it is equally irreversible, and it
 * takes a wash out of the day's takings. Arming it costs a second press on
 * the action nobody performs twenty times a day.
 */
function StatusActions({ row, onChanged }: { row: StaffReservation; onChanged: () => void }) {
  const [pending, setPending] = useState<ReservationStatus | null>(null);
  const [armed, setArmed] = useState(false);

  const open = row.status === "booked" || row.status === "in_progress";
  if (!open) return null;

  async function move(status: ReservationStatus) {
    setPending(status);
    try {
      await api.put(`manager/reservations/${row.id}/status`, { status });
      toast.success(`Төлөв: ${STATUS_LABEL[status]}`, {
        description:
          status === "completed" ? "Урамшуулал бодогдож, өдрийн тайланд орлоо." : "Буцаах боломжгүй өөрчлөлт.",
      });
      setArmed(false);
      onChanged();
    } catch (err) {
      toast.error("Төлөв солиход алдаа гарлаа", { description: errorMessage(err) });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => move("completed")} disabled={pending !== null}>
        <Check aria-hidden className="size-4" />
        {pending === "completed" ? "Дуусгаж байна…" : "Дуусгах"}
      </Button>

      {armed ? (
        <>
          <Button variant="destructive" onClick={() => move("cancelled")} disabled={pending !== null}>
            {pending === "cancelled" ? "Цуцалж байна…" : "Тийм, цуцлая"}
          </Button>
          <Button variant="ghost" onClick={() => setArmed(false)} disabled={pending !== null}>
            Болих
          </Button>
        </>
      ) : (
        <Button variant="outline" onClick={() => setArmed(true)} disabled={pending !== null}>
          <X aria-hidden className="size-4" />
          Цуцлах
        </Button>
      )}
    </div>
  );
}

function Loaded({ row, onChanged }: { row: StaffReservation; onChanged: () => void }) {
  const services = useApi<StaffWashService[]>("manager/services");
  const employees = useApi<EmployeeCard[]>("customer/employees");

  const [plate, setPlate] = useState(row.car.plate ?? "");
  const [serviceId, setServiceId] = useState(row.service.id ?? "");
  const [startLocal, setStartLocal] = useState(isoToBusinessLocal(row.start_at));
  const [pending, setPending] = useState(false);

  // A cancelled job is not editable: nothing happened, so there is nothing to
  // correct. The API refuses it too — this only keeps the screen from
  // offering something that will come back 409.
  const editable = row.status !== "cancelled" && row.status !== "no_show";

  const dirty =
    plate !== (row.car.plate ?? "") ||
    serviceId !== (row.service.id ?? "") ||
    startLocal !== isoToBusinessLocal(row.start_at);

  async function save() {
    if (!dirty) return;
    setPending(true);
    try {
      // Only what changed goes up. The API leaves an absent field alone, so
      // sending all three would overwrite two of them with values this screen
      // merely happened to be displaying.
      const body: Record<string, string> = {};
      if (plate !== (row.car.plate ?? "")) body.plate = plate;
      if (serviceId !== (row.service.id ?? "")) body.service_id = serviceId;
      if (startLocal !== isoToBusinessLocal(row.start_at)) body.start_at = businessLocalToISO(startLocal);

      await api.put<StaffReservation>(`manager/reservations/${row.id}`, body);
      toast.success("Хадгаллаа", {
        description: row.status === "completed" ? "Дууссан ажил тул өдрийн тайлан мөн өөрчлөгдөнө." : undefined,
      });
      onChanged();
    } catch (err) {
      toast.error("Хадгалж чадсангүй", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  async function reassign(employeeId: string) {
    setPending(true);
    try {
      await api.put(`manager/reservations/${row.id}/assign`, { employee_id: employeeId });
      toast.success("Ажилтан солигдлоо", { description: "Урамшуулал ажилтай хамт шилжинэ." });
      onChanged();
    } catch (err) {
      toast.error("Ажилтан солиход алдаа гарлаа", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  const others = (employees.data ?? []).filter((e) => e.id !== row.employee.id);
  const open = row.status === "booked" || row.status === "in_progress";

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {formatRange(row.start_at, row.end_at)}
              </span>
              <CardTitle className="font-mono text-xl tracking-wider">{row.car.plate || "—"}</CardTitle>
            </div>
            <ReservationBadge status={row.status} />
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col divide-y divide-border">
              {[
                ["Үйлчилгээ", row.service.name ?? "—"],
                ["Ажилтан", row.employee.name ?? "—"],
                ["Салбар", row.location.name ?? "—"],
                ["Харилцагч", row.customer.name || row.customer.phone || "—"],
                ["Утас", row.customer.phone || "—"],
                ["Үнэ", formatMNT(row.price_mnt)],
                ["Урамшуулал", formatMNT(row.bonus_mnt)],
                ["Эхэлсэн", formatDateTime(row.start_at)],
                ["Тэмдэглэл", row.notes || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                  <dt className="w-32 shrink-0 text-[13px] text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 flex-1 text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {editable && (
          <Card>
            <CardHeader>
              <CardTitle>Засах</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field id="edit-plate" label="Улсын дугаар">
                <Input
                  id="edit-plate"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono tracking-wider"
                />
              </Field>

              <Field id="edit-service" label="Үйлчилгээ">
                <Select id="edit-service" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                  {(services.data ?? [])
                    .filter((s) => s.active || s.id === row.service.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.duration_min} мин · {formatMNT(s.price_mnt)}
                      </option>
                    ))}
                </Select>
              </Field>

              <Field id="edit-start" label="Эхлэх цаг">
                <Input
                  id="edit-start"
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                />
              </Field>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Үйлчилгээг сольвол үнэ, урамшуулал, дуусах цаг шинэчлэгдэнэ. Дууссан ажлыг засахад өдрийн тайлан мөн
                өөрчлөгдөнө.
              </p>

              <Button onClick={save} disabled={!dirty || pending}>
                {pending ? "Хадгалж байна…" : "Хадгалах"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {open && (
        <Card className="h-fit w-full shrink-0 xl:w-80">
          <CardHeader>
            <CardTitle>Ажилтан солих</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {others.length === 0 && <p className="text-[13px] text-muted-foreground">Өөр ажилтан алга байна.</p>}
            {others.map((employee) => (
              <Button
                key={employee.id}
                variant="outline"
                disabled={pending}
                onClick={() => reassign(employee.id)}
                className="justify-start"
              >
                {employee.name}
              </Button>
            ))}
            <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
              Ажилтан солиход боломжийг дахин шалгана: тухайн ажилтан энэ цагт ажиллахгүй эсвэл өөр захиалгатай бол API
              татгалзана.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
