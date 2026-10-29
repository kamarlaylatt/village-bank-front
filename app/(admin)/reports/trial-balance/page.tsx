import { Suspense } from "react";
import type { Metadata } from "next";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { ReportBackLink } from "@/components/report-back-link";
import { ReportCsvButton } from "@/components/report-csv-button";
import { ReportToolbar } from "@/components/report-toolbar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTrialBalance } from "@/lib/api/reports";
import { requireUser } from "@/lib/auth";
import { formatAmount, formatDate, formatMoney } from "@/lib/format";
import { parseDateParam } from "@/lib/report-params";
import { REPORTERS, hasRole, homePathFor } from "@/lib/roles";

export const metadata: Metadata = { title: "Trial balance" };

type SearchParams = PageProps<"/reports/trial-balance">["searchParams"];

export default function TrialBalancePage(props: PageProps<"/reports/trial-balance">) {
  return (
    <>
      <ReportBackLink />
      <PageHeader
        title="Trial balance"
        description="The debit or credit balance of every ledger account, up to and including a date."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <TrialBalanceContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function TrialBalanceContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  if (!hasRole(user.role, REPORTERS)) {
    return (
      <NoAccess
        homeHref={homePathFor(user.role)}
        message="Only managers and auditors can read this report."
      />
    );
  }

  const params = await searchParams;
  const report = await getTrialBalance(parseDateParam(params.asOf));

  return (
    <div className="flex flex-col gap-4">
      <ReportToolbar
        action="/reports/trial-balance"
        fields={[{ name: "asOf", label: "As of", value: report.asOf }]}
        csv={<ReportCsvButton slug="trial-balance" params={{ asOf: report.asOf }} />}
      />

      <div className="flex items-center gap-3 text-sm">
        <Badge variant={report.isBalanced ? "secondary" : "destructive"}>
          {report.isBalanced ? "Balanced" : "Out of balance"}
        </Badge>
        <span className="text-muted-foreground">As of {formatDate(report.asOf)}</span>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.lines.map((line) => (
              <TableRow key={line.code}>
                <TableCell className="text-muted-foreground">{line.code}</TableCell>
                <TableCell className="font-medium">{line.name}</TableCell>
                <TableCell>{line.type}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(line.debit)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(line.credit)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="font-medium">
                Total
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatMoney(report.totalDebit)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatMoney(report.totalCredit)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
