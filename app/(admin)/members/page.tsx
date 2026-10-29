import { Suspense } from "react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { listMembers } from "@/lib/api/members";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { OPERATORS, STAFF, hasRole, homePathFor } from "@/lib/roles";
import { CreateMemberDialog } from "./create-member-dialog";

export const metadata: Metadata = { title: "Members" };

const PAGE_SIZE = 20;

type SearchParams = PageProps<"/members">["searchParams"];

export default function MembersPage(props: PageProps<"/members">) {
  return (
    <>
      <PageHeader
        title="Members"
        description="Search members and open their savings accounts."
      >
        <Suspense>
          <NewMemberButton />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<MembersSkeleton />}>
        <MembersContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function NewMemberButton() {
  const user = await requireUser();
  return hasRole(user.role, OPERATORS) ? <CreateMemberDialog /> : null;
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function pageHref(search: string, page: number): string {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/members?${query}` : "/members";
}

async function MembersContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  if (!hasRole(user.role, STAFF)) {
    return <NoAccess homeHref={homePathFor(user.role)} />;
  }

  const params = await searchParams;
  const search = first(params.search).trim();
  const page = Math.max(1, Number.parseInt(first(params.page), 10) || 1);

  const result = await listMembers({ search, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = (result.page - 1) * result.pageSize + result.items.length;

  return (
    <div className="flex flex-col gap-4">
      <Form action="/members" className="flex max-w-md gap-2">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Search by name or phone"
          aria-label="Search members"
        />
        <Button type="submit" variant="outline">
          <SearchIcon />
          Search
        </Button>
        {search && (
          <Button asChild variant="ghost">
            <Link href="/members">Clear</Link>
          </Button>
        )}
      </Form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Village</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Savings balance</TableHead>
              <TableHead>Status</TableHead>
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
                  {search ? "No members match your search." : "No members yet."}
                </TableCell>
              </TableRow>
            ) : (
              result.items.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/members/${member.id}`}
                      className="hover:underline"
                    >
                      {member.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>{member.phone ?? "—"}</TableCell>
                  <TableCell>{member.village ?? "—"}</TableCell>
                  <TableCell>{formatDate(member.joinedOn)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(member.savingsBalance)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? "secondary" : "outline"}>
                      {member.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/members/${member.id}`}>Detail</Link>
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
            ? "0 members"
            : `Showing ${from}–${to} of ${result.total}`}
        </span>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(search, result.page - 1)}>Previous</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          )}
          {result.page < totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(search, result.page + 1)}>Next</Link>
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

function MembersSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-9 w-full max-w-md" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
