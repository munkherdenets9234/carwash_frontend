"use client";

import { LogOut } from "lucide-react";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({ className, compact }: { className?: string; compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    // replace, not push: the signed-in page must not be reachable with the
    // back button after signing out.
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size={compact ? "sm" : "default"}
      onClick={signOut}
      disabled={pending}
      className={cn("justify-start text-muted-foreground", className)}
    >
      <LogOut aria-hidden />
      {pending ? "Гарч байна…" : "Гарах"}
    </Button>
  );
}
