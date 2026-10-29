import Form from "next/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DateField = { name: string; label: string; value: string };

// Date filters as a plain GET form, so a report is a URL that can be bookmarked and shared.
export function ReportToolbar({
  action,
  fields,
  csv,
}: {
  action: string;
  fields: DateField[];
  csv?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      {fields.length > 0 ? (
        <Form action={action} className="flex flex-wrap items-end gap-2">
          {fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <Label htmlFor={`report-${field.name}`}>{field.label}</Label>
              <Input
                id={`report-${field.name}`}
                name={field.name}
                type="date"
                defaultValue={field.value}
                required
                className="w-44"
              />
            </div>
          ))}
          <Button type="submit" variant="outline">
            Run report
          </Button>
        </Form>
      ) : (
        <span />
      )}
      {csv}
    </div>
  );
}
