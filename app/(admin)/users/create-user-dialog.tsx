"use client";

import { useState } from "react";
import { UserPlusIcon } from "lucide-react";
import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToastAction } from "@/hooks/use-toast-action";
import { errorsFor } from "@/lib/action-state";
import { createUserAction } from "@/lib/actions/users";

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);

  // Dialog content unmounts when closed, so the form starts fresh on each open.
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlusIcon />
          New user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
          <DialogDescription>
            The user signs in with the temporary password and must change it
            straight away.
          </DialogDescription>
        </DialogHeader>
        <CreateUserForm onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CreateUserForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useToastAction(createUserAction, onClose);

  return (
    <form action={formAction}>
      <FieldGroup>
        <FormAlert state={state} />

        <Field data-invalid={!!state.fieldErrors?.username}>
          <FieldLabel htmlFor="new-username">Username</FieldLabel>
          <Input
            id="new-username"
            name="username"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={state.values?.username}
            aria-invalid={!!state.fieldErrors?.username}
            required
            autoFocus
          />
          <FieldDescription>
            3–50 characters: lowercase letters, digits, &quot;.&quot;, &quot;_&quot; or
            &quot;-&quot;.
          </FieldDescription>
          <FieldError errors={errorsFor(state, "username")} />
        </Field>

        <Field data-invalid={!!state.fieldErrors?.role}>
          <FieldLabel htmlFor="new-role">Role</FieldLabel>
          <Select name="role" defaultValue={state.values?.role || "Teller"}>
            <SelectTrigger id="new-role" aria-invalid={!!state.fieldErrors?.role}>
              <SelectValue placeholder="Choose a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Teller">Teller</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Auditor">Auditor</SelectItem>
            </SelectContent>
          </Select>
          <FieldError errors={errorsFor(state, "role")} />
        </Field>

        <Field data-invalid={!!state.fieldErrors?.temporaryPassword}>
          <FieldLabel htmlFor="new-password">Temporary password</FieldLabel>
          <Input
            id="new-password"
            name="temporaryPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!state.fieldErrors?.temporaryPassword}
            required
          />
          <FieldDescription>
            8–100 characters, and not the same as the username.
          </FieldDescription>
          <FieldError errors={errorsFor(state, "temporaryPassword")} />
        </Field>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create user"}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}
