import "server-only";

import { apiFetch } from "./client";
import type { CreateMemberRequest, MemberDetails, PagedResult } from "./types";

// Backend clamps pageSize to 1-100 and page to >= 1.
export function listMembers(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return apiFetch<PagedResult<MemberDetails>>("/api/members", {
    query: params,
  });
}

export function getMember(id: number) {
  return apiFetch<MemberDetails>(`/api/members/${id}`);
}

// Teller or Manager. The savings account is created together with the member.
export function createMember(body: CreateMemberRequest) {
  return apiFetch<MemberDetails>("/api/members", { method: "POST", body });
}
