import { Suspense } from "react";
import type { Metadata } from "next";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { ReportBackLink } from "@/components/report-back-link";
import { ReportCsvButton } from "@/components/report-csv-button";
import { ReportToolbar } from "@/components/report-toolbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableRow,
} from "@/components/ui/table";
import { getBalanceSheet } from "@/lib/api/reports";
import type { BalanceSheetLine } from "@/lib/api/types";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { parseDateParam } from "@/lib/report-params";
import { REPORTERS, hasRole, homePathFor } from "@/lib/roles";

export const metadata: Metadata = { title: "Balance sheet" };

type SearchParams = PageProps<"/reports/balance-sheet">["searchParams"];

export default function BalanceSheetPage(props: PageProps<"/reports/balance-sheet">) {
  return (
    <>
      <ReportBackLink />
      <PageHeader
        title="Balance sheet"
        description="Assets, liabilities and equity as of a date. Earnings to date are shown as part of equity."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <BalanceSheetContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

function Section({
  title,
  lines,
  extraRow,
  totalLabel,
  total,
}: {
  title: string;
  lines: BalanceSheetLine[];
  extraRow?: { label: string; amount: number };
  totalLabel: string;
  total: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {lines.length === 0 && !extraRow && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No balances.
                </TableCell>
              </TableRow>
            )}
            {lines.map((line) => (
              <TableRow key={line.code}>
                <TableCell className="w-20 text-muted-foreground">{line.code}</TableCell>
                <TableCell>{line.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(line.amount)}
                </TableCell>
              </TableRow>
            ))}
            {extraRow && (
              <TableRow>
                <TableCell />
                <TableCell>{extraRow.label}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(extraRow.amount)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-medium">
                {totalLabel}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatMoney(total)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

async function BalanceSheetContent({ searchParams }: { searchParams: SearchParams }) {
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
  const report = await getBalanceSheet(parseDateParam(params.asOf));

  return (
    <div className="flex flex-col gap-4">
      <ReportToolbar
        action="/reports/balance-sheet"
        fields={[{ name: "asOf", label: "As of", value: report.asOf }]}
        csv={<ReportCsvButton slug="balance-sheet" params={{ asOf: report.asOf }} />}
      />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge variant={report.isBalanced ? "secondary" : "destructive"}>
          {report.isBalanced ? "Balanced" : "Out of balance"}
        </Badge>
        <span className="text-muted-foreground">
          As of {formatDate(report.asOf)}. Assets {formatMoney(report.totalAssets)} ={" "}
          liabilities {formatMoney(report.totalLiabilities)} + equity{" "}
          {formatMoney(report.totalEquity)}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Assets"
          lines={report.assets}
          totalLabel="Total assets"
          total={report.totalAssets}
        />
        <div className="flex flex-col gap-4">
          <Section
            title="Liabilities"
            lines={report.liabilities}
            totalLabel="Total liabilities"
            total={report.totalLiabilities}
          />
          <Section
            title="Equity"
            lines={report.equity}
            extraRow={{ label: "Earnings to date", amount: report.earningsToDate }}
            totalLabel="Total equity"
            total={report.totalEquity}
          />
        </div>
      </div>
    </div>
  );
}
