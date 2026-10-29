import { CircleAlertIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ActionState } from "@/lib/action-state";

// Shows the form-level error (e.g. "Invalid username or password."). Field-level
// problems are rendered next to their inputs instead.
export function FormAlert({ state }: { state: ActionState }) {
  const hasFieldErrors = Object.keys(state.fieldErrors ?? {}).length > 0;
  if (state.ok !== false || !state.message || hasFieldErrors) return null;

  return (
    <Alert variant="destructive" role="alert">
      <CircleAlertIcon />
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}
