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
  { title: "Өдрийн тайлан", href: "/manager", icon: BarChart3, description: "Орлого, урамшуулал, ажилласан цаг" },
  {
    title: "Захиалгууд",
    href: "/manager/bookings",
    icon: ClipboardList,
    description: "Бүх угаалга, ажилтан сольж оноох",
  },
  { title: "Хуваарь", href: "/manager/roster", icon: CalendarRange, description: "Хэн хэзээ ажилладаг" },
  { title: "Ирцийн бүртгэл", href: "/manager/timesheets", icon: Timer, description: "Ирц болон ажилласан цаг" },
  { title: "Ажилтнууд", href: "/manager/staff", icon: Users, description: "Ажилтан, менежер, харилцагч" },
  { title: "Үнэ, байршил", href: "/manager/catalogue", icon: MapPin, description: "Үнийн жагсаалт, байршлын хязгаар" },
  { title: "Зургууд", href: "/manager/gallery", icon: ImageIcon, description: "Нийтэд харагдах зургууд" },
];

/** The employee's phone tabs. */
export const employeeNav: NavItem[] = [
  { title: "Өнөөдөр", href: "/employee", icon: Clock },
  { title: "Ажлууд", href: "/employee/jobs", icon: ClipboardList },
  { title: "Цаг", href: "/employee/timesheet", icon: Timer },
];

/** The customer's phone tabs. */
export const customerNav: NavItem[] = [
  { title: "Миний машин", href: "/book", icon: Car },
  { title: "Захиалах", href: "/book/new", icon: Plus },
  { title: "Захиалгууд", href: "/book/bookings", icon: CalendarCheck },
];

/**
 * Whether a nav item is the active one for the current path.
 *
 * A plain `pathname.startsWith(item.href)` is wrong for whichever item is
 * the SECTION'S INDEX ROUTE - "/manager" is a prefix of "/manager/roster",
 * so a naive prefix match would light up "Day report" on every manager page.
 * The call sites here used to each hardcode their own exception list
 * ("/manager" in one place, "/employee" and a now-dead "/book" in another),
 * which is exactly the kind of list that silently stops being updated the
 * next time a section gains one.
 *
 * This computes the same answer without a hardcoded list: an item is an
 * index route if some OTHER item in the same nav is nested under it (its
 * href starts with `${item.href}/`). Add a section, and its index route is
 * handled correctly with nothing to remember.
 */
export function isNavItemActive(pathname: string, item: NavItem, allItems: NavItem[]): boolean {
  const isIndexRoute = allItems.some((other) => other.href !== item.href && other.href.startsWith(`${item.href}/`));
  return isIndexRoute ? pathname === item.href : pathname.startsWith(item.href);
}
