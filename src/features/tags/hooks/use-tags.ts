import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { PaginatedResult, PaginationQuery } from "@/shared/types/pagination";
import { createTag, deleteTag, fetchTagStats, fetchTagsPage } from "../services/tag-service";
import type { CreateTagRequest, GetTagDto, GetTagStatsDto } from "../types";

/**
 * Tags domain: TanStack Query hooks.
 *
 * The list hook is keyed by the whole query object, so changing page, sort,
 * search or filters is a cache miss that refetches exactly that slice.
 * `keepPreviousData` keeps the current page on screen while the next loads,
 * which is what tms-frontend's `GenericTable` does.
 */
export function useTagsPage(
  query: Partial<PaginationQuery>,
  {
    initialData,
    enabled = true,
  }: {
    initialData?: PaginatedResult<GetTagDto>;
    /** Set false to defer the request (e.g. an empty search box). */
    enabled?: boolean;
  } = {}
) {
  return useQuery({
    queryKey: queryKeys.tags.page(query),
    queryFn: () => fetchTagsPage(query),
    initialData,
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 60_000,
  });
}

export function useTagStats(initialData?: GetTagStatsDto) {
  return useQuery({
    queryKey: queryKeys.tags.stats(),
    queryFn: fetchTagStats,
    initialData,
    staleTime: 60_000,
  });
}

export function useTagMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (input: CreateTagRequest) => createTag(input),
    onSuccess: (tag) => {
      // Every tag page (and the metric tiles derived from them) is now stale.
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
      toast.success(`Created “${tag.name}”`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to create tag"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (tagId: string) => deleteTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
      // Post DTOs embed their tags, so open post lists are stale too.
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      toast.success("Tag deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to delete tag"));
    },
  });

  return { createMutation, deleteMutation };
}
