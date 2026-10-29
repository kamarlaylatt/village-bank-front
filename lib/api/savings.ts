import "server-only";

import { apiFetch } from "./client";
import type {
  MoneyRequest,
  SavingsAccountSummary,
  SavingsTransactionResult,
  StatementLine,
} from "./types";

export function getSavingsAccount(id: number) {
  return apiFetch<SavingsAccountSummary>(`/api/savings-accounts/${id}`);
}

// Newest first. Backend clamps `take` to 1-200 and has no paging cursor.
export function getStatement(id: number, take = 50) {
  return apiFetch<StatementLine[]>(`/api/savings-accounts/${id}/statement`, {
    query: { take },
  });
}

// Teller or Manager. Re-sending the same Idempotency-Key replays the original
// result (`replayed: true`) instead of posting a second transaction.
export function deposit(
  id: number,
  body: MoneyRequest,
  idempotencyKey?: string,
) {
  return apiFetch<SavingsTransactionResult>(
    `/api/savings-accounts/${id}/deposits`,
    {
      method: "POST",
      body,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
    },
  );
}

export function withdraw(
  id: number,
  body: MoneyRequest,
  idempotencyKey?: string,
) {
  return apiFetch<SavingsTransactionResult>(
    `/api/savings-accounts/${id}/withdrawals`,
    {
      method: "POST",
      body,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
    },
  );
}
