import { brand } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * Splits a trading name into the three pieces the wordmark draws.
 *
 * The original design accented a letter in the middle of a compound word —
 * Car**W**ash — which only works for a name that is one word pretending to be
 * two. A tenant name is arbitrary ("Bayanbogd car wash"), so the rule here is
 * the one that is predictable for any of them: accent the first letter.
 *
 * Exported for the hero, which draws the same name at poster size and must
 * not invent a second rule for where the accent falls.
 */
export function splitWordmark(name: string): { before: string; accent: string; after: string } {
  const trimmed = name.trim();
  if (!trimmed) return brand.wordmark;
  return { before: "", accent: trimmed.slice(0, 1), after: trimmed.slice(1) };
}

/**
 * The company name with one letter in the accent colour.
 *
 * The name comes from the platform, not from this repository. Renaming the
 * business in the console reaches every page on the next revalidation, rather
 * than needing a rebuild of a value compiled into the bundle — which is the
 * failure this replaced: a storefront confidently showing a name the customer
 * stopped using months ago.
 *
 * Takes the name as a PROP rather than fetching it. The header is a Client
 * Component — it owns a menu toggle — and a client component cannot read the
 * tenant key or await a server fetch. So the one server boundary above it
 * fetches once and passes it down, which is also the only arrangement where
 * the header and the footer cannot disagree about the name.
 *
 * `content/site.ts` still carries a wordmark and it is now a fallback for one
 * case only: the API could not answer, and a header still has to render
 * something rather than collapsing.
 */
export function Wordmark({ name, className }: { name?: string; className?: string }) {
  const parts = name ? splitWordmark(name) : brand.wordmark;

  return (
    <span className={cn("font-semibold tracking-tight", className)}>
      {parts.before}
      <span className="text-primary">{parts.accent}</span>
      {parts.after}
    </span>
  );
}
