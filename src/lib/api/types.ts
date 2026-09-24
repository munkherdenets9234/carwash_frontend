// Typed mirrors of the carwash API's responses.
//
// These are hand-written against the Go `internal/view` package rather than
// generated, and they mirror its audience split exactly: `Reservation` is what
// a customer receives and `StaffReservation` is what an employee or manager
// receives. Collapsing them into one optional-field type here would quietly
// undo the reason the backend keeps them apart — the customer's response has
// no bonus and no other customer's phone number in it.

// ── Envelope ──────────────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiErrorBody;
}

export interface ApiErrorBody {
  domain: string;
  code: string;
  message: string;
  stack_trace?: string;
}

/** Stable machine-readable codes. Branch on these, never on `message`. */
export const ErrorCode = {
  Unauthorized: "UNAUTHORIZED",
  Forbidden: "FORBIDDEN",
  NotFound: "NOT_FOUND",
  Conflict: "CONFLICT",
  ValidationFailed: "VALIDATION_FAILED",
  RateLimited: "RATE_LIMITED",
  OutsideGeofence: "OUTSIDE_GEOFENCE",
  SlotUnavailable: "SLOT_UNAVAILABLE",
  FeatureUnavailable: "FEATURE_UNAVAILABLE",
} as const;

// ── Identity ──────────────────────────────────────────────────────────────

export type Role = "manager" | "employee" | "customer";
export type UserStatus = "active" | "suspended";

export interface Me {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone?: string;
  home_location_id?: string;
}

export interface Session {
  token: string;
  expires_at: string;
  user: Me;
}

/** An employee as a customer sees them: enough to choose, nothing more. */
export interface EmployeeCard {
  id: string;
  name: string;
}

/** A person as a manager sees them — the full personnel record. */
export interface StaffMember {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone?: string;
  status: UserStatus;
  home_location_id?: string;
  hired_at?: string;
  created_at: string;
}

// ── Catalogue ─────────────────────────────────────────────────────────────

export interface Location {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  geofence_radius_m: number;
  active: boolean;
}

export interface WashService {
  id: string;
  name: string;
  description?: string;
  duration_min: number;
  price_mnt: number;
  active: boolean;
}

/** The manager's and employee's view of a service: it carries the bonus. */
export interface StaffWashService extends WashService {
  bonus_mnt: number;
}

// ── Cars ──────────────────────────────────────────────────────────────────

export interface Car {
  id: string;
  plate: string;
  make?: string;
  model?: string;
  color?: string;
  notes?: string;
  created_at: string;
}

export interface CarBrief {
  id: string;
  plate: string;
  make?: string;
  model?: string;
  color?: string;
}

// ── Reservations ──────────────────────────────────────────────────────────

export type ReservationStatus = "booked" | "in_progress" | "completed" | "cancelled" | "no_show";

export interface NamedRef {
  id: string;
  name?: string;
}

/** A booking as its own customer sees it. No bonus, no customer block. */
export interface Reservation {
  id: string;
  status: ReservationStatus;
  start_at: string;
  end_at: string;
  service: NamedRef;
  employee: NamedRef;
  location: NamedRef;
  car: CarBrief;
  price_mnt: number;
  notes?: string;
  completed_at?: string;
  created_at: string;
}

/**
 * A booking as somebody who booked WITHOUT an account sees it.
 *
 * The reference is the only thing that finds it again, and the API sends it
 * exactly twice: on the booking response, and on a successful lookup. There
 * is no route that will tell you the code for a booking you cannot already
 * identify — so if the client drops it, it is gone, and the customer has to
 * telephone the business.
 */
export interface GuestBooking extends Reservation {
  /** Formatted with its dash, e.g. "4KQP-M7HX". */
  reference: string;
}

/** The same booking as staff see it: what it pays, and who to call. */
export interface StaffReservation extends Reservation {
  bonus_mnt: number;
  customer: { id: string; name?: string; phone?: string };
}

// ── Availability ──────────────────────────────────────────────────────────

export interface Slot {
  start_at: string;
  end_at: string;
  location_id: string;
}

export interface EmployeeAvailability {
  employee: EmployeeCard;
  /** Always an array. Empty means working but fully booked. */
  slots: Slot[];
}

// ── Roster ────────────────────────────────────────────────────────────────

export interface Shift {
  id: string;
  employee: NamedRef;
  location: NamedRef;
  start_at: string;
  end_at: string;
}

// ── Attendance ────────────────────────────────────────────────────────────

export interface TimeEntry {
  id: string;
  employee: NamedRef;
  location: NamedRef;
  clock_in_at: string;
  clock_in_distance_m: number;
  clock_out_at?: string;
  /** -1 when the device gave no usable fix at clock-out — not 0, which would
   * read as "standing on the site". */
  clock_out_distance_m?: number;
  worked_minutes: number;
  running: boolean;
}

export interface Timesheet {
  from: string;
  to: string;
  entries: TimeEntry[];
  total_entries: number;
  worked_minutes: number;
  worked_hours: number;
  open_entries: number;
}

// ── Report ────────────────────────────────────────────────────────────────

export interface EmployeeDaily {
  employee_id: string;
  name: string;
  washes: number;
  revenue_mnt: number;
  bonus_mnt: number;
  worked_minutes: number;
  worked_hours: number;
}

export interface DailyReport {
  day: string;
  washes: number;
  revenue_mnt: number;
  bonus_mnt: number;
  net_mnt: number;
  employees: EmployeeDaily[];
}

// ── Operational ───────────────────────────────────────────────────────────

export interface ReadyFeature {
  name: string;
  enabled: boolean;
  detail?: string;
}

export interface Readiness {
  status: string;
  env: string;
  timezone: string;
  degraded: boolean;
  features: ReadyFeature[];
}

/** The tenant's display identity, from GET /api/v1/tenant. */
export interface Business {
  name: string;
  slug: string;
}

/** Where a photograph appears on the site. */
export type MediaRole = "hero" | "about" | "gallery";

/** An uploaded photograph, from GET /api/v1/media. */
export interface Media {
  id: string;
  role: MediaRole;
  url: string;
  /** Intrinsic size, from the upload. next/image needs both or the page shifts as each image loads. */
  width: number;
  height: number;
  /** Locale map. Sent whole so switching language needs no round trip. */
  alt: Record<string, string>;
  tag?: string;
  feature: boolean;
  sort_order: number;
  active: boolean;
}
