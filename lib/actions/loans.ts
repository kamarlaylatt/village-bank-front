"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  formString,
  toActionError,
  zodFieldErrors,
  type ActionState,
} from "@/lib/action-state";
import type { FieldErrors } from "@/lib/api/errors";
import {
  applyLoan,
  approveLoan,
  disburseLoan,
  previewLoan,
  rejectLoan,
  repayLoan,
} from "@/lib/api/loans";
import type { LoanPreview } from "@/lib/api/types";
import { requireActionRole } from "@/lib/auth";
import { formatKip } from "@/lib/format";
import { parseUnits, unitsToNumber } from "@/lib/money";
import { MANAGERS, OPERATORS, STAFF } from "@/lib/roles";

// Limits mirror Domain/LoanScheduleCalculator.cs (LoanRules) and
// Services/LoanService.cs. Kip has no decimals, so loan amounts are whole numbers.
const MAX_PRINCIPAL = 1_000_000_000;
const MAX_MONTHLY_RATE_UNITS = BigInt(10) * BigInt(10000); // 10 percent, 4 decimals
const MAX_TERM_MONTHS = 60;
const MAX_REPAYMENT = 1_000_000_000_000;

const idSchema = z.coerce.number().int().positive();

// "1,500,000" -> 1500000. Null for anything that is not a plain whole number.
function wholeNumber(text: string): number | null {
  const cleaned = text.trim().replace(/,/g, "");
  return /^\d{1,15}$/.test(cleaned) ? Number(cleaned) : null;
}

type TermValues = { principal: string; rate: string; term: string };

function readTerms(values: TermValues):
  | {
      terms: {
        principal: number;
        monthlyInterestRatePercent: number;
        termMonths: number;
      };
    }
  | { fieldErrors: FieldErrors } {
  const fieldErrors: FieldErrors = {};

  const principal = wholeNumber(values.principal);
  if (principal === null || principal < 1 || principal > MAX_PRINCIPAL) {
    fieldErrors.principal = [
      `Enter a whole number of kip between 1 and ${MAX_PRINCIPAL.toLocaleString("en-US")}.`,
    ];
  }

  // parseUnits returns null for blank input and for more than 4 decimals.
  const rateUnits = parseUnits(values.rate);
  if (rateUnits === null || rateUnits > MAX_MONTHLY_RATE_UNITS) {
    fieldErrors.rate = [
      "Enter a monthly rate between 0 and 10 percent with at most 4 decimal places.",
    ];
  }

  const term = wholeNumber(values.term);
  if (term === null || term < 1 || term > MAX_TERM_MONTHS) {
    fieldErrors.term = [
      `Enter a whole number of months between 1 and ${MAX_TERM_MONTHS}.`,
    ];
  }

  if (
    principal === null ||
    rateUnits === null ||
    term === null ||
    Object.keys(fieldErrors).length > 0
  ) {
    return { fieldErrors };
  }
  return {
    terms: {
      principal,
      monthlyInterestRatePercent: unitsToNumber(rateUnits),
      termMonths: term,
    },
  };
}

function termValues(formData: FormData): TermValues {
  return {
    principal: formString(formData, "principal"),
    rate: formString(formData, "rate"),
    term: formString(formData, "term"),
  };
}

export type LoanPreviewState = ActionState & { preview?: LoanPreview };

export async function previewLoanAction(
  _prev: LoanPreviewState,
  formData: FormData,
): Promise<LoanPreviewState> {
  const values = termValues(formData);
  const read = readTerms(values);
  if ("fieldErrors" in read) {
    return { ok: false, fieldErrors: read.fieldErrors, values };
  }

  try {
    await requireActionRole(STAFF);
    const preview = await previewLoan(read.terms);
    return { ok: true, preview, values };
  } catch (error) {
    return toActionError(error, values);
  }
}

