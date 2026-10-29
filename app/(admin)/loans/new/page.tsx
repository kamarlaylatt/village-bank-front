import { Suspense } from "react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, InfoIcon, SearchIcon } from "lucide-react";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { getMember, listMembers } from "@/lib/api/members";
import { requireUser } from "@/lib/auth";
import { OPERATORS, hasRole, homePathFor } from "@/lib/roles";
import { LoanApplicationForm } from "./loan-application-form";

export const metadata: Metadata = { title: "New loan" };

type SearchParams = PageProps<"/loans/new">["searchParams"];

export default function NewLoanPage(props: PageProps<"/loans/new">) {
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link href="/loans">
          <ArrowLeftIcon />
          Loans
        </Link>
      </Button>
      <PageHeader
        title="New loan application"
        description="An application starts as Pending and needs a manager's approval before it can be disbursed."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full max-w-3xl" />}>
        <NewLoanContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

async function NewLoanContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  if (!hasRole(user.role, OPERATORS)) {
    return (
      <NoAccess
        homeHref={homePathFor(user.role)}
        message="Only tellers and managers can apply for loans."
      />
    );
  }

  const params = await searchParams;
  const memberId = Number.parseInt(first(params.memberId), 10);

  // Step 1: choose a member.
  if (!Number.isInteger(memberId) || memberId <= 0) {
    return <MemberPicker search={first(params.search).trim()} />;
  }

  // Step 2: terms for that member.
  let member;
  try {
    member = await getMember(memberId);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  // One loan in progress per member (anything not Rejected or Closed). The list is
  // newest first, so an in-progress loan, if any, is the first row.
  const loans = await listLoans({ memberId, pageSize: 5 });
  const inProgress = loans.items.find(
    (loan) => loan.status !== "Rejected" && loan.status !== "Closed",
  );
  const blocked = !member.isActive || inProgress !== undefined;

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">{member.fullName}</p>
            <p className="text-sm text-muted-foreground">
              Member #{member.id}
              {member.village ? ` · ${member.village}` : ""}
              {member.phone ? ` · ${member.phone}` : ""}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/loans/new">Choose another member</Link>
          </Button>
        </CardContent>
      </Card>

      {!member.isActive && (
        <Alert variant="destructive">
          <InfoIcon />
          <AlertDescription>
            This member is not active, so a loan cannot be applied for.
          </AlertDescription>
        </Alert>
      )}
      {inProgress && (
        <Alert variant="destructive">
          <InfoIcon />
          <AlertDescription>
            This member already has a loan in progress (
            <Link href={`/loans/${inProgress.id}`} className="underline">
              loan #{inProgress.id}, {inProgress.status}
            </Link>
            ). A member can have only one loan that is not rejected or closed.
          </AlertDescription>
        </Alert>
      )}

      <LoanApplicationForm memberId={member.id} disabled={blocked} />
    </div>
  );
}

async function MemberPicker({ search }: { search: string }) {
  const result = await listMembers({ search, pageSize: 10 });

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Form action="/loans/new" className="flex max-w-md gap-2">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Find the member by name or phone"
          aria-label="Search members"
        />
        <Button type="submit" variant="outline">
          <SearchIcon />
          Search
        </Button>
      </Form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Village</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  {search ? "No members match your search." : "No members yet."}
                </TableCell>
              </TableRow>
            ) : (
              result.items.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.fullName}</TableCell>
                  <TableCell>{member.village ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? "secondary" : "outline"}>
                      {member.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {member.isActive ? (
                      <Button asChild size="sm">
                        <Link href={`/loans/new?memberId=${member.id}`}>Select</Link>
                      </Button>
                    ) : (
                      <Button size="sm" disabled>
                        Select
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {result.total > result.items.length && (
        <p className="text-sm text-muted-foreground">
          Showing the first {result.items.length} of {result.total} matches.
          Narrow the search to find the member.
        </p>
      )}
    </div>
  );
}
