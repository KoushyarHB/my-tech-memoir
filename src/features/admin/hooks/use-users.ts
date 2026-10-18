import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { ROLE_LABELS, type UserRole } from "@/features/admin/types/roles";
import { fetchUsers, updateUserRole } from "../services/user-service";
import type { AdminUserRow } from "../types/users";

export function useUsers(initialData?: AdminUserRow[]) {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: fetchUsers,
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
      queryClient.setQueryData<AdminUserRow[]>(queryKeys.users.all, (previous) =>
        previous?.map((row) => (row.id === user.id ? { ...row, role } : row))
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success(`Role updated to ${ROLE_LABELS[role]}`, {
        description:
          "They may need to sign out and back in for it to apply.",
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update role"));
    },
  });

  return { updateRoleMutation };
}
