"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/action-state";

type FormAction = (
  prev: ActionState,
  formData: FormData,
) => Promise<ActionState>;

// useActionState plus a toast when the action reports success. `onSuccess` runs
// after the toast, e.g. to close the dialog the form lives in.
export function useToastAction(action: FormAction, onSuccess?: () => void) {
  return useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await action(prev, formData);
      if (result.ok && result.message) {
        if (result.variant === "info") toast.info(result.message);
        else toast.success(result.message);
        onSuccess?.();
      }
      return result;
    },
    {} as ActionState,
  );
}
