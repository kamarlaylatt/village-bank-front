"use client";

import { useActionState, useState } from "react";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { errorsFor } from "@/lib/action-state";
import { createMemberAction } from "@/lib/actions/members";

export function CreateMemberDialog() {
  const [open, setOpen] = useState(false);
  // Bumped on every open so the form (and its error state) starts fresh.
  const [epoch, setEpoch] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setEpoch((e) => e + 1);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlusIcon />
          New member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New member</DialogTitle>
          <DialogDescription>
            A savings account is created automatically with the member.
          </DialogDescription>
        </DialogHeader>
        <CreateMemberForm key={epoch} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CreateMemberForm({ onCancel }: { onCancel: () => void }) {
  // On success the action redirects to the new member's page.
  const [state, formAction, pending] = useActionState(createMemberAction, {});

  return (
    <form action={formAction}>
      <FieldGroup>
        <FormAlert state={state} />

        <Field data-invalid={!!state.fieldErrors?.fullName}>
          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
          <Input
            id="fullName"
            name="fullName"
            maxLength={200}
            defaultValue={state.values?.fullName}
            aria-invalid={!!state.fieldErrors?.fullName}
            required
            autoFocus
          />
          <FieldError errors={errorsFor(state, "fullName")} />
        </Field>

        <Field data-invalid={!!state.fieldErrors?.phone}>
          <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
          <Input
            id="phone"
            name="phone"
            type="tel"
            maxLength={30}
            defaultValue={state.values?.phone}
            aria-invalid={!!state.fieldErrors?.phone}
          />
          <FieldError errors={errorsFor(state, "phone")} />
        </Field>

        <Field data-invalid={!!state.fieldErrors?.village}>
          <FieldLabel htmlFor="village">Village (optional)</FieldLabel>
          <Input
            id="village"
            name="village"
            maxLength={100}
            defaultValue={state.values?.village}
            aria-invalid={!!state.fieldErrors?.village}
          />
          <FieldError errors={errorsFor(state, "village")} />
        </Field>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create member"}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}
