import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

// Landing point when the backend answers 401 during a render (expired token,
// deactivated account, changed role). Clears the cookie, then back to login.
// Nothing links here, so <Link> prefetching can never trigger it. The user menu
// signs out through logoutAction instead.
export async function GET(request: Request) {
  await deleteSession();
  return NextResponse.redirect(new URL("/login?expired=1", request.url));
}
