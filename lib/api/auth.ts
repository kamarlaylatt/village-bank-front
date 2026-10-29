import "server-only";

import { apiFetch } from "./client";
import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
} from "./types";

export function login(body: LoginRequest) {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body,
    auth: false,
  });
}

// Allowed even while mustChangePassword is true. Returns a NEW token that must
// replace the one in the session.
export function changePassword(body: ChangePasswordRequest) {
  return apiFetch<LoginResponse>("/api/auth/change-password", {
    method: "POST",
    body,
  });
}
