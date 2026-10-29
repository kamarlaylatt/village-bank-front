import { Suspense } from "react";
import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/change-password-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Change password" };

export default function AccountPasswordPage() {
  return (
    <>
      <PageHeader
        title="Change password"
        description="Choose a new password for your account."
      />
      <Card className="max-w-md">
        <CardContent>
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <AccountPasswordContent />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}

async function AccountPasswordContent() {
  // Reads the session cookie; also sends a signed-out visitor to /login.
  await requireUser();
  return <ChangePasswordForm />;
}
