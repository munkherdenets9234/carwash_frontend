import { NextResponse } from "next/server";

import { BACKEND_URL } from "@/lib/api/server";

// GET /api/readyz — passes the backend's readiness through.
//
// Unauthenticated, like the endpoint it mirrors, and useful for two different
// readers: a monitor that wants to know whether this deployment is degraded,
// and the employee screen, which offers its demo clock-in shortcut only when
// the API reports a non-production environment.
export async function GET() {
  try {
    const upstream = await fetch(`${BACKEND_URL}/readyz`, { cache: "no-store" });
    const body = await upstream.json();
    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json({ status: "unreachable", degraded: true, features: [] }, { status: 502 });
  }
}
