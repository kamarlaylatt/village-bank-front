// The backend business day is Asia/Vientiane (Domain/BusinessTime.cs). The API
// has no currency field, so amounts are shown as plain numbers.

const BUSINESS_TZ = "Asia/Vientiane";

const moneyFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export function formatMoney(value: number): string {
  return moneyFormat.format(value);
}

// Report tables: a dash for zero keeps the columns readable.
export function formatAmount(value: number): string {
  return value === 0 ? "—" : moneyFormat.format(value);
}

// Loans are in whole kip (the backend rejects decimals), so no fraction digits.
const wholeFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatWhole(value: number): string {
  return wholeFormat.format(value);
}

export function formatKip(value: number): string {
  return `${wholeFormat.format(value)} kip`;
}

// "YYYY-MM-DD" (a DateOnly) -> "29 Oct 2026". Parsed by hand so the date never
// shifts with the viewer's timezone.
export function formatDate(dateOnly: string): string {
  const [year, month, day] = dateOnly.split("-").map(Number);
  if (!year || !month || !day) return dateOnly;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// UTC ISO timestamp from the API -> "29 Oct 2026, 17:11" in Vientiane time.
export function formatDateTime(iso: string): string {
  // Defensive: treat a timestamp with no zone designator as UTC.
  const normalized = /(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BUSINESS_TZ,
  });
}

// Today's date in the business timezone as "YYYY-MM-DD".
export function todayInBusinessTime(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TZ }).format(
    new Date(),
  );
}
