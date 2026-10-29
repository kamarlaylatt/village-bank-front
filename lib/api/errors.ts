// Error shapes produced by the backend (Middleware/GlobalExceptionHandler.cs
// and ASP.NET's automatic model-binding validation):
//   - RFC 7807 problem+json: { title, status, detail? }
//   - ValidationProblemDetails: { title, status, errors: { "Field": ["msg"] } }
//   - 401/403 from the auth layer: empty body

export type FieldErrors = Record<string, string[]>;

export const PASSWORD_CHANGE_REQUIRED_TITLE = "Password change required";

export class ApiError extends Error {
  readonly status: number;
  readonly title: string | null;
  readonly detail: string | null;
  readonly fieldErrors: FieldErrors;

  constructor(
    status: number,
    title: string | null,
    detail: string | null,
    fieldErrors: FieldErrors = {},
  ) {
    super(detail ?? title ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

// "Username" -> "username", "$.amount" -> "amount", "$.lines[0].debit" -> "lines[0].debit"
function normalizeFieldKey(key: string): string {
  const stripped = key.replace(/^\$\.?/, "");
  return stripped.charAt(0).toLowerCase() + stripped.slice(1);
}

function messageForStatus(status: number): string {
  switch (status) {
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to do that.";
    case 404:
      return "The requested resource was not found.";
    default:
      return status >= 500
        ? "The server hit an unexpected error. Please try again."
        : `Request failed with status ${status}.`;
  }
}

export async function parseErrorResponse(res: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    const text = await res.text();
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (typeof body !== "object" || body === null) {
    return new ApiError(res.status, null, messageForStatus(res.status));
  }

  const problem = body as {
    title?: unknown;
    detail?: unknown;
    errors?: unknown;
  };
  const title = typeof problem.title === "string" ? problem.title : null;
  const detail = typeof problem.detail === "string" ? problem.detail : null;

  const fieldErrors: FieldErrors = {};
  if (typeof problem.errors === "object" && problem.errors !== null) {
    for (const [key, value] of Object.entries(problem.errors)) {
      if (Array.isArray(value)) {
        fieldErrors[normalizeFieldKey(key)] = value.filter(
          (m): m is string => typeof m === "string",
        );
      }
    }
  }

  const fallback =
    Object.keys(fieldErrors).length > 0
      ? "Please check the highlighted fields."
      : messageForStatus(res.status);

  return new ApiError(res.status, title, detail ?? fallback, fieldErrors);
}
