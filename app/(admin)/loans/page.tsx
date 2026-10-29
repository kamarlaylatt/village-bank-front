import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { LoanStatusBadge } from "@/components/loan-status-badge";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listLoans } from "@/lib/api/loans";
import { LOAN_STATUSES, type LoanStatus } from "@/lib/api/types";
import { requireUser } from "@/lib/auth";
import { formatDate, formatDateTime, formatWhole } from "@/lib/format";
import { OPERATORS, STAFF, hasRole, homePathFor } from "@/lib/roles";

export const metadata: Metadata = { title: "Loans" };

const PAGE_SIZE = 20;

type SearchParams = PageProps<"/loans">["searchParams"];

export default function LoansPage(props: PageProps<"/loans">) {
  return (
    <>
      <PageHeader
        title="Loans"
        description="Applications, approvals, disbursements and repayments."
      >
        <Suspense>
          <NewLoanButton />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<LoansSkeleton />}>
        <LoansContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function NewLoanButton() {
  const user = await requireUser();
  if (!hasRole(user.role, OPERATORS)) return null;
  return (
    <Button asChild>
      <Link href="/loans/new">
        <PlusIcon />
        New loan
      </Link>
    </Button>
  );
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function positiveInt(text: string): number | undefined {
  const value = Number.parseInt(text, 10);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function loansHref(filter: {
  status?: LoanStatus;
  memberId?: number;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (filter.status) params.set("status", filter.status);
  if (filter.memberId) params.set("memberId", String(filter.memberId));
  if (filter.page && filter.page > 1) params.set("page", String(filter.page));
  const query = params.toString();
  return query ? `/loans?${query}` : "/loans";
}

async function LoansContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  if (!hasRole(user.role, STAFF)) {
    return <NoAccess homeHref={homePathFor(user.role)} />;
  }

  const params = await searchParams;
  const status = LOAN_STATUSES.find((s) => s === first(params.status));
  const memberId = positiveInt(first(params.memberId));
  const page = positiveInt(first(params.page)) ?? 1;

  const result = await listLoans({ status, memberId, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = (result.page - 1) * result.pageSize + result.items.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant={status ? "outline" : "secondary"}>
          <Link href={loansHref({ memberId })}>All</Link>
        </Button>
        {LOAN_STATUSES.map((s) => (
          <Button
            key={s}
            asChild
            size="sm"
            variant={status === s ? "secondary" : "outline"}
          >
            <Link href={loansHref({ status: s, memberId })}>{s}</Link>
          </Button>
        ))}
      </div>

      {memberId && (
        <p className="text-sm text-muted-foreground">
          Showing loans for member #{memberId}.{" "}
          <Link href={loansHref({ status })} className="underline">
            Clear filter
          </Link>
        </p>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loan</TableHead>
              <TableHead>Member</TableHead>
              <TableHead className="text-right">Principal (kip)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Disbursed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  {status || memberId ? "No loans match this filter." : "No loans yet."}
                </TableCell>
              </TableRow>
            ) : (
              result.items.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">
                    <Link href={`/loans/${loan.id}`} className="hover:underline">
                      #{loan.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/members/${loan.memberId}`}
                      className="hover:underline"
                    >
                      {loan.memberName}
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
                  <TableCell className="whitespace-nowrap">
                    {loan.disbursedOn ? formatDate(loan.disbursedOn) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/loans/${loan.id}`}>Detail</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {result.total === 0
            ? "0 loans"
            : `Showing ${from}–${to} of ${result.total}`}
        </span>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={loansHref({ status, memberId, page: result.page - 1 })}>
                Previous
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          )}
          {result.page < totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={loansHref({ status, memberId, page: result.page + 1 })}>
                Next
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoansSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-full max-w-md" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
