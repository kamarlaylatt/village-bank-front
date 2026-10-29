"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import {
  formString,
  toActionError,
  zodFieldErrors,
  type ActionState,
} from "@/lib/action-state";
import {
  activateUser,
  changeUserRole,
  createUser,
  deactivateUser,
  resetUserPassword,
} from "@/lib/api/users";
import { requireActionRole } from "@/lib/auth";
import { SUPER_ADMIN } from "@/lib/roles";

// The backend refuses to create or promote anyone to SuperAdmin.
const roleSchema = z.enum(["Manager", "Teller", "Auditor"], {
  error: "Choose a role.",
});

// Mirrors Auth/PasswordPolicy.cs (UsernamePolicy and PasswordPolicy).
const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9][a-z0-9._-]{2,49}$/,
    "Username must be 3-50 characters: lowercase letters, digits, '.', '_' or '-', starting with a letter or digit.",
  );
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(100, "Password can be at most 100 characters.");
const idSchema = z.coerce.number().int().positive();

export async function createUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = {
    username: formString(formData, "username"),
    role: formString(formData, "role"),
  };
  const parsed = z
    .object({
      username: usernameSchema,
      role: roleSchema,
      temporaryPassword: passwordSchema,
    })
    .safeParse({
      ...values,
      temporaryPassword: formString(formData, "temporaryPassword"),
    });
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error), values };
  }
  if (parsed.data.temporaryPassword.toLowerCase() === parsed.data.username) {
    return {
      ok: false,
      fieldErrors: {
        temporaryPassword: ["Password must not be the same as the username."],
      },
      values,
    };
  }

  try {
    await requireActionRole(SUPER_ADMIN);
    await createUser(parsed.data);
    refresh();
    return {
      ok: true,
      variant: "success",
      message: `User ${parsed.data.username} created. They must change the temporary password at first sign-in.`,
    };
  } catch (error) {
    return toActionError(error, values);
  }
}

export async function changeRoleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ userId: idSchema, role: roleSchema })
    .safeParse({
      userId: formData.get("userId"),
      role: formString(formData, "role"),
    });
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    await requireActionRole(SUPER_ADMIN);
    await changeUserRole(parsed.data.userId, { role: parsed.data.role });
    refresh();
    return { ok: true, variant: "success", message: "Role updated." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ userId: idSchema, temporaryPassword: passwordSchema })
    .safeParse({
      userId: formData.get("userId"),
      temporaryPassword: formString(formData, "temporaryPassword"),
    });
  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    await requireActionRole(SUPER_ADMIN);
    // The backend also rejects a password equal to the username (400, shown inline).
    await resetUserPassword(parsed.data.userId, {
      temporaryPassword: parsed.data.temporaryPassword,
    });
    refresh();
    return {
      ok: true,
      variant: "success",
      message: "Temporary password set. The user must change it at next sign-in.",
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setUserActiveAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ userId: idSchema, active: z.enum(["true", "false"]) })
    .safeParse({
      userId: formData.get("userId"),
      active: formString(formData, "active"),
    });
  if (!parsed.success) {
    return { ok: false, message: "The request was not valid. Reload and try again." };
  }

  const activate = parsed.data.active === "true";
  try {
    await requireActionRole(SUPER_ADMIN);
    if (activate) await activateUser(parsed.data.userId);
    else await deactivateUser(parsed.data.userId);
    refresh();
    return {
      ok: true,
      variant: "success",
      message: activate ? "User activated." : "User deactivated.",
    };
  } catch (error) {
    return toActionError(error);
  }
}