export async function applyLoanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const purpose = formString(formData, "purpose").trim();
  const values = { ...termValues(formData), purpose };

  const memberId = idSchema.safeParse(formData.get("memberId"));
  if (!memberId.success) {
    return { ok: false, message: "Choose a member first.", values };
  }

  const read = readTerms(values);
  const fieldErrors: FieldErrors = "fieldErrors" in read ? { ...read.fieldErrors } : {};
  // Checked here because the backend answers 400 only after other lookups.
  if (purpose.length > 200) {
    fieldErrors.purpose = ["Purpose can be at most 200 characters."];
  }
  if ("fieldErrors" in read || Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, values };
  }

  let loanId: number;
  try {
    await requireActionRole(OPERATORS);
    const loan = await applyLoan({
      memberId: memberId.data,
      ...read.terms,
      purpose: purpose || null,
    });
    loanId = loan.id;
  } catch (error) {
    return toActionError(error, values);
  }

  // redirect() throws, so it stays outside the try/catch.
  redirect(`/loans/${loanId}`);
}

export async function approveLoanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const loanId = idSchema.safeParse(formData.get("loanId"));
  if (!loanId.success) {
    return { ok: false, message: "The request was not valid. Reload and try again." };
  }

  try {
    await requireActionRole(MANAGERS);
    await approveLoan(loanId.data);
    refresh();
    return {
      ok: true,
      variant: "success",
      message: "Loan approved. It can now be disbursed.",
    };
  } catch (error) {
    // Includes the maker-checker 400: "A loan cannot be approved by the person who applied for it."
    return toActionError(error);
  }
}

const rejectSchema = z.object({
  loanId: idSchema,
  reason: z
    .string()
    .trim()
    .min(1, "A reason is required to reject a loan.")
    .max(500, "Reason can be at most 500 characters."),
});

export async function rejectLoanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = { reason: formString(formData, "reason") };
  const parsed = rejectSchema.safeParse({
    loanId: formData.get("loanId"),
    reason: values.reason,
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error), values };
  }

  try {
    await requireActionRole(MANAGERS);
    await rejectLoan(parsed.data.loanId, { reason: parsed.data.reason });
    refresh();
    return { ok: true, variant: "success", message: "Loan rejected." };
  } catch (error) {
    return toActionError(error, values);
  }
}

export async function disburseLoanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const loanId = idSchema.safeParse(formData.get("loanId"));
  if (!loanId.success) {
    return { ok: false, message: "The request was not valid. Reload and try again." };
  }

  try {
    await requireActionRole(OPERATORS);
    await disburseLoan(loanId.data);
    refresh();
    return {
      ok: true,
      variant: "success",
      message:
        "Loan disbursed to the member's savings account. The repayment schedule has been created.",
    };
  } catch (error) {
    return toActionError(error);
  }
}

const repaySchema = z.object({
  loanId: idSchema,
  idempotencyKey: z.string().trim().min(1).max(100),
  // The backend checks this only in the database, which answers 500 instead of 400.
  note: z.string().trim().max(500, "Note can be at most 500 characters."),
});

export async function repayLoanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = {
    amount: formString(formData, "amount"),
    note: formString(formData, "note"),
  };
  const parsed = repaySchema.safeParse({
    loanId: formData.get("loanId"),
    idempotencyKey: formString(formData, "idempotencyKey"),
    note: values.note,
  });

  const fieldErrors: FieldErrors = parsed.success ? {} : zodFieldErrors(parsed.error);
  const amount = wholeNumber(values.amount);
  if (amount === null || amount < 1) {
    fieldErrors.amount = ["Enter a whole number of kip greater than zero."];
  } else if (amount > MAX_REPAYMENT) {
    fieldErrors.amount = ["Amount is too large."];
  }
  if (!parsed.success || amount === null || Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, values };
  }

  try {
    await requireActionRole(OPERATORS);
    const result = await repayLoan(
      parsed.data.loanId,
      { amount, note: parsed.data.note || null },
      parsed.data.idempotencyKey,
    );
    refresh();

    if (result.replayed) {
      return {
        ok: true,
        variant: "info",
        message: "This repayment was already recorded, so nothing new was posted.",
      };
    }
    return {
      ok: true,
      variant: "success",
      message:
        result.loanStatus === "Closed"
          ? "Repayment recorded. The loan is fully repaid and closed."
          : `Repayment recorded. Outstanding: ${formatKip(result.outstanding)}.`,
    };
  } catch (error) {
    return toActionError(error, values);
  }
}
