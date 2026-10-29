import "server-only";

import { apiFetch } from "./client";
import type {
  PostJournalEntryRequest,
  PostJournalEntryResponse,
} from "./types";

// Manager only. There is no GET for journal entries in the backend yet.
export function postJournalEntry(body: PostJournalEntryRequest) {
  return apiFetch<PostJournalEntryResponse>("/api/journal-entries", {
    method: "POST",
    body,
  });
}
