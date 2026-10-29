import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { sealData, unsealData } from "iron-session";
import type { LoginResponse, Role } from "@/lib/api/types";

// The backend JWT never reaches the browser's JavaScript: it is sealed
// (encrypted + signed) by iron-session and stored in an httpOnly cookie.

export const SESSION_COOKIE = "vb_session";

export type Session = {
  accessToken: string;
  expiresAt: string;
  username: string;
  role: Role;
  mustChangePassword: boolean;
};

function sessionPassword(): string {
  const password = process.env.SESSION_PASSWORD;
  if (!password || password.length < 32) {
    throw new Error(
      "SESSION_PASSWORD must be set to a string of at least 32 characters (see .env.example).",
    );
  }
  return password;
}

function secondsUntil(iso: string): number {
  return Math.floor((new Date(iso).getTime() - Date.now()) / 1000);
}

// Returns null for a missing, tampered, or expired cookie. Also used by proxy.ts.
export async function decodeSession(
  value: string | undefined,
): Promise<Session | null> {
  if (!value) return null;
  try {
    const session = await unsealData<Session>(value, {
      password: sessionPassword(),
    });
    if (!session?.accessToken || secondsUntil(session.expiresAt) <= 0) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// Request-time read; call it inside a <Suspense> boundary (Cache Components).
export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  // Validating the cookie compares its expiry with the current time (Date.now()
  // inside iron-session). Cache Components only allows that at request time, so
  // mark the render as request-time before decoding.
  await connection();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
});

// Only valid in Server Actions and Route Handlers (cookies are written there).
export async function createSession(login: LoginResponse): Promise<void> {
  // iron-session's ttl is in seconds and 0 means "never expires", so keep it >= 1.
  const ttl = Math.max(1, secondsUntil(login.expiresAt));
  const session: Session = {
    accessToken: login.accessToken,
    expiresAt: login.expiresAt,
    username: login.username,
    role: login.role,
    mustChangePassword: login.mustChangePassword,
  };

  const sealed = await sealData(session, { password: sessionPassword(), ttl });
  const store = await cookies();
  store.set(SESSION_COOKIE, sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(login.expiresAt),
  });
}

export async function deleteSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
