"use client";

import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// In this Next.js version error boundaries receive `error: unknown` and `retry`
// (re-fetches and re-renders the segment).
export default function AdminError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Something went wrong while loading this page.";

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 pt-10">
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>Could not load this page</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Button variant="outline" className="self-start" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
