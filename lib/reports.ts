import type { Role } from "@/lib/api/types";
import { REPORTERS, STAFF } from "@/lib/roles";

export type ReportInfo = {
  slug: string;
  title: string;
  description: string;
  roles: readonly Role[];
  // Optional date query parameters the report accepts, as "YYYY-MM-DD".
  params: readonly string[];
};

// Mirrors Controllers/ReportsController.cs: managers and auditors read every report,
// tellers only the cash book.
export const REPORTS: readonly ReportInfo[] = [
  {
    slug: "trial-balance",
    title: "Trial balance",
    description:
      "The debit or credit balance of every ledger account, up to and including a date.",
    roles: REPORTERS,
    params: ["asOf"],
  },
  {
    slug: "balance-sheet",
    title: "Balance sheet",
    description:
      "Assets, liabilities and equity as of a date. Earnings to date are shown as part of equity.",
    roles: REPORTERS,
    params: ["asOf"],
  },
  {
    slug: "income-statement",
    title: "Income statement",
    description: "Income and expenses over a period, and the net profit.",
    roles: REPORTERS,
    params: ["from", "to"],
  },
  {
    slug: "cash-book",
    title: "Cash book",
    description:
      "Every cash receipt and payment on one day, with the opening and closing balance.",
    roles: STAFF,
    params: ["date"],
  },
  {
    slug: "loan-aging",
    title: "Loan aging",
    description:
      "Active loans grouped by how late they are, with portfolio at risk.",
    roles: REPORTERS,
    params: [],
  },
  {
    slug: "reconciliation",
    title: "Reconciliation",
    description:
      "Checks that member savings, loans and the ledger agree with each other.",
    roles: REPORTERS,
    params: [],
  },
];

export function reportBySlug(slug: string): ReportInfo | undefined {
  return REPORTS.find((report) => report.slug === slug);
}
