import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  API_BASE,
  type SessionUser,
  sessionCookieOptions,
  TENANT_API_KEY,
  TOKEN_COOKIE,
  USER_COOKIE,
} from "@/lib/api/server";
import type { ApiEnvelope, Session } from "@/lib/api/types";

// POST /api/auth/register — proxies the backend signup, then stores the token
// in an httpOnly cookie so client JavaScript never sees it.
//
// A sibling of the login route rather than a shared helper, deliberately: the
// two differ in what they forward, and the thing they have in common — minting
// a session cookie from a backend token — is six lines. Folding them together
// would put a branch inside the one function in this app that decides who a
// visitor is.
//
// `reference` is the part that is not in login. It is the code from a booking
// made WITHOUT an account, and with the phone number it proves those bookings
// belong to whoever is signing up. The backend does that check by calling the
// same lookup the public find-a-booking page uses; nothing is decided here.
export async function POST(req: Request) {
  let body: {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    reference?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { domain: "AUTH", code: "BAD_REQUEST", message: "invalid request body" } },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      // Tenant-scoped like login: the same email may be an account at two
      // businesses, and without the key the backend cannot tell which one is
      // being registered with.
      headers: { "Content-Type": "application/json", "X-API-Key": TENANT_API_KEY },
      body: JSON.stringify({
        name: body.name,
        email: body.email,
        password: body.password,
        phone: body.phone,
        reference: body.reference,
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { domain: "AUTH", code: "UPSTREAM_ERROR", message: "the API is unreachable" } },
      { status: 502 },
    );
  }

  const envelope = (await upstream.json().catch(() => null)) as ApiEnvelope<Session> | null;

  if (!upstream.ok || !envelope?.success || !envelope.data?.token) {
    // Passed through untouched, including the backend's 429 and its
    // Retry-After, and including the 409 that explains a phone number already
    // has bookings under it — that message tells somebody exactly what to do
    // next and must not be replaced with a generic one here.
    const headers: Record<string, string> = {};
    const retryAfter = upstream.headers.get("Retry-After");
    if (retryAfter) headers["Retry-After"] = retryAfter;
    return NextResponse.json(envelope ?? { success: false }, { status: upstream.status || 502, headers });
  }

  const { token, user } = envelope.data;
  const session: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    home_location_id: user.home_location_id,
  };

  const cookieStore = await cookies();
  const options = sessionCookieOptions(req);
  cookieStore.set(TOKEN_COOKIE, token, options);
  cookieStore.set(USER_COOKIE, encodeURIComponent(JSON.stringify(session)), options);

  return NextResponse.json({ success: true, data: { user: session } });
}
