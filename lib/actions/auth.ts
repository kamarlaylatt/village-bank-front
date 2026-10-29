"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  toActionError,
  zodFieldErrors,
  type ActionState,
} from "@/lib/action-state";
import { changePassword, login } from "@/lib/api/auth";
import { homePathFor } from "@/lib/auth";
import { createSession, deleteSession, getSession } from "@/lib/session";

// Mirrors Auth/PasswordPolicy.cs: 8-100 characters, not equal to the username.
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 100;

const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const rawUsername = String(formData.get("username") ?? "");
  const parsed = loginSchema.safeParse({
    username: rawUsername,
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: zodFieldErrors(parsed.error),
      values: { username: rawUsername },
    };
  }

  let result;
  try {
    result = await login(parsed.data);
  } catch (error) {
    return toActionError(error, { username: parsed.data.username });
  }

  await createSession(result);
  // redirect() throws, so it must stay outside the try/catch above.
  redirect(
    result.mustChangePassword ? "/change-password" : homePathFor(result.role),
  );
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(MIN_PASSWORD, `Password must be at least ${MIN_PASSWORD} characters.`)
      .max(MAX_PASSWORD, `Password can be at most ${MAX_PASSWORD} characters.`),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "The new password must be different from the current one.",
  });

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Server Actions are public endpoints: verify the session again here.
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }
  if (parsed.data.newPassword.toLowerCase() === session.username.toLowerCase()) {
    return {
      ok: false,
      fieldErrors: {
        newPassword: ["Password must not be the same as the username."],
      },
    };
  }

  let result;
  try {
    result = await changePassword({
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });
  } catch (error) {
    return toActionError(error);
  }

  // The backend issues a NEW token (mustChangePassword is now false).
  await createSession(result);
  redirect(homePathFor(result.role));
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
