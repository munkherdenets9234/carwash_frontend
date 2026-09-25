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
      eyebrow="Заавал биш"
      title="Бүртгэл үүсгэх"
      description="Захиалахын тулд бүртгэл шаардлагагүй. Гэхдээ бүртгэлтэй бол бүх захиалга нэг дор хадгалагдана, кодоо санах шаардлагагүй болно."
    >
      <div className="grid gap-10 lg:grid-cols-[28rem_1fr] lg:items-start">
        <RegisterForm />

        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border px-6 py-6 text-sm leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">Өмнө нь бүртгэлгүйгээр захиалж байсан уу?</p>
          <p>
            Зүүн талын талбарт захиалгын кодоо оруулаарай. Тэр захиалга — мөн ижил утасны дугаараар хийсэн бусад
            захиалгууд — таны бүртгэл рүү шилжинэ, ингэснээр өмнөх түүхээ хадгалж авна.
          </p>
          <p>
            Ганцхан захиалгаа шалгамаар байна уу?{" "}
            <Link href="/book/find" className="font-medium text-foreground underline underline-offset-4">
              Кодоор нь хайх
            </Link>{" "}
            боломжтой. Бүртгэл шаардлагагүй.
          </p>
          <p className="border-t border-border pt-4">
            Бүртгэлтэй юу?{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
              Нэвтрэх
            </Link>
          </p>
        </div>
      </div>
    </BookingShell>
  );
}
