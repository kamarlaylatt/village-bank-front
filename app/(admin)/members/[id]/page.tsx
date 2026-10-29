import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PlusIcon } from "lucide-react";
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
import { listLoans } from "@/lib/api/loans";
import { getMember } from "@/lib/api/members";
import { getStatement } from "@/lib/api/savings";
import { requireUser } from "@/lib/auth";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatWhole,
} from "@/lib/format";
import { OPERATORS, STAFF, hasRole, homePathFor } from "@/lib/roles";
import { MoneyDialog } from "./money-dialog";

export const metadata: Metadata = { title: "Member" };

export default function MemberPage(props: PageProps<"/members/[id]">) {
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link href="/members">
          <ArrowLeftIcon />
          Members
        </Link>
      </Button>
      <Suspense fallback={<MemberSkeleton />}>
        <MemberContent params={props.params} />
      </Suspense>
    </>
  );
}

async function MemberContent({
  params,
}: {
  params: PageProps<"/members/[id]">["params"];
}) {
  const user = await requireUser();
  if (!hasRole(user.role, STAFF)) {
    return <NoAccess homeHref={homePathFor(user.role)} />;
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  let member;
  try {
    member = await getMember(id);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  const [statement, loans] = await Promise.all([
    getStatement(member.savingsAccountId, 50),
    listLoans({ memberId: id, pageSize: 5 }),
  ]);
  const canOperate = hasRole(user.role, OPERATORS);

  return (
    <>
      <PageHeader title={member.fullName} description={`Member #${member.id}`}>
        <Badge variant={member.isActive ? "secondary" : "outline"}>
          {member.isActive ? "Active" : "Inactive"}
        </Badge>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{member.phone ?? "—"}</dd>
              <dt className="text-muted-foreground">Village</dt>
              <dd>{member.village ?? "—"}</dd>
              <dt className="text-muted-foreground">Joined</dt>
              <dd>{formatDate(member.joinedOn)}</dd>
              <dt className="text-muted-foreground">Savings account</dt>
              <dd>#{member.savingsAccountId}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Savings balance</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatMoney(member.savingsBalance)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            {canOperate ? (
              <>
                <MoneyDialog kind="deposit" accountId={member.savingsAccountId} />
                <MoneyDialog kind="withdraw" accountId={member.savingsAccountId} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your role can view this account but not post transactions.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loans</CardTitle>
          <CardDescription>
            {loans.total === 0
              ? "No loans yet."
              : `${loans.total} loan${loans.total === 1 ? "" : "s"}, newest first.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {canOperate && member.isActive && (
            <Button asChild size="sm" className="self-start">
              <Link href={`/loans/new?memberId=${member.id}`}>
                <PlusIcon />
                Apply for a loan
              </Link>
            </Button>
          )}
          {loans.items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan</TableHead>
                  <TableHead className="text-right">Principal (kip)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.items.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">
                      <Link href={`/loans/${loan.id}`} className="hover:underline">
                        #{loan.id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatWhole(loan.principal)}
                    </TableCell>
                    <TableCell>
                      <LoanStatusBadge status={loan.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(loan.appliedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/loans/${loan.id}`}>Detail</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {loans.total > loans.items.length && (
            <Link
              href={`/loans?memberId=${member.id}`}
              className="text-sm underline"
            >
              View all {loans.total} loans
            </Link>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statement</CardTitle>
          <CardDescription>Most recent 50 transactions, newest first.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance after</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statement.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                statement.map((line) => (
                  <TableRow key={line.transactionId}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(line.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={line.type === "Deposit" ? "secondary" : "outline"}
                      >
                        {line.type}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={
                        line.type === "Withdrawal"
                          ? "text-right tabular-nums text-destructive"
                          : "text-right tabular-nums"
                      }
                    >
                      {line.type === "Withdrawal" ? "−" : "+"}
                      {formatMoney(line.amount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(line.balanceAfter)}
                    </TableCell>
                    <TableCell className="max-w-64 truncate text-muted-foreground">
                      {line.note ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function MemberSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
