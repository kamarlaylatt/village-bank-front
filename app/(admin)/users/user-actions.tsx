"use client";

import { useState } from "react";
import { ChevronDownIcon, KeyRoundIcon, ShieldIcon, UserXIcon, UserCheckIcon } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  changeRoleAction,
  resetPasswordAction,
  setUserActiveAction,
} from "@/lib/actions/users";
import type { UserDetails } from "@/lib/api/types";

type DialogName = "role" | "reset" | "toggle" | null;

export function UserActions({ user }: { user: UserDetails }) {
  const [dialog, setDialog] = useState<DialogName>(null);
  const close = () => setDialog(null);

  // The backend refuses role changes, deactivation and password resets for a SuperAdmin.
  if (user.role === "SuperAdmin") {
    return <span className="text-xs text-muted-foreground">Protected</span>;
  }

  return (
    <>
      {/* modal={false}: opening a dialog from a modal menu can leave the page unclickable. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-label={`Actions for ${user.username}`}
          >
            Manage
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("role")}>
            <ShieldIcon />
            Change role
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("reset")}>
            <KeyRoundIcon />
            Reset password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant={user.isActive ? "destructive" : "default"}
            onSelect={() => setDialog("toggle")}
          >
            {user.isActive ? <UserXIcon /> : <UserCheckIcon />}
            {user.isActive ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangeRoleDialog user={user} open={dialog === "role"} onClose={close} />
      <ResetPasswordDialog user={user} open={dialog === "reset"} onClose={close} />
      <ToggleActiveDialog user={user} open={dialog === "toggle"} onClose={close} />
    </>
  );
}

type DialogProps = { user: UserDetails; open: boolean; onClose: () => void };

function ChangeRoleDialog({ user, open, onClose }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            New role for <span className="font-medium">{user.username}</span>.
            It takes effect on their next request.
          </DialogDescription>
        </DialogHeader>
        <ChangeRoleForm user={user} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

function ChangeRoleForm({ user, onClose }: { user: UserDetails; onClose: () => void }) {
  const [state, formAction, pending] = useToastAction(changeRoleAction, onClose);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={user.id} />
      <FieldGroup>
        <FormAlert state={state} />
        <Field data-invalid={!!state.fieldErrors?.role}>
          <FieldLabel htmlFor={`role-${user.id}`}>Role</FieldLabel>
          <Select name="role" defaultValue={user.role}>
            <SelectTrigger id={`role-${user.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Teller">Teller</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Auditor">Auditor</SelectItem>
            </SelectContent>
          </Select>
          <FieldError errors={errorsFor(state, "role")} />
        </Field>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save role"}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}

function ResetPasswordDialog({ user, open, onClose }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a temporary password for{" "}
            <span className="font-medium">{user.username}</span>. They must
            change it at their next sign-in.
          </DialogDescription>
        </DialogHeader>
        <ResetPasswordForm user={user} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordForm({ user, onClose }: { user: UserDetails; onClose: () => void }) {
  const [state, formAction, pending] = useToastAction(resetPasswordAction, onClose);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={user.id} />
      <FieldGroup>
        <FormAlert state={state} />
        <Field data-invalid={!!state.fieldErrors?.temporaryPassword}>
          <FieldLabel htmlFor={`reset-${user.id}`}>Temporary password</FieldLabel>
          <Input
            id={`reset-${user.id}`}
            name="temporaryPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!state.fieldErrors?.temporaryPassword}
            required
            autoFocus
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
            {pending ? "Saving…" : "Set temporary password"}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}

function ToggleActiveDialog({ user, open, onClose }: DialogProps) {
  const deactivating = user.isActive;

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <ToggleActiveForm user={user} deactivating={deactivating} onClose={onClose}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deactivating ? "Deactivate" : "Activate"} {user.username}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deactivating
                ? "They are signed out on their next request and cannot sign in until you activate the account again."
                : "They will be able to sign in again with their current password."}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </ToggleActiveForm>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ToggleActiveForm({
  user,
  deactivating,
  onClose,
  children,
}: {
  user: UserDetails;
  deactivating: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useToastAction(setUserActiveAction, onClose);

  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="userId" value={user.id} />
      <input type="hidden" name="active" value={String(!deactivating)} />
      {children}
      <FormAlert state={state} />
      <AlertDialogFooter>
        <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
        {/* A plain submit button, not AlertDialogAction: that would close the dialog and unmount this form before it submits. */}
        <Button
          type="submit"
          variant={deactivating ? "destructive" : "default"}
          disabled={pending}
        >
          {pending ? "Saving…" : deactivating ? "Deactivate" : "Activate"}
        </Button>
      </AlertDialogFooter>
    </form>
  );
}
