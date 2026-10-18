import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { createTag, fetchTags } from "../services/tag-service";
import type { AdminTagRow, CreateTagInput } from "../types/tags";

export function useTags(initialData?: AdminTagRow[]) {
  return useQuery({
    queryKey: queryKeys.tags.all,
    queryFn: fetchTags,
    initialData,
    staleTime: 60_000,
  });
}

export function useTagMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (input: CreateTagInput) => createTag(input),
    onSuccess: (tag) => {
      queryClient.setQueryData<AdminTagRow[]>(queryKeys.tags.all, (previous) =>
        previous ? [...previous, tag] : [tag]
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
      toast.success(`Created “${tag.name}”`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to create tag"));
    },
  });

  return { createMutation };
}
