import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 pt-10">
      <Alert>
        <SearchXIcon />
        <AlertTitle>Not found</AlertTitle>
        <AlertDescription>
          That record does not exist or has been removed.
        </AlertDescription>
      </Alert>
      <Button asChild variant="outline" className="self-start">
        <Link href="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
