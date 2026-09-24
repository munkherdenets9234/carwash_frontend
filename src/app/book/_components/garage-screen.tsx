"use client";

import { Plus, Trash2 } from "lucide-react";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { SignOutButton } from "@/components/app/sign-out-button";
import { DataState } from "@/components/app/states";
import { ReservationBadge } from "@/components/app/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useApi } from "@/hooks/use-api";
import { api, errorMessage } from "@/lib/api/client";
import type { Car, Reservation } from "@/lib/api/types";
import { addDays, businessToday, formatDay, formatTime } from "@/lib/utils";

import { ACCOUNT_LINKS, AccountFooterNote, BookingShell } from "./booking-shell";

/**
 * A signed-in customer's cars, and what is next.
 *
 * In the site's visual language rather than the mobile app shell, for the
 * same reason the booking flow moved: this is reached from a site that is
 * wide, typographic and card-based, and a 32rem column with a fixed tab bar
 * reads as a different product.
 *
 * The garage matters less than it did. Booking no longer requires a car to
 * be registered first — a plate is typed straight into the form, and the
 * service finds or creates the car — so this is now a convenience for
 * somebody with several vehicles, not a gate in front of the first booking.
 * The page says that rather than presenting an empty garage as a blocker,
 * which is what it used to be.
 */
export function GarageScreen({ businessName }: { businessName?: string }) {
  const cars = useApi<Car[]>("customer/cars");
  const today = businessToday();
  const upcoming = useApi<Reservation[]>("customer/reservations", { from: today, to: addDays(today, 30) });
  const [adding, setAdding] = useState(false);

  const next = (upcoming.data ?? [])
    .filter((r) => r.status === "booked" || r.status === "in_progress")
    .sort((a, b) => a.start_at.localeCompare(b.start_at))[0];

  return (
    <BookingShell
      businessName={businessName}
      eyebrow="Your account"
      title="Your garage"
      description="Cars you book for often. Not required — you can type a plate straight into a booking."
      links={ACCOUNT_LINKS}
      headerAction={<SignOutButton compact />}
      footerNote={<AccountFooterNote />}
      aside={
        <Link href="/book/new" className={buttonVariants({ size: "lg" })}>
          Book a wash
        </Link>
      }
    >
      <div className="flex flex-col gap-10">
        {next && (
          <Link
            href="/book/bookings"
            className="block rounded-xl border border-primary/30 bg-accent px-6 py-6 transition-colors hover:border-primary md:px-8"
          >
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-accent-foreground">
                  Next booking
                </span>
                <span className="text-xl font-medium tracking-tight text-accent-foreground">
                  {next.service.name} · {formatDay(next.start_at)} {formatTime(next.start_at)}
                </span>
                <span className="text-sm text-accent-foreground">
                  with {next.employee.name} · {next.location.name}
                </span>
              </div>
              <ReservationBadge status={next.status} />
            </div>
          </Link>
        )}

        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Your cars</h2>
            <Button variant="outline" size="sm" onClick={() => setAdding((a) => !a)} aria-expanded={adding}>
              <Plus aria-hidden className="size-4" />
              Add a car
            </Button>
          </div>

          {adding && (
            <AddCarForm
              onAdded={() => {
                setAdding(false);
                cars.refresh();
              }}
            />
          )}

          <DataState
            query={cars}
            isEmpty={(rows) => rows.length === 0}
            empty={{
              title: "No cars saved",
              description: "You do not need one — a booking asks for the plate. Saving a car just saves the typing.",
            }}
          >
            {(rows) => (
              <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rows.map((car) => (
                  <li key={car.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-mono text-2xl font-medium tracking-tight">{car.plate}</span>
                      <span className="truncate text-sm text-muted-foreground">
                        {[car.make, car.model, car.color].filter(Boolean).join(" · ") || "No details"}
                      </span>
                      {car.notes && <span className="truncate text-[13px] text-muted-foreground">{car.notes}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/book/new?plate=${encodeURIComponent(car.plate)}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Book this car
                      </Link>
                      <DeleteCarButton car={car} onDeleted={cars.refresh} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DataState>
        </section>
      </div>
    </BookingShell>
  );
}

function AddCarForm({ onAdded }: { onAdded: () => void }) {
  const [plate, setPlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  async function add() {
    setPending(true);
    try {
      await api.post("customer/cars", { plate, make, model, notes });
      toast.success("Car added");
      onAdded();
    } catch (err) {
      // 409 when this owner already has that plate. The plate is normalised
      // server-side, so "1234 uba" and "1234UBA" collide — which is the
      // intended behaviour and worth the clear message.
      toast.error("Could not add the car", { description: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 lg:max-w-2xl">
      <div className="grid gap-5 sm:grid-cols-3">
        <Field id="car-plate" label="Plate">
          <Input
            id="car-plate"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="1234 UBA"
            autoComplete="off"
            autoCapitalize="characters"
          />
        </Field>
        <Field id="car-make" label="Make">
          <Input id="car-make" value={make} onChange={(e) => setMake(e.target.value)} autoComplete="off" />
        </Field>
        <Field id="car-model" label="Model">
          <Input id="car-model" value={model} onChange={(e) => setModel(e.target.value)} autoComplete="off" />
        </Field>
      </div>
      <Field id="car-notes" label="Notes" hint="Anything the employee should know.">
        <Input id="car-notes" value={notes} onChange={(e) => setNotes(e.target.value)} autoComplete="off" />
      </Field>
      <Button onClick={add} disabled={pending || !plate.trim()} className="sm:w-fit sm:px-8">
        {pending ? "Adding…" : "Add car"}
      </Button>
    </div>
  );
}

function DeleteCarButton({ car, onDeleted }: { car: Car; onDeleted: () => void }) {
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function remove() {
    setPending(true);
    try {
      await api.delete(`customer/cars/${car.id}`);
      toast.success("Car removed");
      onDeleted();
    } catch (err) {
      toast.error("Could not remove the car", { description: errorMessage(err) });
    } finally {
      setPending(false);
      setConfirming(false);
    }
  }

  // Two taps, not a modal: a destructive action needs a confirmation, and a
  // dialog for one row is more ceremony than it deserves.
  if (confirming) {
    return (
      <div className="flex shrink-0 gap-1.5">
        <Button variant="destructive" size="sm" onClick={remove} disabled={pending}>
          {pending ? "…" : "Remove"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Keep
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="ml-auto size-9 shrink-0"
      aria-label={`Remove ${car.plate}`}
      onClick={() => setConfirming(true)}
    >
      <Trash2 aria-hidden className="size-4" />
    </Button>
  );
}
