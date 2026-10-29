import { z } from "zod";
import { ApiError, type FieldErrors } from "@/lib/api/errors";

// Return value of every Server Action used with useActionState. It must stay
// serializable. Actions that succeed with a redirect never return.
export type ActionState = {
  ok?: boolean;
  message?: string;
  // How a successful result should be announced (e.g. an idempotent replay is "info").
  variant?: "success" | "info";
  fieldErrors?: FieldErrors;
  // Submitted text values (never passwords) so the form can repopulate.
  values?: Record<string, string>;
};

export function formString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const flat = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const result: FieldErrors = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.length) result[key] = messages;
  }
  return result;
}

// Adapts one field's messages to the shape shadcn's <FieldError errors={...}> takes.
export function errorsFor(
  state: ActionState,
  name: string,
): { message: string }[] | undefined {
  return state.fieldErrors?.[name]?.map((message) => ({ message }));
}

// Use in a catch block. Anything that is not an ApiError - including the
// NEXT_REDIRECT signal thrown by redirect() - is rethrown untouched.
export function toActionError(
  error: unknown,
  values?: Record<string, string>,
): ActionState {
  if (error instanceof ApiError) {
    return {
      ok: false,
      message: error.detail ?? error.message,
      fieldErrors: error.fieldErrors,
      values,
    };
  }
  throw error;
}
