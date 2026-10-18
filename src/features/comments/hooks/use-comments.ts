import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchComments } from "../services/comment-service";

export function useComments(postId: string) {
  return useQuery({
    queryKey: queryKeys.comments.byPost(postId),
    queryFn: () => fetchComments(postId),
    staleTime: 60_000,
  });
}
