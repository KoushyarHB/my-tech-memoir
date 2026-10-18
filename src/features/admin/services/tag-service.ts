import { api } from "@/lib/api-client";
import type { AdminTagRow, CreateTagInput } from "../types/tags";

export async function fetchTags(): Promise<AdminTagRow[]> {
  return api.get<AdminTagRow[]>("/api/tags");
}

export async function createTag(input: CreateTagInput): Promise<AdminTagRow> {
  return api.post<AdminTagRow>("/api/tags", input);
}
