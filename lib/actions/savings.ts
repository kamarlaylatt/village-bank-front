"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import {
  formString,
  toActionError,
  zodFieldErrors,
  type ActionState,
} from "@/lib/action-state";
import { deposit, withdraw } from "@/lib/api/savings";
import { requireActionRole } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { parseUnits, unitsToNumber } from "@/lib/money";
import { OPERATORS } from "@/lib/roles";

// Backend rules (Services/SavingsService.cs): amount > 0, at most 1e12, at most
// 4 decimal places; note at most 500 characters (checked only by the database,
// which answers 500 instead of 400, so it is enforced here).
const MAX_UNITS = BigInt("1000000000000") * BigInt(10000);

const moneySchema = z.object({
  accountId: z.coerce.number().int().positive(),
  idempotencyKey: z.string().trim().min(1).max(100),
  note: z.string().trim().max(500, "Note can be at most 500 characters."),
});

async function postMoney(
  kind: "deposit" | "withdraw",
  formData: FormData,
): Promise<ActionState> {
  const values = {
    amount: formString(formData, "amount"),
    note: formString(formData, "note"),
  };
  const parsed = moneySchema.safeParse({
    accountId: formData.get("accountId"),
    idempotencyKey: formString(formData, "idempotencyKey"),
    note: values.note,
  });

  const fieldErrors = parsed.success ? {} : zodFieldErrors(parsed.error);
  const units = parseUnits(values.amount);
  if (units === null) {
    fieldErrors.amount = ["Enter an amount with at most 4 decimal places."];
  } else if (units <= BigInt(0)) {
    fieldErrors.amount = ["Amount must be greater than zero."];
  } else if (units > MAX_UNITS) {
    fieldErrors.amount = ["Amount is too large."];
  }
  if (!parsed.success || units === null || Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, values };
  }

  try {
    await requireActionRole(OPERATORS);
    const send = kind === "deposit" ? deposit : withdraw;
    const result = await send(
      parsed.data.accountId,
      { amount: unitsToNumber(units), note: parsed.data.note || null },
      parsed.data.idempotencyKey,
    );
    refresh();

    if (result.replayed) {
      return {
        ok: true,
        variant: "info",
        message: "This request was already processed, so nothing new was posted.",
      };
    }
    const label = kind === "deposit" ? "Deposit" : "Withdrawal";
    return {
      ok: true,
      variant: "success",
      message: `${label} recorded. New balance: ${formatMoney(result.balanceAfter)}.`,
    };
  } catch (error) {
    return toActionError(error, values);
  }
}

export async function depositAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return postMoney("deposit", formData);
}

export async function withdrawAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return postMoney("withdraw", formData);
}
