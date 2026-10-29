// Money arithmetic without floating-point drift. Amounts are handled as
// integer "units" of 1/10000 (the backend stores numeric(19,4)).

// BigInt(...) rather than a `10000n` literal: tsconfig targets ES2017, which
// rejects BigInt literals.
const SCALE = BigInt(10000);
const AMOUNT_PATTERN = /^\d+(\.\d{1,4})?$/;

export type Units = bigint;

// "12.3456" -> 123456n. Returns null for blank, negative, or > 4 decimals.
export function parseUnits(input: string): Units | null {
  const value = input.trim().replace(/,/g, "");
  if (!AMOUNT_PATTERN.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(4, "0"));
}

// 123456n -> 12.3456 (the JSON number sent to the API).
export function unitsToNumber(units: Units): number {
  return Number(units) / Number(SCALE);
}

export function unitsToString(units: Units): string {
  const whole = units / SCALE;
  const fraction = (units % SCALE).toString().padStart(4, "0");
  return `${whole}.${fraction}`.replace(/\.?0+$/, "") || "0";
}
