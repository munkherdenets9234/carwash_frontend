"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/page-header";
import { DataState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useApi } from "@/hooks/use-api";
import { api, errorMessage } from "@/lib/api/client";
import type { Location, StaffMember, StaffReservation, StaffWashService } from "@/lib/api/types";
import { cn, formatMNT, formatTime } from "@/lib/utils";

/**
 * The walk-in desk.
 *
 * A car is on the forecourt and there is a queue behind it, so the form is
 * three things: a plate, a service, a washer. The time is now and the job
 * starts immediately — the API fills both in, because a manager who has to
 * set a start time will either mistype it or stop using the screen.
 *
 * Service and washer are tap targets rather than dropdowns. A select needs
 * open, find, tap and close, and a car wash offers a handful of services and
 * employs a handful of people — the whole list fits on the screen, so showing
 * it costs a little height and saves three interactions per car.
 *
 * After a successful registration the form keeps the service, the washer and
 * the site, clears the plate and puts the cursor back in it. Registering six
 * cars for the same wash is then six plates typed and six taps, which is the
 * shape of a Saturday morning.
 */
export function RegisterScreen() {
  const services = useApi<StaffWashService[]>("manager/services");
  const staff = useApi<StaffMember[]>("manager/staff");
  const locations = useApi<Location[]>("manager/locations");

  const [plate, setPlate] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  // This session's registrations, newest first. Not a fetch: it answers "did
  // that one go in?" without leaving the screen, which is the question a
  // manager asks straight after tapping the button.
  const [justRegistered, setJustRegistered] = useState<StaffReservation[]>([]);

  const plateRef = useRef<HTMLInputElement>(null);

  const washers = (staff.data ?? []).filter((person) => person.role === "employee" && person.status === "active");
  const openSites = (locations.data ?? []).filter((site) => site.active);

  // One site is the common case, and asking which of one is a question with
  // no answer worth typing.
  const firstSiteId = openSites[0]?.id;
  useEffect(() => {
    if (!locationId && firstSiteId) setLocationId(firstSiteId);
  }, [locationId, firstSiteId]);

  const ready = plate.trim() !== "" && serviceId !== "" && employeeId !== "" && locationId !== "";

  async function register() {
    if (!ready) return;
    setPending(true);
    try {
      const created = await api.post<StaffReservation>("manager/reservations", {
        plate,
        employee_id: employeeId,
        service_id: serviceId,
        location_id: locationId,
        notes,
      });
      toast.success("Бүртгэлээ", {
        description: `${created.car.plate} — ${created.employee.name}, ${formatTime(created.start_at)}`,
      });
      setJustRegistered((rows) => [created, ...rows].slice(0, 8));
      setPlate("");
      setNotes("");
      plateRef.current?.focus();
    } catch (err) {
      toast.error("Бүртгэж чадсангүй", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader title="Ирсэн машин бүртгэх" description="Цагийг нь бүртгэсэн агшнаар авна. Ажил тэр дороо эхэлнэ." />

      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col gap-6 pt-5">
            <Field id="plate" label="Улсын дугаар">
              <Input
                id="plate"
                ref={plateRef}
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  // Enter submits once the rest is chosen: the plate is the
                  // only thing typed, so it is where a keyboard ends up.
                  if (e.key === "Enter" && ready && !pending) void register();
                }}
                placeholder="1234 УБА"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="h-16 text-2xl font-semibold tracking-wider"
              />
            </Field>

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-medium">Үйлчилгээ</span>
              <DataState
                query={services}
                isEmpty={(rows) => rows.length === 0}
                empty={{ title: "Үнийн жагсаалт хоосон" }}
              >
                {(rows) => (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {rows
                      .filter((row) => row.active)
                      .map((row) => (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => setServiceId(row.id)}
                          aria-pressed={serviceId === row.id}
                          className={cn(
                            "flex min-h-16 flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                            serviceId === row.id ? "border-primary bg-accent" : "border-border hover:border-primary/60",
                          )}
                        >
                          <span className="text-sm font-semibold">{row.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {row.duration_min} мин · {formatMNT(row.price_mnt)}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </DataState>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-medium">Угаагч</span>
              <DataState query={staff} isEmpty={() => washers.length === 0} empty={{ title: "Идэвхтэй ажилтан алга" }}>
                {() => (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {washers.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => setEmployeeId(person.id)}
                        aria-pressed={employeeId === person.id}
                        className={cn(
                          "flex min-h-14 items-center gap-2 rounded-lg border p-3 text-left text-sm font-semibold transition-colors",
                          employeeId === person.id
                            ? "border-primary bg-accent"
                            : "border-border hover:border-primary/60",
                        )}
                      >
                        {employeeId === person.id && <Check aria-hidden className="size-4 shrink-0 text-primary" />}
                        {person.name}
                      </button>
                    ))}
                  </div>
                )}
              </DataState>
            </div>

            {/* Hidden when there is only one site: a select with one option is
                a question nobody needs to be asked. */}
            {openSites.length > 1 && (
              <Field id="site" label="Салбар">
                <Select id="site" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                  {openSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            <Field id="notes" label="Тэмдэглэл">
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Заавал биш"
              />
            </Field>

            <Button size="lg" onClick={register} disabled={!ready || pending}>
              {pending ? "Бүртгэж байна…" : "Бүртгэх"}
            </Button>
          </CardContent>
        </Card>

        {justRegistered.length > 0 && (
          <Card>
            <CardContent className="pt-5">
              <h2 className="text-[13px] font-medium text-muted-foreground">Сая бүртгэсэн</h2>
              <ul className="mt-3 flex flex-col divide-y divide-border">
                {justRegistered.map((row) => (
                  <li key={row.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="font-mono text-sm font-semibold tracking-wider">{row.car.plate}</span>
                    <span className="flex-1 truncate text-[13px] text-muted-foreground">
                      {row.service.name} · {row.employee.name}
                    </span>
                    <span className="font-mono text-[13px] tabular-nums">{formatTime(row.start_at)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
