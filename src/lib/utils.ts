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

/**
 * Mongolian weekday and month NAMES, hand-written rather than asked of
 * Intl("mn-MN", ...).
 *
 * This is not a style choice. Intl silently falls back to a different locale
 * when the runtime's ICU data does not include the one asked for, and it does
 * so without an error: resolvedOptions().locale reports what it actually
 * used, but nothing throws and nothing warns. Tested in this project's own
 * embedded browser, Intl.DateTimeFormat("mn-MN", {...}).resolvedOptions()
 * came back "en-US" — the exact browser this app has to run in does not
 * carry Mongolian locale data, and produced "Fri, Sep 25" while believing it
 * had been asked correctly. Small-ICU builds like this are common outside
 * desktop Chrome too, Android WebView chief among them, which is precisely
 * where a lot of this app's Mongolian-speaking traffic will come from.
 *
 * So the words are a table this file owns, and Intl is only ever asked for
 * NUMBERS — a day-of-month, an hour, a minute — which is digit formatting
 * under the "latn" numbering system almost every runtime ships regardless of
 * which named locales it bundles. A number cannot silently become the wrong
 * language; a word table someone forgot to load can, and did.
 */
const MN_WEEKDAYS = ["Ням", "Дав", "Мяг", "Лха", "Пүр", "Баа", "Бям"]; // index = Date#getUTCDay()
const MN_MONTH = (m: number) => `${m}-р сар`; // 1-indexed; Mongolian names a month by number, not a word

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: BUSINESS_TZ,
});

// Pulls the calendar date apart as NUMBERS in the business timezone, with no
// named field in the request — the one part of this file still asking Intl
// for anything at all, and it only ever asks for digits.
const partsFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: BUSINESS_TZ,
});

function businessDateParts(date: Date): { year: number; month: number; day: number; weekday: number } {
  const parts = Object.fromEntries(partsFmt.formatToParts(date).map((p) => [p.type, p.value]));
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  // Built as a UTC date from the already-timezone-correct Y-M-D, purely to
  // get a weekday INDEX out of it — getUTCDay() needs no locale data at all,
  // unlike Intl's weekday: "short"/"long", which is the whole reason this
  // function exists rather than one more Intl call.
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, day, weekday };
}

/** "14:30" in the business timezone. */
export function formatTime(iso: string | undefined): string {
  if (!iso) return "—";
  return timeFmt.format(new Date(iso));
}

/** "Баа, 9-р сарын 25" in the business timezone. */
export function formatDay(iso: string | undefined): string {
  if (!iso) return "—";
  const { month, day, weekday } = businessDateParts(new Date(iso));
  return `${MN_WEEKDAYS[weekday]}, ${MN_MONTH(month)}ны ${day}`;
}

/**
 * The weekday alone — "Баа" for Friday — for a UI that puts it on its own
 * line above the date, the way a paper calendar does.
 */
export function formatWeekday(iso: string | undefined): string {
  if (!iso) return "—";
  return MN_WEEKDAYS[businessDateParts(new Date(iso)).weekday];
}

/** "9-р сарын 25" — day and month, no weekday. The other half of the pair above. */
export function formatDayMonth(iso: string | undefined): string {
  if (!iso) return "—";
  const { month, day } = businessDateParts(new Date(iso));
  return `${MN_MONTH(month)}ны ${day}`;
}

/** "9-р сарын 25, 14:30" in the business timezone. Unused today, kept in the
 * same locale-safe shape as its neighbours above rather than left calling a
 * formatter that no longer exists. */
export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  return `${formatDayMonth(iso)}, ${formatTime(iso)}`;
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

/** "9.1 ц", or "—" for nothing. */
export function formatHours(hours: number | undefined): string {
  if (!hours) return "—";
  return `${hours.toFixed(1)} ц`;
}

/** "31 m", or "—" for the -1 the API uses when there was no GPS fix. */
export function formatDistance(metres: number | undefined): string {
  if (metres === undefined || metres === null || metres < 0) return "—";
  return `${Math.round(metres)} м`;
}

/**
 * An ISO instant as the value a `datetime-local` input wants, on the
 * business's clock: "2026-09-25T18:25".
 *
 * The input has no timezone of its own — it shows whatever string it is given
 * — so the conversion has to happen here rather than being left to the
 * browser, which would show the editor's own zone and silently move the time
 * for anyone working from a different one.
 */
export function isoToBusinessLocal(iso: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TZ }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BUSINESS_TZ,
  }).format(date);
  return `${day}T${time}`;
}

/**
 * The reverse: a `datetime-local` value read as business time, returned as an
 * ISO instant for the API.
 *
 * The offset is measured at that moment rather than assumed. Mongolia has not
 * observed summer time since 2017, so +08:00 would be right today — and a
 * hard-coded offset is exactly the kind of thing that is right until a
 * government changes its mind, at which point every booking edited across the
 * boundary is an hour out and nobody can see why.
 */
export function businessLocalToISO(local: string): string {
  // Read the wall-clock reading as though it were UTC, then subtract the zone
  // offset in force at that instant.
  const asUTC = new Date(`${local}:00Z`);
  const offsetMinutes = businessOffsetMinutes(asUTC);
  return new Date(asUTC.getTime() - offsetMinutes * 60_000).toISOString();
}

/** Minutes the business zone is ahead of UTC at a given instant. */
function businessOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ,
    timeZoneName: "longOffset",
  }).formatToParts(at);
  const name = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+00:00";
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
