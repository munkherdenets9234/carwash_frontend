import { AlertTriangle, Inbox, Loader2, ShieldOff } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

function Frame({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    // role=status so a screen reader announces the wait instead of sitting in
    // silence; aria-live=polite keeps it from interrupting.
    <Frame>
      <Loader2 aria-hidden className="size-5 animate-spin text-muted-foreground" />
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {label}…
      </p>
    </Frame>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Frame>
      <Inbox aria-hidden className="size-5 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-sm text-[13px] text-muted-foreground">{description}</p>}
    </Frame>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Frame className="border-destructive/40">
      <AlertTriangle aria-hidden className="size-5 text-destructive" />
      <p className="text-sm font-medium">Could not load this</p>
      <p className="max-w-sm text-[13px] text-muted-foreground">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-1 text-[13px] font-semibold text-primary underline">
          Try again
        </button>
      )}
    </Frame>
  );
}

export function ForbiddenState() {
  return (
    <Frame>
      <ShieldOff aria-hidden className="size-5 text-muted-foreground" />
      <p className="text-sm font-medium">Not available to your account</p>
      <p className="max-w-sm text-[13px] text-muted-foreground">
        Your role does not include this. Nothing is wrong with the request — ask a manager if you need access.
      </p>
    </Frame>
  );
}

/**
 * PlanLimitedState is the 402 screen: the business has not bought this, or has
 * stopped paying for it, or has used all of something its plan allows.
 *
 * A real screen rather than a toast, because none of those is a transient
 * failure and none is fixed by the person looking at it trying again. The
 * message comes from the API rather than being written here: only the backend
 * knows whether this is "not on your plan" or "you have used all 3 branches",
 * and inventing one sentence for both would be wrong half the time.
 */
export function PlanLimitedState({ message }: { message?: string }) {
  return (
    <Frame>
      <ShieldOff aria-hidden className="size-5 text-muted-foreground" />
      <p className="text-sm font-medium">Not included in this plan</p>
      <p className="max-w-sm text-[13px] text-muted-foreground">
        {message ?? "This business's subscription does not cover this."} Nothing is wrong with the request — it needs a
        change to the subscription rather than to your account.
      </p>
    </Frame>
  );
}

/**
 * DataState renders the one state that applies, in the order that matters:
 * plan-limited, refused, failed, loading, empty, then the data.
 *
 * Plan-limited and forbidden both come before error because they ARE errors
 * but not retryable ones, and offering "try again" on either teaches people
 * to hammer a button that cannot work. Plan-limited comes first of the two
 * because it is the more specific answer: a 402 tells you who can fix it
 * (whoever owns the subscription), while a 403 sends you to a manager who may
 * have no more power here than you do.
 */
export function DataState<T>({
  query,
  empty,
  isEmpty,
  children,
}: {
  query: {
    data: T | undefined;
    loading: boolean;
    error?: string;
    forbidden: boolean;
    planLimited?: boolean;
    refresh: () => void;
  };
  empty?: { title: string; description?: string };
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}) {
  if (query.planLimited) return <PlanLimitedState message={query.error} />;
  if (query.forbidden) return <ForbiddenState />;
  if (query.error) return <ErrorState message={query.error} onRetry={query.refresh} />;
  if (query.loading && query.data === undefined) return <LoadingState />;
  if (query.data === undefined) return <EmptyState title={empty?.title ?? "Nothing here"} />;
  if (isEmpty?.(query.data))
    return <EmptyState title={empty?.title ?? "Nothing here"} description={empty?.description} />;
  return <>{children(query.data)}</>;
}
