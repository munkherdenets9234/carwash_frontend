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

// POST /api/auth/login — proxies the backend login, then stores the token in
// an httpOnly cookie so client JavaScript never sees it.
//
// The response deliberately carries the user but NOT the token: the only
// thing the page needs is who it is signed in as and where to send them.
export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json(
      { success: false, error: { domain: "AUTH", code: "BAD_REQUEST", message: "invalid request body" } },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      // Login is tenant-scoped now: the same email may be an account at two
      // businesses, and without the key the backend cannot tell which one is
      // being signed in to.
      headers: { "Content-Type": "application/json", "X-API-Key": TENANT_API_KEY },
      body: JSON.stringify({ email: body.email, password: body.password }),
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
    // Retry-After, so the form can say "try again in 6 seconds" rather than
    // inventing a message of its own.
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
