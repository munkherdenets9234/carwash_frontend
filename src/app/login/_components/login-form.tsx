"use client";

import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import type { ApiEnvelope, Role } from "@/lib/api/types";

const DEMO_ACCOUNTS: { label: string; email: string; password: string }[] = [
  { label: "Manager", email: "manager@carwash.mn", password: "manager123" },
  { label: "Employee", email: "bat@carwash.mn", password: "employee123" },
  { label: "Customer", email: "customer@example.mn", password: "customer123" },
];

function homePathFor(role: Role) {
  if (role === "manager") return "/manager";
  if (role === "employee") return "/employee";
  return "/book";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const reason = params.get("reason");
  const next = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const envelope = (await res.json().catch(() => null)) as ApiEnvelope<{ user: { role: Role } }> | null;

      if (!res.ok || !envelope?.success || !envelope.data) {
        // 429 carries Retry-After from the backend's limiter. Saying how long
        // to wait is the difference between a usable message and one that
        // invites the user to keep hammering a locked door.
        if (res.status === 429) {
          const wait = res.headers.get("Retry-After");
          setError(wait ? `Too many attempts. Try again in ${wait} seconds.` : "Too many attempts. Try again shortly.");
        } else {
          setError(envelope?.error?.message ?? "Could not sign in");
        }
        return;
      }

      // The server set httpOnly cookies; this navigation is what makes the
      // proxy guard see them. router.refresh() first so the new cookies are
      // picked up by the Server Components on the destination.
      const target = next?.startsWith("/") ? next : homePathFor(envelope.data.user.role);
      router.replace(target);
      router.refresh();
    } catch {
      setError("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  function fill(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setError(undefined);
  }

  return (
    <div className="flex flex-col gap-6">
      {reason === "session-expired" && (
        <p
          role="alert"
          className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-[13px] text-warning"
        >
          Your session ended. Sign in again to carry on.
        </p>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field id="email" label="Email">
          <Input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field id="password" label="Password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error && (
          <p role="alert" className="text-[13px] text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {/* The way out for somebody who has no account. Booking never needs
          one, so most people arriving here are customers who chose to keep
          their history — and before this, nothing on the site linked to the
          signup page at all. */}
      <p className="text-center text-[13px] text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
          Create one
        </Link>{" "}
        — or{" "}
        <Link href="/book/find" className="font-medium text-foreground underline underline-offset-4">
          find a booking with its code
        </Link>
        .
      </p>

      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Demo accounts</span>
        <div className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <Button key={account.email} variant="outline" size="sm" onClick={() => fill(account)}>
              {account.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
