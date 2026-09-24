import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { TOKEN_COOKIE, USER_COOKIE } from "@/lib/api/server";

// POST /api/auth/logout — clears the session cookies.
//
// There is nothing to tell the backend: the token is stateless and simply
// stops being presented. Revoking server-side would need a deny list, which
// is worth adding the day tokens outlive a shift.
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
  cookieStore.delete(USER_COOKIE);
  return NextResponse.json({ success: true });
}
