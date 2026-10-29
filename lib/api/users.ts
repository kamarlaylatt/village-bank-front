import "server-only";

import { apiFetch } from "./client";
import type {
  ChangeRoleRequest,
  CreateUserRequest,
  ResetPasswordRequest,
  UserDetails,
} from "./types";

// All SuperAdmin only. The list is not paged (sorted by username).
export function listUsers() {
  return apiFetch<UserDetails[]>("/api/users");
}

export function createUser(body: CreateUserRequest) {
  return apiFetch<UserDetails>("/api/users", { method: "POST", body });
}

export function changeUserRole(id: number, body: ChangeRoleRequest) {
  return apiFetch<UserDetails>(`/api/users/${id}/role`, {
    method: "PUT",
    body,
  });
}

export function deactivateUser(id: number) {
  return apiFetch<UserDetails>(`/api/users/${id}/deactivate`, {
    method: "POST",
  });
}

export function activateUser(id: number) {
  return apiFetch<UserDetails>(`/api/users/${id}/activate`, {
    method: "POST",
  });
}

// 204 No Content
export function resetUserPassword(id: number, body: ResetPasswordRequest) {
  return apiFetch<void>(`/api/users/${id}/reset-password`, {
    method: "POST",
    body,
  });
}
