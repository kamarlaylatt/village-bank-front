"use client";

import { useActionState, useState } from "react";
import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { errorsFor, type ActionState } from "@/lib/action-state";
import {
  applyLoanAction,
  previewLoanAction,
  type LoanPreviewState,
} from "@/lib/actions/loans";
import { formatDate, formatKip, formatWhole } from "@/lib/format";

export function LoanApplicationForm({
  memberId,
  disabled,
}: {
  memberId: number;
  disabled: boolean;
}) {
  // Controlled inputs: the two buttons are two different form actions, and React
  // resets uncontrolled fields after each one.
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [term, setTerm] = useState("");
  const [purpose, setPurpose] = useState("");
  // Which button was pressed last decides whose errors are shown.
  const [last, setLast] = useState<"preview" | "apply">("apply");

  const [applyState, applyAction, applying] = useActionState(
    applyLoanAction,
    {} as ActionState,
  );
  const [previewState, previewAction, previewing] = useActionState(
    previewLoanAction,
    {} as LoanPreviewState,
  );

  const state: ActionState = last === "preview" ? previewState : applyState;
  const preview = previewState.preview;
  // A preview is only trustworthy while the inputs still match what produced it.
  const previewCurrent =
    preview !== undefined &&
    previewState.values?.principal === principal &&
    previewState.values?.rate === rate &&
    previewState.values?.term === term;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <form action={applyAction}>
            <input type="hidden" name="memberId" value={memberId} />
            <FieldGroup>
              <FormAlert state={state} />

              <div className="grid gap-5 sm:grid-cols-3">
                <Field data-invalid={!!state.fieldErrors?.principal}>
                  <FieldLabel htmlFor="principal">Principal (kip)</FieldLabel>
                  <Input
                    id="principal"
                    name="principal"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="5000000"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    aria-invalid={!!state.fieldErrors?.principal}
                    required
                  />
                  <FieldDescription>Whole kip, up to 1,000,000,000.</FieldDescription>
                  <FieldError errors={errorsFor(state, "principal")} />
                </Field>

                <Field data-invalid={!!state.fieldErrors?.rate}>
                  <FieldLabel htmlFor="rate">Monthly interest (%)</FieldLabel>
                  <Input
                    id="rate"
                    name="rate"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="2"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    aria-invalid={!!state.fieldErrors?.rate}
                    required
                  />
                  <FieldDescription>
                    Flat, on the original principal. 0–10, up to 4 decimals.
                  </FieldDescription>
                  <FieldError errors={errorsFor(state, "rate")} />
                </Field>

                <Field data-invalid={!!state.fieldErrors?.term}>
                  <FieldLabel htmlFor="term">Term (months)</FieldLabel>
                  <Input
                    id="term"
                    name="term"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="12"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    aria-invalid={!!state.fieldErrors?.term}
                    required
                  />
                  <FieldDescription>1–60 months.</FieldDescription>
                  <FieldError errors={errorsFor(state, "term")} />
                </Field>
              </div>

              <Field data-invalid={!!state.fieldErrors?.purpose}>
                <FieldLabel htmlFor="purpose">Purpose (optional)</FieldLabel>
                <Textarea
                  id="purpose"
                  name="purpose"
                  rows={2}
                  maxLength={200}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  aria-invalid={!!state.fieldErrors?.purpose}
                />
                <FieldError errors={errorsFor(state, "purpose")} />
              </Field>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="submit"
                  variant="outline"
                  formAction={previewAction}
                  onClick={() => setLast("preview")}
                  disabled={previewing}
                >
                  {previewing ? "Calculating…" : "Preview schedule"}
                </Button>
                <Button
                  type="submit"
                  onClick={() => setLast("apply")}
                  disabled={disabled || applying}
                >
                  {applying ? "Submitting…" : "Submit application"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Repayment schedule preview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!previewCurrent && (
              <p className="text-sm text-destructive">
                The terms changed since this preview. Preview again to refresh it.
              </p>
            )}
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Principal</dt>
                <dd className="font-medium tabular-nums">
                  {formatKip(preview.principal)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total interest</dt>
                <dd className="font-medium tabular-nums">
                  {formatKip(preview.totalInterest)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total repayable</dt>
                <dd className="font-medium tabular-nums">
                  {formatKip(preview.totalRepayable)}
                </dd>
              </div>
            </dl>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Due (if disbursed today)</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.installments.map((item) => (
                  <TableRow key={item.number}>
                    <TableCell>{item.number}</TableCell>
                    <TableCell>{formatDate(item.dueDate)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatWhole(item.principal)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatWhole(item.interest)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatWhole(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground">
              The real schedule starts on the day the loan is disbursed, so the
              due dates will shift accordingly.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
