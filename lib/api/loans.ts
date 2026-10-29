import "server-only";

import { apiFetch } from "./client";
import type {
  ApplyLoanRequest,
  LoanDetails,
  LoanPreview,
  LoanPreviewRequest,
  LoanStatus,
  LoanSummary,
  PagedResult,
  RejectLoanRequest,
  RepaymentResult,
  RepayLoanRequest,
} from "./types";

// Read-only schedule calculation (a POST in the backend). Any staff role,
// including Auditor.
export function previewLoan(body: LoanPreviewRequest) {
  return apiFetch<LoanPreview>("/api/loans/preview", { method: "POST", body });
}

// Teller or Manager. The loan starts as Pending.
export function applyLoan(body: ApplyLoanRequest) {
  return apiFetch<LoanDetails>("/api/loans", { method: "POST", body });
}

// Backend clamps pageSize to 1-100, newest first.
export function listLoans(params: {
  memberId?: number;
  status?: LoanStatus;
  page?: number;
  pageSize?: number;
}) {
  return apiFetch<PagedResult<LoanSummary>>("/api/loans", { query: params });
}

export function getLoan(id: number) {
  return apiFetch<LoanDetails>(`/api/loans/${id}`);
}

// Manager only, and not the person who applied (maker-checker, answered with 400).
export function approveLoan(id: number) {
  return apiFetch<LoanDetails>(`/api/loans/${id}/approve`, { method: "POST" });
}

// Manager only. A reason is required.
export function rejectLoan(id: number, body: RejectLoanRequest) {
  return apiFetch<LoanDetails>(`/api/loans/${id}/reject`, {
    method: "POST",
    body,
  });
}

// Teller or Manager, for Approved loans. Creates the repayment schedule.
export function disburseLoan(id: number) {
  return apiFetch<LoanDetails>(`/api/loans/${id}/disburse`, { method: "POST" });
}

// Teller or Manager, for Active loans. Re-sending the same Idempotency-Key
// replays the original result (`replayed: true`) instead of posting twice.
export function repayLoan(
  id: number,
  body: RepayLoanRequest,
  idempotencyKey?: string,
) {
  return apiFetch<RepaymentResult>(`/api/loans/${id}/repayments`, {
    method: "POST",
    body,
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
  });
}
