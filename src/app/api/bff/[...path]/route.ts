import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { API_BASE, TENANT_API_KEY, TOKEN_COOKIE } from "@/lib/api/server";

// BFF proxy: /api/bff/<path> → <backend>/api/v1/<path>
//
// It attaches the httpOnly token cookie as a Bearer header, so client code
// calls the backend same-origin and never holds the token. Method, query
// string, body and status pass through unchanged, which means the audience
// segmentation on the Go side still does the real work: this proxy grants
// nothing, it only carries the caller's own identity.

type Ctx = { params: Promise<{ path: string[] }> };

/**
 * The backend routes that answer without a bearer token.
 *
 * Method and path, written out, because this proxy used to refuse every
 * unauthenticated call and that was correct only while every useful route
 * needed a session. Booking without an account broke it: the page rendered,
 * its first fetch came back 401 from this file, and the client dutifully
 * redirected a visitor who had no account to a sign-in form.
 *
 * The important property of this list is that getting it WRONG in the
 * permissive direction grants nothing. The Go service checks every request
 * independently — the tenant key, the audience, the role — so an extra entry
 * here only means a request is forwarded to be refused there instead of
 * refused here. It cannot open a route the backend keeps shut. What it can
 * do is close one the backend keeps open, which is the failure that actually
 * happened, and is why the list is explicit rather than a prefix match.
 *
 * It mirrors publicRoutes in the Go service's guard_test.go. The two are
 * checked separately and neither is generated from the other, so they are
 * kept in step by hand — a route added to one belongs in the other.
 */
const ANONYMOUS_ROUTES = new Set([
  // The shopfront: the price list, the sites, the trading name, the pictures.
  "GET services",
  "GET locations",
  "GET tenant",
  "GET media",
  // Booking without an account: who is free, and when.
  "GET employees",
  "GET availability",
  // The booking itself, and finding it again with its code and phone number.
  "POST bookings",
  "GET bookings/lookup",
]);

async function forward(req: NextRequest, ctx: Ctx) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;

  const { path } = await ctx.params;
  const route = `${req.method} ${path.join("/")}`;

  if (!token && !ANONYMOUS_ROUTES.has(route)) {
    // Answered in the backend's own envelope so the client's parser needs no
    // special case for "the proxy refused" versus "the API refused".
    return NextResponse.json(
      { success: false, error: { domain: "AUTH", code: "UNAUTHORIZED", message: "not signed in" } },
      { status: 401 },
    );
  }

  const target = `${API_BASE}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;

  // The tenant key goes on every forwarded request, with or without a
  // session. It says WHICH business; the bearer token says which person
  // within it. A public route needs the first and not the second, which is
  // the whole shape of an anonymous booking.
  const headers: Record<string, string> = {
    "X-API-Key": TENANT_API_KEY,
  };
  // Sent whenever there is one, including on the public routes: a signed-in
  // customer booking a wash is still that customer, and dropping their
  // identity here would file their booking under a fresh guest record.
  if (token) headers.Authorization = `Bearer ${token}`;
  const init: RequestInit = { method: req.method, headers, cache: "no-store" };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const buf = await req.arrayBuffer();
    if (buf.byteLength) {
      headers["Content-Type"] = req.headers.get("content-type") ?? "application/json";
      init.body = buf;
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return NextResponse.json(
      { success: false, error: { domain: "GENERAL", code: "UPSTREAM_ERROR", message: "the API is unreachable" } },
      { status: 502 },
    );
  }

  if (upstream.status === 204) return new NextResponse(null, { status: 204 });

  const body = await upstream.arrayBuffer();
  const responseHeaders: Record<string, string> = {
    "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
  };
  // Passed through so a 429 from the backend's limiter still tells the client
  // how long to wait; dropping it would turn a precise answer into a guess.
  const retryAfter = upstream.headers.get("Retry-After");
  if (retryAfter) responseHeaders["Retry-After"] = retryAfter;

  return new NextResponse(body, { status: upstream.status, headers: responseHeaders });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
