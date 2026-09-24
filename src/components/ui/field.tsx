import { type ComponentProps, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const controlClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(controlClass, "pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlClass, "h-auto min-h-20 resize-none py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
}

/**
 * Label, control, and the hint or error that describes it — wired together.
 *
 * There is no exported Label on purpose. This is the only way to label a
 * control here, so an unlabelled input cannot be written by accident: an
 * unlabelled input is invisible to a screen reader and its label is not a
 * click target, and both are easy to lose when every form lays its own
 * fields out by hand.
 *
 * The hint or error is linked to the control with aria-describedby rather
 * than merely rendered near it. Rendering it alone is the version that looks
 * right and says nothing: a screen reader announces the label and the value,
 * and the explanation of what went wrong never reaches the person who needs
 * it most.
 */
export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  /** A single control element — it receives id and aria-describedby. */
  children: ReactNode;
  className?: string;
}) {
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = errorId ?? hintId;

  // The describedby is attached to the child rather than asked of every call
  // site, because "remember to add aria-describedby" is exactly the step that
  // gets skipped. A non-element child (rare) is rendered untouched.
  const control =
    isValidElement(children) && describedBy
      ? cloneElement(children as ReactElement<{ "aria-describedby"?: string; "aria-invalid"?: boolean }>, {
          "aria-describedby": describedBy,
          "aria-invalid": error ? true : undefined,
        })
      : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-foreground">
        {label}
      </label>
      {control}
      {hintId && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {errorId && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
