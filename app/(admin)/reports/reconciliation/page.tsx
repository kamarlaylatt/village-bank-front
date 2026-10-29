import { Suspense } from "react";
import type { Metadata } from "next";
import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { ReportBackLink } from "@/components/report-back-link";
import { ReportCsvButton } from "@/components/report-csv-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { getReconciliation } from "@/lib/api/reports";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/format";
import { REPORTERS, hasRole, homePathFor } from "@/lib/roles";

export const metadata: Metadata = { title: "Reconciliation" };

export default function ReconciliationPage() {
  return (
    <>
      <ReportBackLink />
      <PageHeader
        title="Reconciliation"
        description="Checks that member savings, loans and the ledger agree with each other."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ReconciliationContent />
      </Suspense>
    </>
  );
}

async function ReconciliationContent() {
  const user = await requireUser();
  if (!hasRole(user.role, REPORTERS)) {
    return (
      <NoAccess
        homeHref={homePathFor(user.role)}
        message="Only managers and auditors can read this report."
      />
    );
  }

  const report = await getReconciliation();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Run at {formatDateTime(report.generatedAt)}
        </p>
        <ReportCsvButton slug="reconciliation" />
      </div>

      {report.allOk ? (
        <Alert>
          <CircleCheckIcon />
          <AlertTitle>All checks passed</AlertTitle>
          <AlertDescription>
            The sub-ledgers and the general ledger agree.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Some checks do not match</AlertTitle>
          <AlertDescription>
            Look at the rows marked Mismatch below before relying on the other reports.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Check</TableHead>
              <TableHead className="text-right">Expected</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Difference</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.checks.map((check) => (
              <TableRow key={check.name}>
                <TableCell>
                  <p className="font-medium">{check.name}</p>
                  <p className="max-w-md whitespace-normal text-xs text-muted-foreground">
                    {check.description}
                  </p>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(check.expected)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(check.actual)}
                </TableCell>
                <TableCell
                  className={
                    check.difference === 0
                      ? "text-right tabular-nums"
                      : "text-right tabular-nums text-destructive"
                  }
                >
                  {formatMoney(check.difference)}
                </TableCell>
                <TableCell>
                  <Badge variant={check.isOk ? "secondary" : "destructive"}>
                    {check.isOk ? "OK" : "Mismatch"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
