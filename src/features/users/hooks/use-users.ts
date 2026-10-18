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
import { ROLE_LABELS } from "../constants/roles";
import { fetchUsersPage, fetchUserStats, updateUserRole } from "../services/user-service";
import type { GetUserDto, GetUserStatsDto, UserRole } from "../types";

export function useUsersPage(
  query: Partial<PaginationQuery>,
  initialData?: PaginatedResult<GetUserDto>
) {
  return useQuery({
    queryKey: queryKeys.users.page(query),
    queryFn: () => fetchUsersPage(query),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useUserStats(initialData?: GetUserStatsDto) {
  return useQuery({
    queryKey: queryKeys.users.stats(),
    queryFn: fetchUserStats,
    initialData,
    staleTime: 60_000,
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, role),
    onSuccess: (user, { role }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success(`Role updated to ${ROLE_LABELS[role]}`, {
        description:
          "They may need to sign out and back in for it to apply.",
      });
      return user;
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update role"));
    },
  });

  return { updateRoleMutation };
}
