// Idempotency keys only need to be unique, not secret. crypto.randomUUID() is
// only available in secure contexts (HTTPS or localhost), so fall back for
// plain-HTTP deployments. The backend allows keys up to 100 characters.
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const rand = () => Math.random().toString(36).slice(2);
  return `${Date.now().toString(36)}-${rand()}-${rand()}`;
}
