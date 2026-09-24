// Server-only constants for the BFF layer.
//
// Nothing in this file may be imported from a Client Component: BACKEND_URL is
// the address of the Go service and is deliberately not a NEXT_PUBLIC_ value,
// because the browser has no business knowing it. Everything the page needs
// goes through this app's own /api routes.

import "server-only";

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8091";
export const API_BASE = `${BACKEND_URL}/api/v1`;

/**
 * The tenant API key, identifying which business this storefront belongs to.
 *
 * Server-side only, and deliberately NOT a NEXT_PUBLIC_ value. A key in a
 * NEXT_PUBLIC_ variable is inlined into the JavaScript bundle and is then
 * readable by anyone who opens the page — which for this key means reading
 * that business's bookings, staff and day report. The platform's own
 * storefronts publish theirs; that is a known exposure over there and not a
 * pattern to copy.
 *
 * Every call the BFF forwards carries it. Without it the backend cannot tell
 * which business is asking and refuses with 401.
 */
export const TENANT_API_KEY = process.env.TENANT_API_KEY ?? "";

/** httpOnly cookie carrying the backend bearer token. */
export const TOKEN_COOKIE = "cw_token";
/** httpOnly cookie carrying the signed-in profile, for rendering only. */
export const USER_COOKIE = "cw_user";

/**
 * Matches the backend's default TOKEN_EXPIRY_HOURS (12h).
 *
 * Kept a little shorter than the token itself would allow so the cookie
 * expires first: a cookie that outlives its token produces a session that
 * looks signed in and fails every call, which is the more confusing failure.
 */
export const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 12 - 60;

import type { Role } from "./types";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  home_location_id?: string;
}

export function parseSessionUser(raw: string | undefined): SessionUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<SessionUser>;
    if (typeof parsed.id !== "string" || typeof parsed.role !== "string") return null;
    if (parsed.role !== "manager" && parsed.role !== "employee" && parsed.role !== "customer") return null;
    return {
      id: parsed.id,
      email: parsed.email ?? "",
      name: parsed.name ?? parsed.email ?? "",
      role: parsed.role,
      home_location_id: parsed.home_location_id,
    };
  } catch {
    return null;
  }
}

/** Where each role lands after signing in. */
export function homePathFor(role: Role): string {
  switch (role) {
    case "manager":
      return "/manager";
    case "employee":
      return "/employee";
    case "customer":
      return "/book";
  }
}

/** Cookie options shared by every session cookie this app sets. */
export function sessionCookieOptions(req: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // Secure cookies are silently dropped over plain HTTP, so this follows the
    // actual request scheme rather than NODE_ENV — a production build served
    // over HTTP on a test host would otherwise never keep a session.
    secure: req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https://"),
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  };
}
