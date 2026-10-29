"use client";

import { useState } from "react";
import { BanknoteIcon, CheckIcon, SendIcon, XIcon } from "lucide-react";
import { FormAlert } from "@/components/form-alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToastAction } from "@/hooks/use-toast-action";
import { errorsFor, type ActionState } from "@/lib/action-state";
import {
  approveLoanAction,
  disburseLoanAction,
  rejectLoanAction,
  repayLoanAction,
} from "@/lib/actions/loans";
import { formatKip } from "@/lib/format";
import { newIdempotencyKey } from "@/lib/uuid";

type DialogName = "approve" | "reject" | "disburse" | "repay" | null;

type Props = {
  loanId: number;
  canDecide: boolean;
  canDisburse: boolean;
  canRepay: boolean;
  outstanding: number;
};

export function LoanActions({
  loanId,
  canDecide,
  canDisburse,
  canRepay,
  outstanding,
}: Props) {
  const [dialog, setDialog] = useState<DialogName>(null);
  const close = () => setDialog(null);
  // One key per intended repayment: kept across failed attempts so a repeated
  // submit is replayed by the backend instead of posting twice, and replaced
  // only after a success.
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canDecide && (
          <>
            <Button onClick={() => setDialog("approve")}>
              <CheckIcon />
              Approve
            </Button>
            <Button variant="outline" onClick={() => setDialog("reject")}>
              <XIcon />
              Reject
            </Button>
          </>
        )}
        {canDisburse && (
          <Button onClick={() => setDialog("disburse")}>
            <SendIcon />
            Disburse
          </Button>
        )}
        {canRepay && (
          <Button onClick={() => setDialog("repay")}>
            <BanknoteIcon />
            Record repayment
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={dialog === "approve"}
        onClose={close}
        loanId={loanId}
        action={approveLoanAction}
        title="Approve this loan?"
        description="Approving does not pay anything out yet; the loan still has to be disbursed. You cannot approve a loan that you applied for yourself."
        confirmLabel="Approve"
      />
      <ConfirmDialog
        open={dialog === "disburse"}
        onClose={close}
        loanId={loanId}
        action={disburseLoanAction}
        title="Disburse this loan?"
        description="The principal is credited to the member's savings account and the repayment schedule starts today. This cannot be undone from this panel."
        confirmLabel="Disburse"
      />

      <Dialog open={dialog === "reject"} onOpenChange={(next) => !next && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this loan</DialogTitle>
            <DialogDescription>
              The reason is saved with the application and shown to staff.
            </DialogDescription>
          </DialogHeader>
          <RejectForm loanId={loanId} onClose={close} />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "repay"} onOpenChange={(next) => !next && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a repayment</DialogTitle>
            <DialogDescription>
              Cash received from the member. It is applied to the oldest
              installment first, interest before principal.
            </DialogDescription>
          </DialogHeader>
          <RepayForm
            loanId={loanId}
            outstanding={outstanding}
            idempotencyKey={idempotencyKey}
            onClose={close}
            onSuccess={() => setIdempotencyKey(newIdempotencyKey())}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConfirmDialog({
  open,
  onClose,
  loanId,
  action,
  title,
  description,
  confirmLabel,
}: {
  open: boolean;
  onClose: () => void;
  loanId: number;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  title: string;
  description: string;
  confirmLabel: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <ConfirmForm
          loanId={loanId}
          action={action}
          onClose={onClose}
          confirmLabel={confirmLabel}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
        </ConfirmForm>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConfirmForm({
  loanId,
  action,
  onClose,
  confirmLabel,
  children,
}: {
  loanId: number;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  onClose: () => void;
  confirmLabel: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useToastAction(action, onClose);

  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="loanId" value={loanId} />
      {children}
      <FormAlert state={state} />
      <AlertDialogFooter>
        <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
        {/* A plain submit button, not AlertDialogAction: that would close the dialog and unmount this form before it submits. */}
        <Button type="submit" disabled={pending}>
          {pending ? "Working…" : confirmLabel}
        </Button>
      </AlertDialogFooter>
    </form>
  );
}

function RejectForm({ loanId, onClose }: { loanId: number; onClose: () => void }) {
  const [state, formAction, pending] = useToastAction(rejectLoanAction, onClose);

  return (
    <form action={formAction}>
      <input type="hidden" name="loanId" value={loanId} />
      <FieldGroup>
        <FormAlert state={state} />
        <Field data-invalid={!!state.fieldErrors?.reason}>
          <FieldLabel htmlFor="reject-reason">Reason</FieldLabel>
          <Textarea
            id="reject-reason"
            name="reason"
            rows={3}
            maxLength={500}
            defaultValue={state.values?.reason}
            aria-invalid={!!state.fieldErrors?.reason}
            required
            autoFocus
          />
          <FieldError errors={errorsFor(state, "reason")} />
        </Field>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="destructive" disabled={pending}>
            {pending ? "Rejecting…" : "Reject loan"}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}

function RepayForm({
  loanId,
  outstanding,
  idempotencyKey,
  onClose,
  onSuccess,
}: {
  loanId: number;
  outstanding: number;
  idempotencyKey: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [state, formAction, pending] = useToastAction(repayLoanAction, () => {
    onSuccess();
    onClose();
  });

  return (
    <form action={formAction}>
      <input type="hidden" name="loanId" value={loanId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <FieldGroup>
        <FormAlert state={state} />

        <Field data-invalid={!!state.fieldErrors?.amount}>
          <FieldLabel htmlFor="repay-amount">Amount (kip)</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="repay-amount"
              name="amount"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={!!state.fieldErrors?.amount}
              required
              autoFocus
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setAmount(String(outstanding))}
            >
              Pay in full
            </Button>
          </div>
          <FieldDescription>
            Whole kip. Outstanding: {formatKip(outstanding)}.
          </FieldDescription>
          <FieldError errors={errorsFor(state, "amount")} />
        </Field>

        <Field data-invalid={!!state.fieldErrors?.note}>
          <FieldLabel htmlFor="repay-note">Note (optional)</FieldLabel>
          <Textarea
            id="repay-note"
            name="note"
            rows={2}
            maxLength={500}
            defaultValue={state.values?.note}
            aria-invalid={!!state.fieldErrors?.note}
          />
          <FieldError errors={errorsFor(state, "note")} />
        </Field>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Record repayment"}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}
