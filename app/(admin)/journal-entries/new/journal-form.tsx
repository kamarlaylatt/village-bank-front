"use client";

import { useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { FormAlert } from "@/components/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useToastAction } from "@/hooks/use-toast-action";
import { errorsFor } from "@/lib/action-state";
import { postJournalEntryAction } from "@/lib/actions/journal";
import { CHART_OF_ACCOUNTS } from "@/lib/accounts";
import { parseUnits, unitsToString } from "@/lib/money";

type Line = { key: number; accountId: string; debit: string; credit: string };

const ZERO = BigInt(0);
const emptyLine = (key: number): Line => ({
  key,
  accountId: "",
  debit: "",
  credit: "",
});

// Blank means 0; null means "not a valid amount".
function amount(text: string): bigint | null {
  return text.trim() === "" ? ZERO : parseUnits(text);
}

export function JournalForm({ today }: { today: string }) {
  const [entryDate, setEntryDate] = useState(today);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine(1), emptyLine(2)]);
  const [nextKey, setNextKey] = useState(3);

  function reset() {
    setEntryDate(today);
    setDescription("");
    setLines([emptyLine(1), emptyLine(2)]);
    setNextKey(3);
  }

  const [state, formAction, pending] = useToastAction(
    postJournalEntryAction,
    reset,
  );

  function updateLine(key: number, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function addLine() {
    setLines((current) => [...current, emptyLine(nextKey)]);
    setNextKey((k) => k + 1);
  }

  // Derived on every render: same rules the server re-checks.
  const parsed = lines.map((line) => ({
    debit: amount(line.debit),
    credit: amount(line.credit),
  }));
  const lineValid = lines.map((line, i) => {
    const { debit, credit } = parsed[i];
    return (
      line.accountId !== "" &&
      debit !== null &&
      credit !== null &&
      debit > ZERO !== credit > ZERO
    );
  });
  const totalDebit = parsed.reduce((sum, p) => sum + (p.debit ?? ZERO), ZERO);
  const totalCredit = parsed.reduce((sum, p) => sum + (p.credit ?? ZERO), ZERO);
  const balanced = totalDebit === totalCredit && totalDebit > ZERO;
  const canSubmit =
    entryDate !== "" &&
    description.trim() !== "" &&
    lines.length >= 2 &&
    lineValid.every(Boolean) &&
    balanced;

  const payload = JSON.stringify({
    entryDate,
    description,
    lines: lines.map(({ accountId, debit, credit }) => ({
      accountId,
      debit,
      credit,
    })),
  });

  return (
    <form action={formAction} className="max-w-3xl">
      <input type="hidden" name="payload" value={payload} />
      <Card>
        <CardContent>
          <FieldGroup>
            <FormAlert state={state} />

            <div className="grid gap-5 sm:grid-cols-[12rem_1fr]">
              <Field data-invalid={!!state.fieldErrors?.entryDate}>
                <FieldLabel htmlFor="entryDate">Entry date</FieldLabel>
                <Input
                  id="entryDate"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  aria-invalid={!!state.fieldErrors?.entryDate}
                  required
                />
                <FieldError errors={errorsFor(state, "entryDate")} />
              </Field>

              <Field data-invalid={!!state.fieldErrors?.description}>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  rows={2}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  aria-invalid={!!state.fieldErrors?.description}
                  required
                />
                <FieldError errors={errorsFor(state, "description")} />
              </Field>
            </div>

            <Field data-invalid={!!state.fieldErrors?.lines}>
              <FieldLabel>Lines</FieldLabel>
              <div className="flex flex-col gap-2">
                <div className="hidden grid-cols-[1fr_9rem_9rem_2.5rem] gap-2 text-xs text-muted-foreground sm:grid">
                  <span>Account</span>
                  <span>Debit</span>
                  <span>Credit</span>
                  <span />
                </div>
                {lines.map((line, i) => (
                  <div
                    key={line.key}
                    className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_9rem_9rem_2.5rem]"
                  >
                    <Select
                      value={line.accountId}
                      onValueChange={(value) =>
                        updateLine(line.key, { accountId: value })
                      }
                    >
                      <SelectTrigger
                        className="col-span-2 sm:col-span-1"
                        aria-label={`Account for line ${i + 1}`}
                      >
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHART_OF_ACCOUNTS.map((account) => (
                          <SelectItem key={account.id} value={String(account.id)}>
                            {account.code} · {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      inputMode="decimal"
                      placeholder="0.00"
                      autoComplete="off"
                      aria-label={`Debit for line ${i + 1}`}
                      aria-invalid={parsed[i].debit === null}
                      value={line.debit}
                      onChange={(e) =>
                        updateLine(line.key, {
                          debit: e.target.value,
                          // A line is one-sided: typing a debit clears the credit.
                          ...(e.target.value.trim() !== "" && { credit: "" }),
                        })
                      }
                    />
                    <Input
                      inputMode="decimal"
                      placeholder="0.00"
                      autoComplete="off"
                      aria-label={`Credit for line ${i + 1}`}
                      aria-invalid={parsed[i].credit === null}
                      value={line.credit}
                      onChange={(e) =>
                        updateLine(line.key, {
                          credit: e.target.value,
                          ...(e.target.value.trim() !== "" && { debit: "" }),
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove line ${i + 1}`}
                      disabled={lines.length <= 2}
                      onClick={() =>
                        setLines((current) =>
                          current.filter((l) => l.key !== line.key),
                        )
                      }
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                ))}
              </div>
              <FieldDescription>
                Each line is either a debit or a credit, with at most 4 decimal
                places.
              </FieldDescription>
              <FieldError errors={errorsFor(state, "lines")} />
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <PlusIcon />
                Add line
              </Button>
              <div className="flex flex-wrap items-center gap-3 text-sm tabular-nums">
                <span>Debit {unitsToString(totalDebit)}</span>
                <span>Credit {unitsToString(totalCredit)}</span>
                <Badge variant={balanced ? "secondary" : "outline"}>
                  {balanced ? "Balanced" : "Not balanced"}
                </Badge>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={!canSubmit || pending}>
                {pending ? "Posting…" : "Post entry"}
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </form>
  );
}
