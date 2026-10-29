"use client";

import { useActionState, useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { errorsFor, type ActionState } from "@/lib/action-state";
import { depositAction, withdrawAction } from "@/lib/actions/savings";
import { newIdempotencyKey } from "@/lib/uuid";

type Kind = "deposit" | "withdraw";

export function MoneyDialog({
  kind,
  accountId,
}: {
  kind: Kind;
  accountId: number;
}) {
  const [open, setOpen] = useState(false);
  // Bumped on every open so the form (and its error state) starts fresh.
  const [epoch, setEpoch] = useState(0);
  // One key per intended transaction. It is kept across retries and failed
  // attempts so a repeated submit is replayed by the backend instead of posting
  // twice, and it is replaced only after a success.
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const isDeposit = kind === "deposit";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setEpoch((e) => e + 1);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant={isDeposit ? "default" : "outline"}>
          {isDeposit ? <PlusIcon /> : <MinusIcon />}
          {isDeposit ? "Deposit" : "Withdraw"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isDeposit ? "Record a deposit" : "Record a withdrawal"}</DialogTitle>
          <DialogDescription>
            {isDeposit
              ? "Cash received from the member into their savings account."
              : "Cash paid out to the member. It cannot exceed the balance."}
          </DialogDescription>
        </DialogHeader>
        <MoneyForm
          key={epoch}
          kind={kind}
          accountId={accountId}
          idempotencyKey={idempotencyKey}
          onCancel={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            setIdempotencyKey(newIdempotencyKey());
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function MoneyForm({
  kind,
  accountId,
  idempotencyKey,
  onCancel,
  onSuccess,
}: {
  kind: Kind;
  accountId: number;
  idempotencyKey: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const action = kind === "deposit" ? depositAction : withdrawAction;

  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await action(prev, formData);
      if (result.ok && result.message) {
        if (result.variant === "info") toast.info(result.message);
        else toast.success(result.message);
        onSuccess();
      }
      return result;
    },
    {} as ActionState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <FieldGroup>
        <FormAlert state={state} />

        <Field data-invalid={!!state.fieldErrors?.amount}>
          <FieldLabel htmlFor={`${kind}-amount`}>Amount</FieldLabel>
          <Input
            id={`${kind}-amount`}
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            defaultValue={state.values?.amount}
            aria-invalid={!!state.fieldErrors?.amount}
            required
            autoFocus
          />
          <FieldDescription>Up to 4 decimal places.</FieldDescription>
          <FieldError errors={errorsFor(state, "amount")} />
        </Field>

        <Field data-invalid={!!state.fieldErrors?.note}>
          <FieldLabel htmlFor={`${kind}-note`}>Note (optional)</FieldLabel>
          <Textarea
            id={`${kind}-note`}
            name="note"
            rows={3}
            maxLength={500}
            defaultValue={state.values?.note}
            aria-invalid={!!state.fieldErrors?.note}
          />
          <FieldError errors={errorsFor(state, "note")} />
        </Field>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending
              ? "Saving…"
              : kind === "deposit"
                ? "Record deposit"
                : "Record withdrawal"}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}
