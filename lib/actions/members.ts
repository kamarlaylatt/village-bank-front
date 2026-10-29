"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  formString,
  toActionError,
  zodFieldErrors,
  type ActionState,
} from "@/lib/action-state";
import { createMember } from "@/lib/api/members";
import { requireActionRole } from "@/lib/auth";
import { OPERATORS } from "@/lib/roles";

// Limits mirror the column sizes in Data/BankDbContext.cs (members table).
const createMemberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required.")
    .max(200, "Full name can be at most 200 characters."),
  phone: z.string().trim().max(30, "Phone can be at most 30 characters."),
  village: z.string().trim().max(100, "Village can be at most 100 characters."),
});

export async function createMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = {
    fullName: formString(formData, "fullName"),
    phone: formString(formData, "phone"),
    village: formString(formData, "village"),
  };
  const parsed = createMemberSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error), values };
  }

  let memberId: number;
  try {
    await requireActionRole(OPERATORS);
    const member = await createMember({
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      village: parsed.data.village || null,
    });
    memberId = member.id;
  } catch (error) {
    return toActionError(error, values);
  }

  // redirect() throws, so it stays outside the try/catch.
  redirect(`/members/${memberId}`);
}
