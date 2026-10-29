import { Suspense } from "react";
import type { Metadata } from "next";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listUsers } from "@/lib/api/users";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { SUPER_ADMIN, hasRole, homePathFor } from "@/lib/roles";
import { CreateUserDialog } from "./create-user-dialog";
import { UserActions } from "./user-actions";

export const metadata: Metadata = { title: "Users" };

export default function UsersPage() {
  return (
    <>
      <PageHeader title="Users" description="Staff accounts and their roles.">
        <Suspense>
          <NewUserButton />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <UsersContent />
      </Suspense>
    </>
  );
}

async function NewUserButton() {
  const user = await requireUser();
  return hasRole(user.role, SUPER_ADMIN) ? <CreateUserDialog /> : null;
}

async function UsersContent() {
  const user = await requireUser();
  if (!hasRole(user.role, SUPER_ADMIN)) {
    return <NoAccess homeHref={homePathFor(user.role)} />;
  }

  const users = await listUsers();

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last sign-in</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.username}</TableCell>
              <TableCell>
                <Badge variant={row.role === "SuperAdmin" ? "default" : "secondary"}>
                  {row.role}
                </Badge>
              </TableCell>
              <TableCell className="flex items-center gap-1.5">
                <Badge variant={row.isActive ? "secondary" : "outline"}>
                  {row.isActive ? "Active" : "Inactive"}
                </Badge>
                {row.mustChangePassword && (
                  <Badge variant="outline">Must change password</Badge>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateTime(row.createdAt)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {row.lastLoginAt ? formatDateTime(row.lastLoginAt) : "Never"}
              </TableCell>
              <TableCell className="text-right">
                <UserActions user={row} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
