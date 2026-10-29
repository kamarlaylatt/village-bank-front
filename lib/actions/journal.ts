"use server";

import { z } from "zod";
import {
  formString,
  toActionError,
  zodFieldErrors,
  type ActionState,
} from "@/lib/action-state";
import { postJournalEntry } from "@/lib/api/journal";
import type { JournalLineInput } from "@/lib/api/types";
import { CHART_OF_ACCOUNTS } from "@/lib/accounts";
import { requireActionRole } from "@/lib/auth";
import { parseUnits, unitsToNumber, unitsToString } from "@/lib/money";
import { MANAGERS } from "@/lib/roles";

// The form sends its whole state as one JSON string so the table of lines can
// stay ordinary controlled React state. Amounts stay as text until parsed here,
// so decimals are checked exactly (no floating point).
const payloadSchema = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date."),
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(500, "Description can be at most 500 characters."),
  lines: z
    .array(z.object({ accountId: z.string(), debit: z.string(), credit: z.string() }))
    .min(2, "A journal entry needs at least 2 lines."),
});

const ZERO = BigInt(0);

function fail(message: string): ActionState {
  return { ok: false, message };
}

export async function postJournalEntryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let raw: unknown;
  try {
    raw = JSON.parse(formString(formData, "payload"));
  } catch {
    return fail("The form data was not valid. Reload the page and try again.");
  }

  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }
  const { entryDate, description, lines } = parsed.data;

  // Reject dates that roll over, e.g. 2026-02-31.
  const date = new Date(`${entryDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== entryDate) {
    return { ok: false, fieldErrors: { entryDate: ["Enter a valid date."] } };
  }

  // Same rules as Domain/JournalEntryValidator.cs.
  let debitTotal = ZERO;
  let creditTotal = ZERO;
  const apiLines: JournalLineInput[] = [];
  for (const [index, line] of lines.entries()) {
    const n = index + 1;
    const accountId = Number(line.accountId);
    if (!CHART_OF_ACCOUNTS.some((account) => account.id === accountId)) {
      return fail(`Line ${n}: choose an account.`);
    }
    const debit = line.debit.trim() === "" ? ZERO : parseUnits(line.debit);
    const credit = line.credit.trim() === "" ? ZERO : parseUnits(line.credit);
    if (debit === null || credit === null) {
      return fail(`Line ${n}: amounts must be positive with at most 4 decimal places.`);
    }
    if (debit > ZERO === credit > ZERO) {
      return fail(`Line ${n}: enter either a debit or a credit, not both and not neither.`);
    }
    debitTotal += debit;
    creditTotal += credit;
    apiLines.push({
      accountId,
      debit: unitsToNumber(debit),
      credit: unitsToNumber(credit),
    });
  }
  if (debitTotal !== creditTotal) {
    return fail(
      `Entry is not balanced: debit ${unitsToString(debitTotal)} != credit ${unitsToString(creditTotal)}.`,
    );
  }

  try {
    await requireActionRole(MANAGERS);
    const result = await postJournalEntry({ entryDate, description, lines: apiLines });
    return {
      ok: true,
      variant: "success",
      message: `Journal entry #${result.id} posted.`,
    };
  } catch (error) {
    return toActionError(error);
  }
}
