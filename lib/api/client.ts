import "server-only";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  ApiError,
  PASSWORD_CHANGE_REQUIRED_TITLE,
  parseErrorResponse,
} from "./errors";

const baseUrl = (process.env.API_BASE_URL ?? "http://localhost:5272").replace(
  /\/+$/,
  "",
);

type Query = Record<string, string | number | undefined | null>;

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
  headers?: Record<string, string>;
  // false for the login call: a stale must-change-password token would make
  // the backend answer 403 even though login is anonymous.
  auth?: boolean;
};

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${baseUrl}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

// Server-to-server call to the ASP.NET API. Token comes from the sealed
// session cookie and is never exposed to the browser.
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { method = "GET", body, query, headers = {}, auth = true } = options;

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (auth) {
    const session = await getSession();
    if (!session) redirect("/login");
    requestHeaders.Authorization = `Bearer ${session.accessToken}`;
  }
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";

  const res = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (res.ok) {
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  const error = await parseErrorResponse(res);

  // The backend re-checks the user on every request, so a 401 also means the
  // account was deactivated or its role changed since the token was issued.
  if (auth && error.status === 401) redirect("/logout");

  if (
    auth &&
    error.status === 403 &&
    error.title === PASSWORD_CHANGE_REQUIRED_TITLE
  ) {
    redirect("/change-password");
  }

  throw error;
}

// For responses that are not JSON (CSV report downloads). Returns null when there is no
// session. Unlike apiFetch it never redirects or throws on a non-OK status: it is used from
// Route Handlers, which answer the browser themselves.
export async function apiFetchRaw(
  path: string,
  query?: Query,
): Promise<Response | null> {
  const session = await getSession();
  if (!session) return null;

  return fetch(buildUrl(path, query), {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
}

export { ApiError };
