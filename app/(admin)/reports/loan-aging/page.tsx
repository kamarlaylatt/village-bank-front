import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { ReportBackLink } from "@/components/report-back-link";
import { ReportCsvButton } from "@/components/report-csv-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLoanAging } from "@/lib/api/reports";
import { requireUser } from "@/lib/auth";
import { formatDate, formatKip, formatMoney, formatWhole } from "@/lib/format";
import { REPORTERS, hasRole, homePathFor } from "@/lib/roles";

export const metadata: Metadata = { title: "Loan aging" };

export default function LoanAgingPage() {
  return (
    <>
      <ReportBackLink />
      <PageHeader
        title="Loan aging"
        description="Active loans grouped by how late they are, with portfolio at risk."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <LoanAgingContent />
      </Suspense>
    </>
  );
}

async function LoanAgingContent() {
  const user = await requireUser();
  if (!hasRole(user.role, REPORTERS)) {
    return (
      <NoAccess
        homeHref={homePathFor(user.role)}
        message="Only managers and auditors can read this report."
      />
    );
  }

  const report = await getLoanAging();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">As of {formatDate(report.asOf)}</p>
        <ReportCsvButton slug="loan-aging" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Active loans</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{report.activeLoans}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Principal outstanding</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatKip(report.totalPrincipalOutstanding)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By days past due</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bucket</TableHead>
                  <TableHead className="text-right">Loans</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.buckets.map((bucket) => (
                  <TableRow key={bucket.label}>
                    <TableCell className="font-medium">{bucket.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{bucket.loans}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatWhole(bucket.principalOutstanding)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatWhole(bucket.overdueAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio at risk</CardTitle>
            <CardDescription>
              Principal of loans more than N days late, as a share of the whole portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Measure</TableHead>
                  <TableHead>Late by</TableHead>
                  <TableHead className="text-right">Principal at risk</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.portfolioAtRisk.map((par) => (
                  <TableRow key={par.name}>
                    <TableCell className="font-medium">{par.name}</TableCell>
                    <TableCell>more than {par.moreThanDaysPastDue} days</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatWhole(par.principalAtRisk)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(par.percent)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overdue loans</CardTitle>
          <CardDescription>Most overdue first. Amounts are in kip.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan</TableHead>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Principal outstanding</TableHead>
                <TableHead className="text-right">Overdue amount</TableHead>
                <TableHead className="text-right">Days past due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.overdueLoans.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No overdue loans.
                  </TableCell>
                </TableRow>
              ) : (
                report.overdueLoans.map((loan) => (
                  <TableRow key={loan.loanId}>
                    <TableCell className="font-medium">
                      <Link href={`/loans/${loan.loanId}`} className="hover:underline">
                        #{loan.loanId}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/members/${loan.memberId}`} className="hover:underline">
                        {loan.memberName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatWhole(loan.principalOutstanding)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-destructive">
                      {formatWhole(loan.overdueAmount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{loan.daysPastDue}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
