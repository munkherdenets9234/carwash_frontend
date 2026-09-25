"use client";

import Link from "next/link";
import { useState } from "react";

import { toast } from "sonner";

import { SignOutButton } from "@/components/app/sign-out-button";
import { DataState } from "@/components/app/states";
import { ReservationBadge } from "@/components/app/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import { api, errorMessage } from "@/lib/api/client";
import type { Reservation } from "@/lib/api/types";
import { addDays, businessToday, formatDay, formatMNT, formatRange } from "@/lib/utils";

import { ACCOUNT_LINKS, AccountFooterNote, BookingShell } from "./booking-shell";

/**
 * Every booking an account holds.
 *
 * This is the page an account EXISTS for. Booking needs no account and a
 * single booking can be found with its code, so the one thing signing in
 * buys is this: the lot, in one place, with nothing to look after.
 */
export function MyBookingsScreen({ businessName }: { businessName?: string }) {
  const today = businessToday();

  // 90 days, not the 120 this asked for before. The API caps a range at 92
  // and answered the old window with "the range cannot be longer than 92
  // days" — so this screen showed an error instead of a booking, for
  // everyone, every time. It is the screen an account exists for, which is
  // how it went unnoticed: nobody had much reason to open it until booking
  // without an account made signing up worth doing.
  //
  // Weighted forwards on purpose. What somebody opens this for is the wash
  // they have coming; a month back is enough to check what they last paid.
  const bookings = useApi<Reservation[]>("customer/reservations", {
    from: addDays(today, -30),
    to: addDays(today, 60),
  });

  const rows = bookings.data ?? [];
  const upcoming = rows
    .filter((r) => r.status === "booked" || r.status === "in_progress")
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
  const past = rows
    .filter((r) => r.status !== "booked" && r.status !== "in_progress")
    .sort((a, b) => b.start_at.localeCompare(a.start_at));

  return (
    <BookingShell
      businessName={businessName}
      eyebrow="Таны бүртгэл"
      title="Миний захиалгууд"
      description="Энэ бүртгэлээр хийсэн бүх захиалга нэг дор."
      links={ACCOUNT_LINKS}
      headerAction={<SignOutButton compact />}
      footerNote={<AccountFooterNote />}
      aside={
        <Link href="/book/new" className={buttonVariants({ size: "lg" })}>
          Захиалах
        </Link>
      }
    >
      <DataState
        query={bookings}
        isEmpty={() => rows.length === 0}
        empty={{ title: "Захиалга алга байна", description: "Захиалга хийвэл энд харагдана." }}
      >
        {() => (
          <div className="flex flex-col gap-12">
            <section className="flex flex-col gap-5">
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Удахгүй болох</h2>
              {upcoming.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-6 py-10 text-sm text-muted-foreground">
                  Захиалга алга.
                </p>
              ) : (
                <ul className="grid gap-6 lg:grid-cols-2">
                  {upcoming.map((booking) => (
                    <li key={booking.id}>
                      <UpcomingCard booking={booking} onChanged={bookings.refresh} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {past.length > 0 && (
              <section className="flex flex-col gap-5">
                <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Өнгөрсөн</h2>
                <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
                  {past.map((booking) => (
                    <li key={booking.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-sm font-medium">{booking.service.name}</span>
                        <span className="truncate text-[13px] text-muted-foreground">
                          {formatDay(booking.start_at)} · {booking.employee.name} · {booking.car.plate}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <ReservationBadge status={booking.status} />
                        {booking.status === "completed" && (
                          <span className="text-sm font-medium tabular-nums">{formatMNT(booking.price_mnt)}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </DataState>
    </BookingShell>
  );
}

function UpcomingCard({ booking, onChanged }: { booking: Reservation; onChanged: () => void }) {
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function cancel() {
    setPending(true);
    try {
      await api.post(`customer/reservations/${booking.id}/cancel`);
      toast.success("Захиалга цуцлагдлаа");
      onChanged();
    } catch (err) {
      // The backend refuses a cancellation that is too close to the start,
      // and says how close. That message is the useful part.
      toast.error("Цуцалж чадсангүй", { description: errorMessage(err) });
    } finally {
      setPending(false);
      setConfirming(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-5 rounded-xl border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {formatDay(booking.start_at)}
          </span>
          <h3 className="text-2xl font-medium tracking-tight">{booking.service.name}</h3>
          <span className="text-sm text-muted-foreground">{formatRange(booking.start_at, booking.end_at)}</span>
        </div>
        <ReservationBadge status={booking.status} />
      </div>

      <dl className="flex flex-col divide-y divide-border">
        {[
          ["Ажилтан", booking.employee.name ?? "—"],
          ["Байршил", booking.location.name ?? "—"],
          ["Машин", booking.car.plate],
        ].map(([label, value]) => (
          <div key={label} className="flex gap-4 py-2.5 first:pt-0">
            <dt className="w-20 shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {label}
            </dt>
            <dd className="flex-1 text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-auto flex items-center gap-3 border-t border-border pt-4">
        <span className="flex-1 text-xl font-medium tabular-nums tracking-tight">{formatMNT(booking.price_mnt)}</span>
        {confirming ? (
          <div className="flex gap-1.5">
            <Button variant="destructive" size="sm" onClick={cancel} disabled={pending}>
              {pending ? "…" : "Цуцлах"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Хадгалах
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
            Захиалга цуцлах
          </Button>
        )}
      </div>
    </div>
  );
}
