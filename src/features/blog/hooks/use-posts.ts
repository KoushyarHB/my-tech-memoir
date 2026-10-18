import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchPosts } from "../services/post-service";
import type { PostListItem } from "../types";

export function usePosts(options?: {
  drafts?: boolean;
  initialData?: PostListItem[];
}) {
  return useQuery({
    queryKey: queryKeys.posts.list(Boolean(options?.drafts)),
    queryFn: () => fetchPosts({ drafts: options?.drafts }),
    initialData: options?.initialData,
    staleTime: 60_000,
  });
}
