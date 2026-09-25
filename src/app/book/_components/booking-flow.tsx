"use client";

import { ArrowLeft, Check, Copy } from "lucide-react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { DataState } from "@/components/app/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useApi } from "@/hooks/use-api";
import { api, errorMessage, hasCode } from "@/lib/api/client";
import {
  type EmployeeAvailability,
  ErrorCode,
  type GuestBooking,
  type Location,
  type WashService,
} from "@/lib/api/types";
import { businessToday, cn, formatDay, formatMNT, formatTime, initialsOf } from "@/lib/utils";

import { BookingShell, StepRail } from "./booking-shell";
import { RegisterForm } from "./register-form";

type Step = "service" | "when" | "confirm" | "done";

const STEP_LABELS = ["Үйлчилгээ", "Цаг", "Мэдээлэл"];

/**
 * Booking a wash without an account, in the public site's visual language.
 *
 * The three wireframe screens are one component, because they share state —
 * the service, the chosen employee and slot, the car — and the flow only makes
 * sense as a sequence. Splitting it across three routes would mean either
 * re-fetching the whole chain on each step or lifting the draft into a store,
 * both of which cost more than a `step` value.
 *
 * Two things changed when registration stopped being required. The car is
 * TYPED rather than picked from a garage, because a visitor has no garage.
 * And the flow ends on a fourth screen built around the reference code —
 * which is not a courtesy: the code is sent once and is the only way back to
 * this booking, so a success toast that scrolls away would lose it.
 */
