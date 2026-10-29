import { Suspense } from "react";
import { InfoIcon } from "lucide-react";
import { ChangePasswordForm } from "@/components/change-password-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth";

export default function ChangePasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <ChangePasswordContent />
        </Suspense>
      </CardContent>
    </Card>
  );
}

async function ChangePasswordContent() {
  // Reads the session cookie, so it must sit behind the Suspense boundary above.
  const user = await requireUser({ allowMustChangePassword: true });

  return (
    <>
      {user.mustChangePassword && (
        <Alert>
          <InfoIcon />
          <AlertDescription>
            You are using a temporary password. Set a new one to continue.
          </AlertDescription>
        </Alert>
      )}
      <ChangePasswordForm />
    </>
  );
}
