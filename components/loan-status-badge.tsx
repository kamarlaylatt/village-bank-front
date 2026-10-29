import { Badge } from "@/components/ui/badge";
import type { LoanStatus } from "@/lib/api/types";

const VARIANTS: Record<LoanStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  Pending: "outline",
  Approved: "secondary",
  Active: "default",
  Closed: "secondary",
  Rejected: "destructive",
};

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return <Badge variant={VARIANTS[status]}>{status}</Badge>;
}
