import { api } from "@/lib/api-client";

export type RecordPostViewResult = {
  counted: boolean;
  viewCount?: number;
};

export async function recordPostView(
  postId: string,
  viewerKey: string
): Promise<RecordPostViewResult> {
  return api.post<RecordPostViewResult>("/api/views", { postId, viewerKey });
}
