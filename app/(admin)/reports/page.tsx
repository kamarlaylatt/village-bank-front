import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { NoAccess } from "@/components/no-access";
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
import { requireUser } from "@/lib/auth";
import { REPORTS } from "@/lib/reports";
import { STAFF, hasRole, homePathFor } from "@/lib/roles";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Financial and loan reports. Each one can be downloaded as a CSV file."
      />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ReportsContent />
      </Suspense>
    </>
  );
}

async function ReportsContent() {
  const user = await requireUser();
  if (!hasRole(user.role, STAFF)) {
    return <NoAccess homeHref={homePathFor(user.role)} />;
  }

  const available = REPORTS.filter((report) => hasRole(user.role, report.roles));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {available.map((report) => (
          <Card key={report.slug}>
            <CardHeader>
              <CardTitle>{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href={`/reports/${report.slug}`}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {available.length < REPORTS.length && (
        <p className="text-sm text-muted-foreground">
          The other reports are available to managers and auditors.
        </p>
      )}
    </div>
  );
}
