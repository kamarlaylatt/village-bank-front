import "server-only";

import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import type { Role } from "@/lib/api/types";
import { hasRole } from "@/lib/roles";
import { getSession, type Session } from "@/lib/session";

// Role groups live in lib/roles.ts so client components (the sidebar) can use
// them too; they are re-exported here for server code.
export * from "@/lib/roles";

// Check close to the data, not in layouts (Next.js authentication guide).
// Call inside a <Suspense> boundary: it reads cookies at request time.
export async function requireUser(
  options: { allowMustChangePassword?: boolean } = {},
): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustChangePassword && !options.allowMustChangePassword) {
    redirect("/change-password");
  }
  return session;
}

// For Server Actions, which are public endpoints: re-check session and role on
// every call. A wrong role throws ApiError(403) so the action's catch block can
// hand it to toActionError(); redirects are rethrown there untouched.
export async function requireActionRole(
  allowed: readonly Role[],
): Promise<Session> {
  const session = await requireUser();
  if (!hasRole(session.role, allowed)) {
    throw new ApiError(403, "Forbidden", "You do not have permission to do that.");
  }
  return session;
}
