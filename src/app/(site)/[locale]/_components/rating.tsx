import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Five stars with ONE label for the group.
 *
 * `role="img"` is what the label attaches to: a bare span has no role for an
 * `aria-label` to hang on, and five separate star icons would otherwise be
 * announced as five separate nothings. The number is the information; the
 * stars are how it looks.
 *
 * Shared by the hero pill and the review cards, which is why it sits here
 * rather than inside either section.
 */
export function Rating({ rating, label, className }: { rating: number; label: string; className?: string }) {
  return (
    <span role="img" aria-label={label} title={label} className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((step) => (
        <Star
          key={step}
          aria-hidden
          className={cn("size-3.5", step <= Math.round(rating) ? "fill-primary text-primary" : "text-border")}
        />
      ))}
    </span>
  );
}
