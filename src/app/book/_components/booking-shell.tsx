import Link from "next/link";

import { Wordmark } from "@/app/(site)/[locale]/_components/wordmark";
import { contact } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * The chrome around booking, in the public site's visual language.
 *
 * Booking used to render inside MobileShell — a 32rem column with a fixed tab
 * bar, which is the right shape for a signed-in customer moving between a
 * garage, a booking list and a profile. It is the wrong shape for the page a
 * visitor lands on straight from the home page: the site is wide, typographic
 * and card-based, and dropping somebody from that into a narrow app frame
 * reads as a different website, which is exactly the moment a person checks
 * whether they are still somewhere they trust.
 *
 * So this borrows the site's measurements rather than approximating them —
 * the same max-w-6xl, the same gutters, the same sticky translucent header,
 * the same eyebrow-over-heading pattern that opens every section.
 *
 * What it deliberately does NOT borrow is the full navigation. The site
 * header offers Services, About, Reviews, Gallery and Find us, which is
 * correct for a page whose job is to interest somebody and wrong for one
 * whose job is to finish a booking: every one of those links is an exit
 * halfway through a form. What stays is a way back to the site, a way to
 * find an existing booking, and the wordmark — enough to prove where you
 * are, and nothing that invites you to leave.
 */
/** A link in the shell's reduced header nav. */
export type ShellLink = {
  label: string;
  href: string;
  /**
   * Hidden below the sm breakpoint. At 375px a wordmark, three links and a
   * sign-out button do not fit, and what gives way is the wordmark — which
   * truncated to "Ba…" and stopped saying whose site this is. A link that is
   * duplicated by a button on the page itself is the one that can go.
   */
  secondary?: boolean;
};

/**
 * What an anonymous visitor gets: a way to find an existing booking, and a
 * way back. Signed-in pages pass their own.
 */
const GUEST_LINKS: ShellLink[] = [
  { label: "Захиалга хайх", href: "/book/find" },
  { label: "Нүүр хуудас руу", href: "/" },
];

export function BookingShell({
  businessName,
  eyebrow,
  title,
  description,
  aside,
  links = GUEST_LINKS,
  headerAction,
  footerNote,
  children,
}: {
  businessName?: string;
  /** The small mono line above the heading, as on every site section. */
  eyebrow: string;
  title: string;
  description?: string;
  /** Sits opposite the heading on wide screens — a back link, a step count. */
  aside?: React.ReactNode;
  /**
   * Header links. Defaults to the guest pair; the signed-in pages replace
   * them with their own areas, because "Find a booking" is a stranger's
   * question to somebody who has all of theirs on the screen already.
   */
  links?: ShellLink[];
  /** Trailing header slot — the sign-out button, on signed-in pages. */
  headerAction?: React.ReactNode;
  /** Replaces the footer's sign-in invitation once there is an account. */
  footerNote?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5 md:h-20 md:px-10">
          {/* The name truncates rather than wrapping. A tenant name is
              arbitrary and can be long — "Bayanbogd car wash" already wraps
              to two lines at 375px — and a header that changes height on the
              narrowest phones pushes the page down by a row for no gain. */}
          <Link href="/" className="min-w-0 flex-1 truncate text-lg md:text-xl">
            <Wordmark name={businessName} />
          </Link>

          <nav aria-label="Booking" className="flex shrink-0 items-center gap-1 whitespace-nowrap sm:gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-2 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:px-3 sm:text-sm",
                  link.secondary && "hidden sm:inline-block",
                )}
              >
                {link.label}
              </Link>
            ))}
            {headerAction}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
              <h1 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">{title}</h1>
              {description && <p className="mt-3 max-w-xl text-muted-foreground">{description}</p>}
            </div>
            {aside}
          </div>

          <div className="mt-10 md:mt-12">{children}</div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-[13px] text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
          <p>
            {/* The telephone number is on this page for the same reason it is
                in the site footer: a form that will not do what somebody
                needs should never be the end of the road. */}
            Захиалахад бэрхшээлтэй байна уу? Утасдаарай:{" "}
            <a href={contact.phoneHref} className="font-medium text-foreground">
              {contact.phone}
            </a>
          </p>
          {footerNote ?? (
            <p>
              Өмнө нь захиалж байсан уу?{" "}
              <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
                Нэвтрэх
              </Link>{" "}
              бол бүх захиалгынхаа түүхийг харна.
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

/**
 * The three dashes that say how far through this is.
 *
 * Kept from the old flow, restyled: the site uses rules and mono labels for
 * this kind of thing, not pills, and a progress bar that looked borrowed from
 * a different product was the most obvious seam between the two designs.
 */
export function StepRail({ step, labels }: { step: number; labels: string[] }) {
  return (
    <ol className="flex gap-6" aria-label="Progress">
      {labels.map((label, i) => (
        <li
          key={label}
          aria-current={i === step ? "step" : undefined}
          className="flex flex-1 flex-col gap-2 md:flex-none"
        >
          <span className={`h-[3px] rounded-full md:w-24 ${i <= step ? "bg-primary" : "bg-border"}`} />
          <span
            className={`font-mono text-[11px] uppercase tracking-wider ${
              i === step ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * The header links for a signed-in customer.
 *
 * "Find a booking" is absent on purpose: it is a stranger's question, and
 * somebody signed in has all of theirs on the screen already.
 */
export const ACCOUNT_LINKS: ShellLink[] = [
  { label: "Миний машин", href: "/book" },
  { label: "Захиалгууд", href: "/book/bookings" },
  // Every account page carries a "Book a wash" button of its own, so this
  // one is the header link that can stand down on a phone.
  { label: "Захиалах", href: "/book/new", secondary: true },
];

/** Replaces the footer's sign-in invitation once there is an account. */
export function AccountFooterNote() {
  return <p>Энэ бүртгэлээр хийсэн бүх захиалга энд хадгалагдана — код санах шаардлагагүй.</p>;
}
