import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decodeSession } from "@/lib/session";

// Optimistic, cookie-only gate (no API calls). The real checks happen in the
// backend and in apiFetch(); a 401 there sends the user to /logout.
const PUBLIC_PATHS = new Set(["/login", "/logout"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await decodeSession(cookie);

  if (!session) {
    if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
    const response = NextResponse.redirect(new URL("/login", request.url));
    // Drop a tampered or expired cookie so it is not re-checked on every request.
    if (cookie) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Forced password change: only the change-password page (and logout) is open.
  if (session.mustChangePassword) {
    if (pathname === "/change-password" || pathname === "/logout") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  // Already signed in: skip the login page.
  if (pathname === "/login") {
    const home = session.role === "SuperAdmin" ? "/users" : "/";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

// Server Actions are POSTs to the page route, so they pass through here too.
// The icon files are public: the login page needs them before anyone has a session.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png).*)"],
};
