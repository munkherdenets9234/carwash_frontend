import { type NextRequest, NextResponse } from "next/server";

// Next 16 renamed Middleware to Proxy; the file must sit beside `app`.
//
// This is a NAVIGATION guard, not an authorisation one. It reads the session
// cookie to decide which shell to show and keeps a customer from landing on a
// manager URL that would only 403 — but it never trusts that cookie for
// access: every call still carries the bearer token to the Go API, which
// checks the caller's real role against the database on each request. Getting
// past this guard buys an empty screen, not data.

const TOKEN_COOKIE = "cw_token";
const USER_COOKIE = "cw_user";
const LOGIN_PATH = "/login";

type Role = "manager" | "employee" | "customer";

/** Route prefixes each role owns. */
const AREA_ROLES: Record<string, Role> = {
  "/manager": "manager",
  "/employee": "employee",
  "/book": "customer",
};

/**
 * Paths inside a guarded area that anybody may reach.
 *
 * Booking is the whole point of the site, and until now it sat behind the
 * login guard: a visitor who had just read a price and pressed Book was
 * shown a sign-in form. Asking somebody to open an account before they have
 * bought anything is how a car wash loses a customer to the telephone.
 *
 * Finding a booking is open for the same reason. It needs the reference code
 * AND the phone number the booking was made with, which is the pair that
 * stands in for an account — a code alone gets forwarded, a number alone is
 * not a secret.
 *
 * What stays guarded is everything that shows a HISTORY rather than a single
 * booking: the garage, and the list of every booking a person has made.
 * Those are the surfaces where signing in earns its keep.
 */
const PUBLIC_PATHS = new Set(["/book/new", "/book/find"]);

function homePathFor(role: Role): string {
  if (role === "manager") return "/manager";
  if (role === "employee") return "/employee";
  return "/book";
}

function roleFromCookie(raw: string | undefined): Role | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as { role?: string };
    if (parsed.role === "manager" || parsed.role === "employee" || parsed.role === "customer") return parsed.role;
    return null;
  } catch {
    return null;
  }
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasToken = Boolean(req.cookies.get(TOKEN_COOKIE)?.value);
  const role = roleFromCookie(req.cookies.get(USER_COOKIE)?.value);

  const area = Object.keys(AREA_ROLES).find((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  // Checked before the area guard, not inside it, so a public path is public
  // whether or not there is a session. A signed-in customer following a link
  // from the site lands on the same booking form as everybody else — one
  // flow, which is the one that stays tested.
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  if (area) {
    if (!hasToken) {
      const url = new URL(LOGIN_PATH, req.url);
      // Carried so a bookmarked deep link survives the detour through login.
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    // Signed in, wrong area: send them to their own rather than showing a
    // shell full of calls that will all come back 403.
    if (role && role !== AREA_ROLES[area]) {
      return NextResponse.redirect(new URL(homePathFor(role), req.url));
    }
    return NextResponse.next();
  }

  if (pathname === LOGIN_PATH && hasToken && role) {
    const next = req.nextUrl.searchParams.get("next");
    const target = next?.startsWith("/") ? next : homePathFor(role);
    return NextResponse.redirect(new URL(target, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/manager/:path*", "/employee/:path*", "/book/:path*", "/login"],
};
