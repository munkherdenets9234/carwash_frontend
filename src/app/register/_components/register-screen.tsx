import Link from "next/link";

import { BookingShell } from "@/app/book/_components/booking-shell";
import { RegisterForm } from "@/app/book/_components/register-form";

/**
 * Signing up, for somebody who came looking for it rather than being handed
 * it at the end of a booking.
 *
 * An account is never required to book. What it buys is the history — every
 * booking in one place, without a code for each — so this page says that
 * plainly instead of implying registration was the way in all along.
 */
export function RegisterScreen({ businessName }: { businessName?: string }) {
  return (
    <BookingShell
      businessName={businessName}
      eyebrow="Optional"
      title="Create an account"
      description="You never need one to book. It keeps every booking in one place, so you are not looking after a code for each."
    >
      <div className="grid gap-10 lg:grid-cols-[28rem_1fr] lg:items-start">
        <RegisterForm />

        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border px-6 py-6 text-sm leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">Already booked without an account?</p>
          <p>
            Put your booking code in the field on the left. That booking — and anything else booked with the same phone
            number — moves into the account, so you keep the history you already have.
          </p>
          <p>
            Only want to check one booking?{" "}
            <Link href="/book/find" className="font-medium text-foreground underline underline-offset-4">
              Find it with the code
            </Link>{" "}
            instead. No account needed.
          </p>
          <p className="border-t border-border pt-4">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </BookingShell>
  );
}
