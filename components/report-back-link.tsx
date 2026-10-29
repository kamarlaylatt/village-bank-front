import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportBackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
      <Link href="/reports">
        <ArrowLeftIcon />
        Reports
      </Link>
    </Button>
  );
}