export function BookingFlow({ businessName }: { businessName?: string }) {
  const today = businessToday();

  // The public site links straight here from a service card, carrying the id
  // it was showing. Without it a visitor who has just read a price is handed
  // the same list again and has to find the row they came from.
  const params = useSearchParams();
  const requestedServiceId = params.get("service") ?? "";
  // A saved car links here with its plate, so somebody who keeps a garage
  // does not retype what the site already knows. It is only a default: the
  // field stays editable, because the booking is for whichever car turns up.
  const requestedPlate = params.get("plate") ?? "";

  const services = useApi<WashService[]>("services");
  const locations = useApi<Location[]>("locations");

  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState(requestedServiceId);
  const [locationId, setLocationId] = useState("");
  const [day, setDay] = useState(today);
  const [pick, setPick] = useState<{ employeeId: string; employeeName: string; startAt: string; locationId: string }>();

  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState(requestedPlate);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const [pending, setPending] = useState(false);
  const [booked, setBooked] = useState<GuestBooking>();

  const service = (services.data ?? []).find((s) => s.id === serviceId);

  // Applied once, and only after the list has arrived: a link can carry an id
  // that has since been withdrawn, which would otherwise leave the visitor on
  // a step that cannot render.
  const preselectApplied = useRef(false);
  useEffect(() => {
    if (preselectApplied.current || !requestedServiceId || !services.data) return;
    preselectApplied.current = true;
    if (services.data.some((s) => s.id === requestedServiceId)) setStep("when");
  }, [requestedServiceId, services.data]);

  // Availability is only asked for once a service is chosen: the slot length
  // depends on its duration, so there is no meaningful answer before then.
  const availability = useApi<EmployeeAvailability[]>(step === "when" && service ? "availability" : null, {
    service_id: service?.id,
    day,
    location_id: locationId || undefined,
  });

  async function confirm() {
    if (!service || !pick) return;

    // Checked here as well as on the server, because a server refusal arrives
    // after a round trip and this one does not.
    if (!plate.trim()) {
      toast.error("Ямар машиныг угаах вэ?");
      return;
    }
    if (!phone.trim()) {
      toast.error("Утасны дугаар шаардлагатай, ингэснээр бид тантай холбогдох боломжтой.");
      return;
    }

    setPending(true);
    try {
      const created = await api.post<GuestBooking>("bookings", {
        phone,
        plate,
        name: name.trim() || undefined,
        employee_id: pick.employeeId,
        service_id: service.id,
        location_id: pick.locationId,
        start_at: pick.startAt,
        notes,
      });
      setBooked(created);
      setStep("done");
    } catch (err) {
      // SLOT_UNAVAILABLE means somebody took it between loading this page and
      // confirming — which is exactly what the server-side re-check is for.
      // Sending the visitor back to the slot list is the only useful move.
      if (hasCode(err, ErrorCode.SlotUnavailable)) {
        toast.error("Тэр цаг сая дүүрлээ", { description: errorMessage(err) });
        setPick(undefined);
        setStep("when");
        availability.refresh();
      } else {
        toast.error("Захиалж чадсангүй", { description: errorMessage(err) });
      }
    } finally {
      setPending(false);
    }
  }

  if (step === "done" && booked)
    return <BookedScreen booking={booked} phone={phone} name={name} businessName={businessName} />;

  const stepIndex = step === "service" ? 0 : step === "when" ? 1 : 2;
  const heading =
    step === "service"
      ? { title: "Үйлчилгээ сонгох", description: "Захиалахад үнэ тогтмол болно. Бүртгэл шаардлагагүй." }
      : step === "when"
        ? {
            title: "Хэн хийхийг болон цагийг сонгох",
            description: "Тухайн өдөр хуваарьтай ажилтнууд л энд харагдана.",
          }
        : { title: "Таны мэдээлэл", description: "Машины дугаар болон утасны дугаар. Өөр юу ч шаардлагагүй." };

  return (
    <BookingShell
      businessName={businessName}
      eyebrow={`Step ${stepIndex + 1} of 3`}
      title={heading.title}
      description={heading.description}
      aside={
        step !== "service" ? (
          <Button variant="outline" onClick={() => setStep(step === "confirm" ? "when" : "service")}>
            <ArrowLeft aria-hidden className="size-4" />
            Буцах
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-10">
        <StepRail step={stepIndex} labels={STEP_LABELS} />

        {step === "service" && (
          <DataState
            query={services}
            isEmpty={(rows) => rows.length === 0}
            empty={{ title: "Одоогоор үйлчилгээ байхгүй байна" }}
          >
            {(rows) => (
              <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rows.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setServiceId(option.id);
                        setPick(undefined);
                        setStep("when");
                      }}
                      className="flex h-full w-full flex-col gap-5 rounded-xl border border-border bg-card p-6 text-left transition-colors hover:border-primary/60"
                    >
                      <div>
                        <h2 className="text-2xl font-medium tracking-tight">{option.name}</h2>
                        {option.description && (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{option.description}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Pill>{option.duration_min} мин</Pill>
                        <Pill>{formatMNT(option.price_mnt)}</Pill>
                      </div>

                      <span
                        className={cn(buttonVariants({ variant: "outline" }), "mt-auto w-full justify-center")}
                        aria-hidden
                      >
                        Сонгох
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </DataState>
        )}

        {step === "when" && service && (
          <div className="flex flex-col gap-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
              <Field id="which-site" label="Байршил">
                <Select id="which-site" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                  <option value="">Дурын байршил</option>
                  {(locations.data ?? []).map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id="which-day" label="Өдөр">
                <Input id="which-day" type="date" value={day} min={today} onChange={(e) => setDay(e.target.value)} />
              </Field>
            </div>

            <DataState
              query={availability}
              isEmpty={(rows) => rows.length === 0}
              empty={{
                title: "Тэр өдөр хэн ч ажиллахгүй",
                description: "Өөр өдөр сонгоно уу — хуваарь захиалгыг тодорхойлно.",
              }}
            >
              {(rows) => (
                <ul className="grid gap-6 lg:grid-cols-2">
                  {rows.map((entry) => (
                    <li key={entry.employee.id} className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-4">
                        <span
                          aria-hidden
                          className="flex size-12 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground"
                        >
                          {initialsOf(entry.employee.name)}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-lg font-medium tracking-tight">{entry.employee.name}</span>
                          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                            {/* An empty slot list is a real answer: working,
                                but nothing left. Someone not rostered simply
                                is not in this list at all. */}
                            {entry.slots.length === 0 ? "Дүүрсэн" : `${entry.slots.length} цаг сул байна`}
                          </span>
                        </div>
                      </div>

                      {entry.slots.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {entry.slots.map((slot) => (
                            <button
                              key={slot.start_at}
                              type="button"
                              onClick={() => {
                                setPick({
                                  employeeId: entry.employee.id,
                                  employeeName: entry.employee.name,
                                  startAt: slot.start_at,
                                  locationId: slot.location_id,
                                });
                                setStep("confirm");
                              }}
                              className="min-h-11 rounded-full border border-border px-4 font-mono text-[13px] transition-colors hover:border-primary hover:text-primary"
                            >
                              {formatTime(slot.start_at)}
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </DataState>
          </div>
        )}

        {step === "confirm" && service && pick && (
          // Two columns on a wide screen: the thing being bought on one side,
          // the fields on the other. In one narrow column the summary scrolls
          // out of sight exactly when somebody is deciding whether to commit.
          <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
            <div className="flex flex-col gap-6 lg:order-2">
              <SummaryCard
                rows={[
                  ["Үйлчилгээ", `${service.name} · ${service.duration_min} мин`],
                  ["Ажилтан", pick.employeeName],
                  ["Цаг", `${formatDay(pick.startAt)}, ${formatTime(pick.startAt)}`],
                  ["Байршил", (locations.data ?? []).find((l) => l.id === pick.locationId)?.name ?? "—"],
                ]}
                total={formatMNT(service.price_mnt)}
              />
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Энэ үнэ захиалгын үед тогтмол болж хадгалагдана. Дараа нь үнийн жагсаалт өөрчлөгдсөн ч танд өгсөн үнэ
                өөрчлөгдөхгүй.
              </p>
            </div>

            <div className="flex flex-col gap-5 lg:order-1">
              {/* No account, so these two fields ARE the booking's identity:
                  the plate says which car to wash, the number is how the
                  business reaches you and half of how you find this booking
                  again. */}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="guest-plate" label="Машины дугаар" hint="Аль машиныг угаах вэ.">
                  <Input
                    id="guest-plate"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    placeholder="1234 UBA"
                    autoComplete="off"
                    autoCapitalize="characters"
                    required
                  />
                </Field>

                <Field id="guest-phone" label="Утасны дугаар" hint="Энэ захиалгын талаар тантай холбогдохын тулд.">
                  <Input
                    id="guest-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9911 2233"
                    autoComplete="tel"
                    required
                  />
                </Field>
              </div>

              <Field id="guest-name" label="Таны нэр" hint="Заавал биш.">
                <Input id="guest-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </Field>

              <Field id="booking-notes" label="Бидэнд мэдэгдэх зүйл байна уу?">
                <Textarea
                  id="booking-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Заавал биш"
                />
              </Field>

              <Button size="lg" onClick={confirm} disabled={pending} className="sm:w-fit sm:px-8">
                {pending ? "Захиалж байна…" : "Захиалгыг баталгаажуулах"}
              </Button>

              <p className="text-[13px] text-muted-foreground">
                Бүртгэл шаардлагагүй — дараагийн дэлгэцэд захиалгын код авах болно.
              </p>
            </div>
          </div>
        )}
      </div>
    </BookingShell>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border px-3 py-1 font-mono text-[12px] text-muted-foreground">
      {children}
    </span>
  );
}

function SummaryCard({ rows, total }: { rows: [string, string][]; total?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <dl className="flex flex-col divide-y divide-border px-6">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-4 py-4">
            <dt className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {label}
            </dt>
            <dd className="flex-1 text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {total && (
        <div className="flex items-baseline gap-3 border-t border-border bg-muted px-6 py-4">
          <span className="flex-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Нийт дүн</span>
          <span className="text-2xl font-medium tabular-nums tracking-tight">{total}</span>
        </div>
      )}
    </div>
  );
}

/**
 * The confirmation, built around the reference code.
 *
 * The code gets poster-sized type for the same reason the hero gives the
 * business name poster-sized type: it is the one thing on the page that has
 * to be read and remembered. It is also the one piece that cannot be
 * recovered — the API sends it on this response and on a successful lookup,
 * and nowhere else, because a route that handed it over for a booking you
 * could not already identify would make a phone number enough to read
 * somebody's booking, and a phone number is not a secret.
 */
function BookedScreen({
  booking,
  phone,
  name,
  businessName,
}: {
  booking: GuestBooking;
  /** What was typed on the form — the other half of the code. */
  phone: string;
  /** Also from the form, so the signup does not ask for it twice. */
  name: string;
  businessName?: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [signingUp, setSigningUp] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(booking.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is refused in plenty of ordinary situations — an
      // insecure origin, a browser that wants a user gesture it did not see.
      // The code is on the screen either way, so this is a non-event and must
      // not be dressed up as a failed booking.
      toast.message("Тэмдэглэж аваарай", { description: booking.reference });
    }
  }

  return (
    <BookingShell
      businessName={businessName}
      eyebrow="Баталгаажлаа"
      title="Захиалагдлаа"
      description="Кодоо тэмдэглэж авна уу — дараа нь утасны дугаартайгаа хамт хэрэглэж захиалгаа олох боломжтой."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="flex flex-col items-center gap-5 rounded-xl border border-border bg-card px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check aria-hidden className="size-6" />
          </span>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Таны захиалгын код</p>
          <p className="font-mono text-4xl font-bold tracking-[0.12em] md:text-6xl">{booking.reference}</p>
          <Button variant="outline" onClick={copy}>
            <Copy aria-hidden className="size-4" />
            {copied ? "Хууллаа" : "Кодыг хуулах"}
          </Button>
          <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">Үүнийг дахин илгээх боломжгүй.</p>
        </div>

        <div className="flex flex-col gap-5">
          <SummaryCard
            rows={[
              ["Үйлчилгээ", booking.service.name ?? "—"],
              ["Машин", booking.car.plate],
              ["Ажилтан", booking.employee.name ?? "—"],
              ["Цаг", `${formatDay(booking.start_at)}, ${formatTime(booking.start_at)}`],
              ["Байршил", booking.location.name ?? "—"],
            ]}
            total={formatMNT(booking.price_mnt)}
          />

          <div className="flex flex-col gap-2.5">
            <Link href="/book/find" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Захиалгаа дараа нь олох
            </Link>
            <Link href="/" className={buttonVariants({ variant: "ghost", size: "lg" })}>
              Нүүр хуудас руу буцах
            </Link>
          </div>
        </div>
      </div>

      {/* The offer to keep it.

          Here rather than on a page somebody has to find later, because this
          is the one moment when the code and the phone number are both in
          hand — so creating the account costs a password and nothing else,
          and the booking comes with it. Sent away to /register, the same
          person would have to fetch the code back out of wherever they wrote
          it down, which is the step most of them would not take.

          Offered, not required. The booking is already made and already
          findable without this; refusing is a link away and costs nothing. */}
      <div className="mt-10 rounded-xl border border-border bg-card px-6 py-6 md:mt-12 md:px-8 md:py-8">
        {signingUp ? (
          <div className="flex max-w-2xl flex-col gap-6">
            <div>
              <h2 className="text-2xl font-medium tracking-tight">Энэ захиалгыг хадгалах</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Нууц үг үүсгэснээр энэ захиалга бүртгэл рүү шилжинэ, дараа нь код дахин хэрэггүй болно.
              </p>
            </div>
            <RegisterForm
              presetReference={booking.reference}
              presetPhone={phone}
              presetName={name}
              submitLabel="Бүртгэл үүсгээд захиалгаа хадгалах"
              onDone={() => router.push("/book/bookings")}
            />
            <button
              type="button"
              onClick={() => setSigningUp(false)}
              className="self-start text-[13px] text-muted-foreground underline underline-offset-4"
            >
              Одоо биш
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-medium tracking-tight">Код хадгалахыг хүсэхгүй байна уу?</h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Бүртгэл үүсгэвэл энэ захиалга болон {phone.trim() || "тэр дугаар"}-аар хийсэн бусад захиалгууд бүгд
                бүртгэл рүү шилжинэ. Дараа нь код огт хэрэггүй болно.
              </p>
            </div>
            <Button size="lg" variant="outline" className="shrink-0" onClick={() => setSigningUp(true)}>
              Бүртгэл үүсгэх
            </Button>
          </div>
        )}
      </div>
    </BookingShell>
  );
}
