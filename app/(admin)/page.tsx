import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BanknoteIcon, BookOpenIcon, UsersIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listLoans } from "@/lib/api/loans";
import { listMembers } from "@/lib/api/members";
import { requireUser } from "@/lib/auth";
import { MANAGERS, hasRole } from "@/lib/roles";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Village Bank at a glance." />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

async function DashboardContent() {
  const user = await requireUser();
  // SuperAdmin only manages users; the backend rejects it on member endpoints.
  if (user.role === "SuperAdmin") redirect("/users");

  // pageSize=1 keeps the payloads tiny: only the `total` of each is needed.
  const [members, activeLoans, pendingLoans] = await Promise.all([
    listMembers({ pageSize: 1 }),
    listLoans({ status: "Active", pageSize: 1 }),
    listLoans({ status: "Pending", pageSize: 1 }),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardDescription>Members</CardDescription>
          <CardTitle className="text-3xl tabular-nums">{members.total}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/members">
              <UsersIcon />
              View members
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Active loans</CardDescription>
          <CardTitle className="text-3xl tabular-nums">
            {activeLoans.total}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/loans?status=Active">
              <BanknoteIcon />
              View active loans
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Waiting for approval</CardDescription>
          <CardTitle className="text-3xl tabular-nums">
            {pendingLoans.total}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/loans?status=Pending">View pending loans</Link>
          </Button>
        </CardContent>
      </Card>

      {hasRole(user.role, MANAGERS) && (
        <Card>
          <CardHeader>
            <CardTitle>Journal</CardTitle>
            <CardDescription>
              Post a manual double-entry journal entry.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/journal-entries/new">
                <BookOpenIcon />
                New journal entry
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-36 w-full" />
    </div>
  );
}
