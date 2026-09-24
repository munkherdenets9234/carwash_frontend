import { Badge } from "@/components/ui/badge";
import type { ReservationStatus, UserStatus } from "@/lib/api/types";

// One mapping from a backend status to how it looks and reads, used by every
// screen. Written out rather than derived so adding a status to the API is a
// compile error here instead of a row that renders a raw enum value.

const RESERVATION: Record<ReservationStatus, { label: string; tone: "neutral" | "active" | "warning" | "danger" }> = {
  booked: { label: "Booked", tone: "active" },
  in_progress: { label: "In progress", tone: "warning" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
  no_show: { label: "No show", tone: "danger" },
};

export function ReservationBadge({ status }: { status: ReservationStatus }) {
  const meta = RESERVATION[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

const USER: Record<UserStatus, { label: string; tone: "active" | "danger" }> = {
  active: { label: "Active", tone: "active" },
  suspended: { label: "Suspended", tone: "danger" },
};

export function UserBadge({ status }: { status: UserStatus }) {
  const meta = USER[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
