import { Suspense } from "react";
import type { Metadata } from "next";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { ReportBackLink } from "@/components/report-back-link";
import { ReportCsvButton } from "@/components/report-csv-button";
import { ReportToolbar } from "@/components/report-toolbar";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getCashBook } from "@/lib/api/reports";
import { requireUser } from "@/lib/auth";
import { formatAmount, formatDateTime, formatMoney } from "@/lib/format";
import { parseDateParam } from "@/lib/report-params";
import { STAFF, hasRole, homePathFor } from "@/lib/roles";

export const metadata: Metadata = { title: "Cash book" };

type SearchParams = PageProps<"/reports/cash-book">["searchParams"];

export default function CashBookPage(props: PageProps<"/reports/cash-book">) {
  return (
    <>
      <ReportBackLink />
      <PageHeader
        title="Cash book"
        description="Every cash receipt and payment on one day, with the opening and closing balance."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <CashBookContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{formatMoney(value)}</CardTitle>
      </CardHeader>
    </Card>
  );
}

async function CashBookContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  if (!hasRole(user.role, STAFF)) {
    return <NoAccess homeHref={homePathFor(user.role)} />;
  }

  const params = await searchParams;
  const report = await getCashBook(parseDateParam(params.date));

  return (
    <div className="flex flex-col gap-4">
      <ReportToolbar
        action="/reports/cash-book"
        fields={[{ name: "date", label: "Date", value: report.date }]}
        csv={<ReportCsvButton slug="cash-book" params={{ date: report.date }} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Opening balance" value={report.openingBalance} />
        <Stat label="Total receipts" value={report.totalReceipts} />
        <Stat label="Total payments" value={report.totalPayments} />
        <Stat label="Closing balance" value={report.closingBalance} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Entry</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>By</TableHead>
              <TableHead className="text-right">Receipt</TableHead>
              <TableHead className="text-right">Payment</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.lines.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No cash movements on this date.
                </TableCell>
              </TableRow>
            ) : (
              report.lines.map((line) => (
                <TableRow key={`${line.entryId}-${line.createdAt}`}>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(line.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">#{line.entryId}</TableCell>
                  <TableCell>{line.description}</TableCell>
                  <TableCell>{line.createdBy ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAmount(line.receipt)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAmount(line.payment)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(line.balance)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {report.lines.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatMoney(report.totalReceipts)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatMoney(report.totalPayments)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
