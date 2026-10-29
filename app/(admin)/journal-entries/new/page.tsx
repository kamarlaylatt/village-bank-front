import { Suspense } from "react";
import type { Metadata } from "next";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth";
import { todayInBusinessTime } from "@/lib/format";
import { MANAGERS, hasRole, homePathFor } from "@/lib/roles";
import { JournalForm } from "./journal-form";

export const metadata: Metadata = { title: "New journal entry" };

export default function NewJournalEntryPage() {
  return (
    <>
      <PageHeader
        title="New journal entry"
        description="Post a manual double-entry entry. Total debits must equal total credits."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full max-w-3xl" />}>
        <JournalContent />
      </Suspense>
    </>
  );
}

async function JournalContent() {
  const user = await requireUser();
  if (!hasRole(user.role, MANAGERS)) {
    return (
      <NoAccess
        homeHref={homePathFor(user.role)}
        message="Only managers can post journal entries."
      />
    );
  }

  // Computed after the session read: with Cache Components the current time
  // may only be read at request time.
  return <JournalForm today={todayInBusinessTime()} />;
}
