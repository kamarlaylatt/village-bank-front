import "server-only";

import { apiFetch, apiFetchRaw } from "./client";
import type {
  BalanceSheetReport,
  CashBookReport,
  IncomeStatementReport,
  LoanAgingReport,
  ReconciliationReport,
  TrialBalanceReport,
} from "./types";

// Every date is optional: the backend defaults to today in Asia/Vientiane, and to the
// first of the month for an income statement's `from`.

// Manager and Auditor.
export function getTrialBalance(asOf?: string) {
  return apiFetch<TrialBalanceReport>("/api/reports/trial-balance", {
    query: { asOf },
  });
}

// Manager and Auditor.
export function getBalanceSheet(asOf?: string) {
  return apiFetch<BalanceSheetReport>("/api/reports/balance-sheet", {
    query: { asOf },
  });
}

// Manager and Auditor. The backend answers 400 when `from` is after `to`.
export function getIncomeStatement(range: { from?: string; to?: string }) {
  return apiFetch<IncomeStatementReport>("/api/reports/income-statement", {
    query: range,
  });
}

// Teller, Manager and Auditor.
export function getCashBook(date?: string) {
  return apiFetch<CashBookReport>("/api/reports/cash-book", {
    query: { date },
  });
}

// Manager and Auditor.
export function getLoanAging() {
  return apiFetch<LoanAgingReport>("/api/reports/loan-aging");
}

// Manager and Auditor.
export function getReconciliation() {
  return apiFetch<ReconciliationReport>("/api/reports/reconciliation");
}

// The CSV version of any report, as the raw response so it can be streamed to the browser.
export function fetchReportCsv(slug: string, query: Record<string, string>) {
  return apiFetchRaw(`/api/reports/${slug}`, { ...query, format: "csv" });
}
