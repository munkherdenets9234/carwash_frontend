"use client";

import { Search } from "lucide-react";

import Link from "next/link";
import { useState } from "react";

import { ReservationBadge } from "@/components/app/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { api, errorMessage, hasCode } from "@/lib/api/client";
import { ErrorCode, type GuestBooking } from "@/lib/api/types";
import { formatDay, formatMNT, formatTime } from "@/lib/utils";

import { BookingShell } from "./booking-shell";

/**
 * Finding a booking made without an account.
 *
 * Two fields, and both are required, because each covers the other's
 * weakness. The code is the secret — but it is a secret that gets
 * screenshotted, forwarded and left in chat threads. The phone number is not
 * secret at all — but it is something only the person who booked and the
 * business know to pair with that code.
 *
 * The server answers the same "not found" for a wrong code and for a right
 * code with the wrong number, and this screen repeats that answer verbatim
 * rather than guessing which half was wrong. Being more helpful here would
 * turn the page into a way of testing whether a code is real.
 */
export function FindBookingScreen({ businessName }: { businessName?: string }) {
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [booking, setBooking] = useState<GuestBooking>();
  const [error, setError] = useState<string>();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setBooking(undefined);
    try {
      const found = await api.get<GuestBooking>("bookings/lookup", { reference, phone });
      setBooking(found);
    } catch (err) {
      setError(
        hasCode(err, ErrorCode.NotFound)
          ? "Энэ код болон утасны дугаартай тохирох захиалга олдсонгүй. Хоёуланг нь шалгана уу — код найман тэмдэгттэй, дугаар нь захиалсан дугаар байх ёстой."
          : errorMessage(err),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <BookingShell
      businessName={businessName}
      eyebrow="Бүртгэл шаардлагагүй"
      title="Захиалгаа хайх"
      description="Захиалгын код болон захиалсан утасны дугаараа оруулна уу."
    >
      <div className="grid gap-10 lg:grid-cols-[22rem_1fr] lg:items-start">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <Field id="find-reference" label="Захиалгын код" hint="Зураас, том жижиг үсэг хамаагүй.">
            <Input
              id="find-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="4KQP-M7HX"
              autoComplete="off"
              autoCapitalize="characters"
              className="font-mono text-lg tracking-[0.14em]"
              required
            />
          </Field>

          <Field id="find-phone" label="Утасны дугаар" hint="Захиалсан утасны дугаараа оруулна уу.">
            <Input
              id="find-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9911 2233"
              autoComplete="tel"
              required
            />
          </Field>

          <Button type="submit" size="lg" disabled={pending}>
            <Search aria-hidden className="size-4" />
            {pending ? "Хайж байна…" : "Захиалга хайх"}
          </Button>

          <Link href="/book/new" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            Шинэ захиалга хийх
          </Link>
        </form>

        <div className="flex flex-col gap-6">
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-border bg-card px-6 py-5 text-sm leading-relaxed text-muted-foreground"
            >
              {error}
            </p>
          )}

          {booking && (
            <div className="rounded-xl border border-border bg-card">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-border px-6 py-5">
                <p className="font-mono text-2xl font-bold tracking-[0.12em]">{booking.reference}</p>
                <ReservationBadge status={booking.status} />
              </div>

              <dl className="flex flex-col divide-y divide-border px-6">
                {[
                  ["Үйлчилгээ", booking.service.name ?? "—"],
                  ["Машин", booking.car.plate],
                  ["Ажилтан", booking.employee.name ?? "—"],
                  ["Цаг", `${formatDay(booking.start_at)}, ${formatTime(booking.start_at)}`],
                  ["Байршил", booking.location.name ?? "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-4 py-4">
                    <dt className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="flex-1 text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex items-baseline gap-3 border-t border-border bg-muted px-6 py-4">
                <span className="flex-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Үнэ</span>
                <span className="text-2xl font-medium tabular-nums tracking-tight">{formatMNT(booking.price_mnt)}</span>
              </div>
            </div>
          )}

          {!booking && !error && (
            // The empty state carries the one thing somebody who cannot find
            // their code actually needs, rather than decoration.
            <div className="rounded-xl border border-dashed border-border px-6 py-10 text-sm leading-relaxed text-muted-foreground">
              <p>Таны захиалга энд харагдана.</p>
              <p className="mt-3">
                Кодоо алдсан уу? Бид үүнийг дахин илгээх боломжгүй — энэ нь утасны дугаараар захиалгыг уншиж болохгүй
                байлгах цорын ганц зүйл. Доорх дугаараар холбогдвол бизнес тантай хамт хайж олно.
              </p>
            </div>
          )}
        </div>
      </div>
    </BookingShell>
  );
}
