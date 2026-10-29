import { Suspense } from "react";
import type { Metadata } from "next";
import { CircleAlertIcon } from "lucide-react";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { ReportBackLink } from "@/components/report-back-link";
import { ReportCsvButton } from "@/components/report-csv-button";
import { ReportToolbar } from "@/components/report-toolbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableRow,
} from "@/components/ui/table";
import { getIncomeStatement } from "@/lib/api/reports";
import type { IncomeStatementLine } from "@/lib/api/types";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { parseDateParam } from "@/lib/report-params";
import { REPORTERS, hasRole, homePathFor } from "@/lib/roles";

export const metadata: Metadata = { title: "Income statement" };

type SearchParams = PageProps<"/reports/income-statement">["searchParams"];

export default function IncomeStatementPage(
  props: PageProps<"/reports/income-statement">,
) {
  return (
    <>
      <ReportBackLink />
      <PageHeader
        title="Income statement"
        description="Income and expenses over a period, and the net profit."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <IncomeStatementContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

function Section({
  title,
  lines,
  totalLabel,
  total,
}: {
  title: string;
  lines: IncomeStatementLine[];
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
            {lines.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Nothing in this period.
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

async function IncomeStatementContent({ searchParams }: { searchParams: SearchParams }) {
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
  const from = parseDateParam(params.from);
  const to = parseDateParam(params.to);

  // The backend answers 400 for this; catching it here keeps the typed dates on screen.
  if (from && to && from > to) {
    return (
      <div className="flex flex-col gap-4">
        <ReportToolbar
          action="/reports/income-statement"
          fields={[
            { name: "from", label: "From", value: from },
            { name: "to", label: "To", value: to },
          ]}
        />
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>
            &quot;From&quot; must not be after &quot;To&quot;.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const report = await getIncomeStatement({ from, to });

  return (
    <div className="flex flex-col gap-4">
      <ReportToolbar
        action="/reports/income-statement"
        fields={[
          { name: "from", label: "From", value: report.from },
          { name: "to", label: "To", value: report.to },
        ]}
        csv={
          <ReportCsvButton
            slug="income-statement"
            params={{ from: report.from, to: report.to }}
          />
        }
      />

      <p className="text-sm text-muted-foreground">
        {formatDate(report.from)} to {formatDate(report.to)}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Income"
          lines={report.income}
          totalLabel="Total income"
          total={report.totalIncome}
        />
        <Section
          title="Expenses"
          lines={report.expenses}
          totalLabel="Total expenses"
          total={report.totalExpenses}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Net profit</CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={
              report.netProfit < 0
                ? "text-3xl font-semibold tabular-nums text-destructive"
                : "text-3xl font-semibold tabular-nums"
            }
          >
            {formatMoney(report.netProfit)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
