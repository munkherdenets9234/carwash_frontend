"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

/**
 * Creating an account, with or without bookings already to its name.
 *
 * The `reference` field is what makes this more than an ordinary signup. A
 * guest who has booked already HAS a customer record — keyed by their phone
 * number, holding their bookings — and the account has to become THAT record
 * rather than a new one beside it, or their history is left behind on a row
 * nobody can sign in to.
 *
 * The code is how that is proved. It is the same pair the public lookup
 * asks for, checked by the same code path on the server, because a second
 * implementation of one security check is the one that drifts. Without it,
 * signing up with a number that has booked before is refused with a message
 * saying what to do — not silently given an empty account, and not, as it
 * did before this existed, refused with "that email address is already
 * registered" about an address nobody had ever used.
 *
 * When the flow already knows the code — right after a booking — the fields
 * are passed in and locked, so the common path is a password and nothing
 * else.
 */
export function RegisterForm({
  presetReference,
  presetPhone,
  presetName,
  onDone,
  submitLabel = "Бүртгэл үүсгэх",
}: {
  /** A reference this page already holds, e.g. the booking just made. */
  presetReference?: string;
  presetPhone?: string;
  presetName?: string;
  /** Where to go afterwards. Defaults to the customer's bookings. */
  onDone?: () => void;
  submitLabel?: string;
}) {
  const router = useRouter();
  const locked = Boolean(presetReference);

  const [name, setName] = useState(presetName ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(presetPhone ?? "");
  const [reference, setReference] = useState(presetReference ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: phone.trim() || undefined,
          reference: reference.trim() || undefined,
        }),
      });
      const envelope = await res.json().catch(() => null);

      if (!res.ok || !envelope?.success) {
        // The backend's own message is shown rather than a generic one. The
        // two that matter here — "there are already bookings under that
        // phone number" and "there is already an account for that phone
        // number" — each tell somebody exactly what to do next, and both are
        // useless replaced with "could not register".
        setError(envelope?.error?.message ?? envelope?.message ?? "Бүртгэл үүсгэж чадсангүй.");
        return;
      }

      toast.success("Бүртгэл үүслээ");
      if (onDone) onDone();
      else router.push("/book/bookings");
      router.refresh();
    } catch {
      setError("Серверт холбогдож чадсангүй. Түр хүлээгээд дахин оролдоно уу.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="reg-name" label="Таны нэр">
          <Input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </Field>

        <Field
          id="reg-phone"
          label="Утасны дугаар"
          hint={locked ? "Энэ захиалгыг хийсэн утасны дугаар." : "Заавал биш, гэхдээ хийсэн захиалгуудтай холбоно."}
        >
          <Input
            id="reg-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="9911 2233"
            readOnly={locked}
            className={locked ? "text-muted-foreground" : undefined}
          />
        </Field>
      </div>

      <Field id="reg-email" label="Имэйл">
        <Input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </Field>

      <Field id="reg-password" label="Нууц үг" hint="Хамгийн багадаа 8 тэмдэгт.">
        <Input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      {locked ? (
        <p className="rounded-lg border border-border bg-muted px-4 py-3 text-[13px] leading-relaxed">
          <span className="font-mono font-semibold">{presetReference}</span> захиалга энэ бүртгэл рүү шилжинэ, мөн энэ
          дугаараар хийсэн бусад захиалгууд ч мөн адил.
        </p>
      ) : (
        <Field
          id="reg-reference"
          label="Захиалгын код"
          hint="Заавал биш. Өмнө нь бүртгэлгүйгээр захиалж байсан бол кодоо оруулж захиалгаа энд авчрах боломжтой."
        >
          <Input
            id="reg-reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="4KQP-M7HX"
            autoComplete="off"
            autoCapitalize="characters"
            className="font-mono tracking-wider"
          />
        </Field>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-border bg-card px-4 py-3 text-[13px] leading-relaxed">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="sm:w-fit sm:px-8">
        {pending ? "Үүсгэж байна…" : submitLabel}
      </Button>
    </form>
  );
}
