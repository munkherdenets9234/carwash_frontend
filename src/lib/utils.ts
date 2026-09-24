import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * The business timezone. It must match the backend's TIMEZONE, because the
 * API cuts every report and every ?day= on that calendar day — formatting a
 * date in the browser's own zone would label a row with a different day than
 * the one the server grouped it into.
 *
 * Hard-coded rather than read from the browser for exactly that reason. When
 * a second market appears this becomes a value from /readyz, which already
 * reports the server's zone.
 */
export const BUSINESS_TZ = "Asia/Ulaanbaatar";

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: BUSINESS_TZ,
});

const dayFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: BUSINESS_TZ,
});

const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: BUSINESS_TZ,
});

/** "14:30" in the business timezone. */
export function formatTime(iso: string | undefined): string {
  if (!iso) return "—";
  return timeFmt.format(new Date(iso));
}

/** "Mon 21 Sep" in the business timezone. */
export function formatDay(iso: string | undefined): string {
  if (!iso) return "—";
  return dayFmt.format(new Date(iso));
}

/** "21 Sep, 14:30" in the business timezone. */
export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  return dateTimeFmt.format(new Date(iso));
}

/** "14:30 – 15:30". */
export function formatRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`;
}

/**
 * Today as YYYY-MM-DD in the business timezone — the format every ?day= and
 * ?from=/?to= parameter takes. `toISOString().slice(0,10)` would give the UTC
 * day, which is the previous date for eight hours of every evening here.
 */
export function businessToday(): string {
  return isoDayOf(new Date());
}

export function isoDayOf(date: Date): string {
  // en-CA gives YYYY-MM-DD, which is what the API parses.
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TZ }).format(date);
}

export function addDays(isoDay: string, days: number): string {
  const [y, m, d] = isoDay.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

const mntFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** "30 000₮". Amounts are whole tugrik — see models.MNT in the backend. */
export function formatMNT(amount: number | undefined): string {
  if (amount === undefined || amount === null) return "—";
  return `${mntFmt.format(amount).replace(/,/g, " ")}₮`;
}

/** "9.1 h", or "—" for nothing. */
export function formatHours(hours: number | undefined): string {
  if (!hours) return "—";
  return `${hours.toFixed(1)} h`;
}

/** "31 m", or "—" for the -1 the API uses when there was no GPS fix. */
export function formatDistance(metres: number | undefined): string {
  if (metres === undefined || metres === null || metres < 0) return "—";
  return `${Math.round(metres)} m`;
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
