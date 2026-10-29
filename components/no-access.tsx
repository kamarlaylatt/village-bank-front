import Link from "next/link";
import { ShieldAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Shown when the signed-in role is not allowed to see a page. The backend
// enforces the same rules and answers 403, so this is a courtesy, not security.
export function NoAccess({
  homeHref = "/",
  message = "Your role does not have access to this page.",
}: {
  homeHref?: string;
  message?: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 pt-10">
      <Alert>
        <ShieldAlertIcon />
        <AlertTitle>No access</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Button asChild variant="outline" className="self-start">
        <Link href={homeHref}>Go back</Link>
      </Button>
    </div>
  );
}
