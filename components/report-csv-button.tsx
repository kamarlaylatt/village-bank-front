import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// A plain link (not next/link): it points at a Route Handler that returns a file, which
// must not be prefetched or handled by the client router.
export function ReportCsvButton({
  slug,
  params,
}: {
  slug: string;
  params?: Record<string, string>;
}) {
  const query = new URLSearchParams(params).toString();

  return (
    <Button asChild variant="outline">
      <a href={`/reports/download/${slug}${query ? `?${query}` : ""}`}>
        <DownloadIcon />
        Download CSV
      </a>
    </Button>
  );
}
