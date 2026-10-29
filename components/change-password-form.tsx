"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { errorsFor } from "@/lib/action-state";
import { changePasswordAction } from "@/lib/actions/auth";

// Used by the forced /change-password page and the voluntary /account/password page.
export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, {});

  return (
    <form action={formAction}>
      <FieldGroup>
        <FormAlert state={state} />

        <Field data-invalid={!!state.fieldErrors?.currentPassword}>
          <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!state.fieldErrors?.currentPassword}
            required
          />
          <FieldError errors={errorsFor(state, "currentPassword")} />
        </Field>

        <Field data-invalid={!!state.fieldErrors?.newPassword}>
          <FieldLabel htmlFor="newPassword">New password</FieldLabel>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!state.fieldErrors?.newPassword}
            required
          />
          <FieldDescription>
            8–100 characters, and not the same as your username.
          </FieldDescription>
          <FieldError errors={errorsFor(state, "newPassword")} />
        </Field>

        <Field data-invalid={!!state.fieldErrors?.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!state.fieldErrors?.confirmPassword}
            required
          />
          <FieldError errors={errorsFor(state, "confirmPassword")} />
        </Field>

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Change password"}
        </Button>
      </FieldGroup>
    </form>
  );
}
