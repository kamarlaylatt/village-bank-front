import type { Role } from "@/lib/api/types";

// Client-safe role helpers (no server-only imports), so the sidebar can use
// them. Mirrors village-bank-core/src/VillageBank.Api/Auth/Roles.cs.
// SuperAdmin is deliberately NOT in STAFF: it can only manage users and gets
// 403 from members, savings and journal endpoints.
export const SUPER_ADMIN: readonly Role[] = ["SuperAdmin"];
export const STAFF: readonly Role[] = ["Teller", "Manager", "Auditor"];
export const OPERATORS: readonly Role[] = ["Teller", "Manager"];
export const MANAGERS: readonly Role[] = ["Manager"];
// Roles.Reporters in the backend: every report except the cash book (which is STAFF).
export const REPORTERS: readonly Role[] = ["Manager", "Auditor"];
export const ALL_ROLES: readonly Role[] = [
  "SuperAdmin",
  "Manager",
  "Teller",
  "Auditor",
];

export function hasRole(role: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(role);
}

export function homePathFor(role: Role): string {
  return role === "SuperAdmin" ? "/users" : "/";
}
