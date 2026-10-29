// Query-string dates for the report pages: only a real calendar date as "YYYY-MM-DD" is
// accepted. Anything else is ignored, so the backend falls back to its default (today).
export function parseDateParam(
  value: string | string[] | undefined,
): string | undefined {
  const text = Array.isArray(value) ? value[0] : value;
  if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return undefined;

  // A date that rolls over (2026-02-31) does not survive the round trip.
  const date = new Date(`${text}T00:00:00Z`);
  const valid =
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
  return valid ? text : undefined;
}
