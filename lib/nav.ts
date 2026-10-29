import {
  BanknoteIcon,
  BookOpenIcon,
  ChartColumnIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  UsersIcon,
  UserRoundIcon,
  type LucideIcon,
} from "lucide-react";
import { ALL_ROLES, MANAGERS, STAFF, SUPER_ADMIN } from "@/lib/roles";
import type { Role } from "@/lib/api/types";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: readonly Role[];
};

// Navigation depends on role because the backend does: SuperAdmin only gets
// user management, staff get members/savings, Manager also posts journal entries.
export const NAV_ITEMS: readonly NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboardIcon, roles: STAFF },
  { title: "Members", href: "/members", icon: UserRoundIcon, roles: STAFF },
  { title: "Loans", href: "/loans", icon: BanknoteIcon, roles: STAFF },
  // Every staff role: tellers get the cash book only, the hub page filters by role.
  { title: "Reports", href: "/reports", icon: ChartColumnIcon, roles: STAFF },
  {
    title: "New journal entry",
    href: "/journal-entries/new",
    icon: BookOpenIcon,
    roles: MANAGERS,
  },
  { title: "Users", href: "/users", icon: UsersIcon, roles: SUPER_ADMIN },
  {
    title: "Change password",
    href: "/account/password",
    icon: KeyRoundIcon,
    roles: ALL_ROLES,
  },
];
