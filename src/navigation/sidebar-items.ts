import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarCheck,
  CalendarRange,
  Car,
  ClipboardList,
  Clock,
  Image as ImageIcon,
  MapPin,
  Plus,
  Timer,
  Users,
} from "lucide-react";

// One list drives the sidebar, the mobile nav and the active-state highlight.
// Adding a manager screen means adding it here, so a route can never exist
// without a way to reach it.

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Shown under the title in the mobile drawer, where there is room for it. */
  description?: string;
}

export const managerNav: NavItem[] = [
  { title: "Day report", href: "/manager", icon: BarChart3, description: "Revenue, bonus and hours" },
  { title: "Bookings", href: "/manager/bookings", icon: ClipboardList, description: "Every wash, and reassignment" },
  { title: "Roster", href: "/manager/roster", icon: CalendarRange, description: "Who is working when" },
  { title: "Timesheets", href: "/manager/timesheets", icon: Timer, description: "Clock-ins and hours" },
  { title: "Staff", href: "/manager/staff", icon: Users, description: "Employees, managers, customers" },
  { title: "Prices & sites", href: "/manager/catalogue", icon: MapPin, description: "Price list and geofences" },
  { title: "Photographs", href: "/manager/gallery", icon: ImageIcon, description: "What the public site shows" },
];

/** The employee's phone tabs. */
export const employeeNav: NavItem[] = [
  { title: "Today", href: "/employee", icon: Clock },
  { title: "Jobs", href: "/employee/jobs", icon: ClipboardList },
  { title: "Hours", href: "/employee/timesheet", icon: Timer },
];

/** The customer's phone tabs. */
export const customerNav: NavItem[] = [
  { title: "Garage", href: "/book", icon: Car },
  { title: "Book", href: "/book/new", icon: Plus },
  { title: "Bookings", href: "/book/bookings", icon: CalendarCheck },
];
