import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { LoanStatusBadge } from "@/components/loan-status-badge";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/errors";
import { getLoan } from "@/lib/api/loans";
import { requireUser } from "@/lib/auth";
import {
  formatDate,
  formatDateTime,
  formatKip,
  formatWhole,
  todayInBusinessTime,
} from "@/lib/format";
import { MANAGERS, OPERATORS, STAFF, hasRole, homePathFor } from "@/lib/roles";
import { LoanActions } from "./loan-actions";

export const metadata: Metadata = { title: "Loan" };

export default function LoanPage(props: PageProps<"/loans/[id]">) {
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link href="/loans">
          <ArrowLeftIcon />
          Loans
        </Link>
      </Button>
      <Suspense fallback={<LoanSkeleton />}>
        <LoanContent params={props.params} />
      </Suspense>
    </>
  );
}

async function LoanContent({
  params,
}: {
  params: PageProps<"/loans/[id]">["params"];
}) {
  const user = await requireUser();
  if (!hasRole(user.role, STAFF)) {
    return <NoAccess homeHref={homePathFor(user.role)} />;
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  let loan;
  try {
    loan = await getLoan(id);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  // Read after the session, so the current time is request-time data.
  const today = todayInBusinessTime();

  const canDecide = hasRole(user.role, MANAGERS) && loan.status === "Pending";
  const canDisburse = hasRole(user.role, OPERATORS) && loan.status === "Approved";
  const canRepay = hasRole(user.role, OPERATORS) && loan.status === "Active";

  let waitingNote: string | null = null;
  if (loan.status === "Pending" && !canDecide) {
    waitingNote = "Waiting for a manager to approve or reject this application.";
  } else if (loan.status === "Approved" && !canDisburse) {
    waitingNote = "Approved. A teller or manager can disburse it.";
  }

  return (
    <>
      <PageHeader title={`Loan #${loan.id}`} description={loan.memberName}>
        <LoanStatusBadge status={loan.status} />
        {loan.daysPastDue > 0 && (
          <Badge variant="destructive">Overdue {loan.daysPastDue} days</Badge>
        )}
      </PageHeader>

      {(canDecide || canDisburse || canRepay || waitingNote) && (
        <div className="flex flex-wrap items-center gap-3">
          <LoanActions
            loanId={loan.id}
            canDecide={canDecide}
            canDisburse={canDisburse}
            canRepay={canRepay}
            outstanding={loan.outstanding}
          />
          {waitingNote && (
            <p className="text-sm text-muted-foreground">{waitingNote}</p>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[9rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Member</dt>
              <dd>
                <Link
                  href={`/members/${loan.memberId}`}
                  className="hover:underline"
                >
                  {loan.memberName}
                </Link>
              </dd>
              <dt className="text-muted-foreground">Principal</dt>
              <dd className="tabular-nums">{formatKip(loan.principal)}</dd>
              <dt className="text-muted-foreground">Monthly interest</dt>
              <dd>{loan.monthlyInterestRatePercent}% (flat)</dd>
              <dt className="text-muted-foreground">Term</dt>
              <dd>{loan.termMonths} months</dd>
              <dt className="text-muted-foreground">Purpose</dt>
              <dd>{loan.purpose ?? "—"}</dd>
              <dt className="text-muted-foreground">Applied</dt>
              <dd>{formatDateTime(loan.appliedAt)}</dd>
              <dt className="text-muted-foreground">Applied by</dt>
              <dd>{loan.appliedBy ?? "—"}</dd>
              {loan.decidedAt && (
                <>
                  <dt className="text-muted-foreground">
                    {loan.status === "Rejected" ? "Rejected" : "Approved"}
                  </dt>
                  <dd>{formatDateTime(loan.decidedAt)}</dd>
                  <dt className="text-muted-foreground">
                    {loan.status === "Rejected" ? "Rejected by" : "Approved by"}
                  </dt>
                  <dd>{loan.decidedBy ?? "—"}</dd>
                </>
              )}
              {loan.rejectionReason && (
                <>
                  <dt className="text-muted-foreground">Reason</dt>
                  <dd>{loan.rejectionReason}</dd>
                </>
              )}
              {loan.disbursedOn && (
                <>
                  <dt className="text-muted-foreground">Disbursed</dt>
                  <dd>{formatDate(loan.disbursedOn)}</dd>
                  <dt className="text-muted-foreground">Disbursed by</dt>
                  <dd>{loan.disbursedBy ?? "—"}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Outstanding</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatKip(loan.outstanding)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[9rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Total interest</dt>
              <dd className="tabular-nums">{formatKip(loan.totalInterest)}</dd>
              <dt className="text-muted-foreground">Total repayable</dt>
              <dd className="tabular-nums">
                {formatKip(loan.principal + loan.totalInterest)}
              </dd>
              <dt className="text-muted-foreground">Paid so far</dt>
              <dd className="tabular-nums">{formatKip(loan.totalPaid)}</dd>
              <dt className="text-muted-foreground">Overdue</dt>
              <dd
                className={
                  loan.overdueAmount > 0 ? "tabular-nums text-destructive" : "tabular-nums"
                }
              >
                {loan.overdueAmount > 0
                  ? `${formatKip(loan.overdueAmount)} (${loan.daysPastDue} days)`
                  : "None"}
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Repayment schedule</CardTitle>
          {loan.installments.length === 0 && (
            <CardDescription>
              The schedule is created when the loan is disbursed.
            </CardDescription>
          )}
        </CardHeader>
        {loan.installments.length > 0 && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loan.installments.map((item) => {
                  const paid = item.principalPaid + item.interestPaid;
                  const remaining = item.principalDue + item.interestDue - paid;
                  // "YYYY-MM-DD" strings compare correctly as text.
                  const overdue = !item.isPaid && item.dueDate < today;
                  return (
                    <TableRow key={item.number}>
                      <TableCell>{item.number}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(item.dueDate)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatWhole(item.principalDue)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatWhole(item.interestDue)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatWhole(paid)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatWhole(remaining)}
                      </TableCell>
                      <TableCell>
                        {item.isPaid ? (
                          <Badge variant="secondary">Paid</Badge>
                        ) : overdue ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : (
                          <Badge variant="outline">Upcoming</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </>
  );
}

function LoanSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
