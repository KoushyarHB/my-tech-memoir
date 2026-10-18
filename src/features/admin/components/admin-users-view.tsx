"use client";

import { useUsers } from "../hooks/use-users";
import type { AdminUserRow } from "../types/users";
import { ROLE_LABELS } from "../types/roles";
import { AdminMetrics } from "./admin-metrics";
import { AdminUsersTable } from "./admin-users-table";

type AdminUsersViewProps = {
  users: AdminUserRow[];
  currentUserId: string;
};

export function AdminUsersView({
  users: initialUsers,
  currentUserId,
}: AdminUsersViewProps) {
  const { data: users = initialUsers } = useUsers(initialUsers);

  const roleCounts = {
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    EDITOR: users.filter((u) => u.role === "EDITOR").length,
    USER: users.filter((u) => u.role === "USER").length,
  };

  const metrics = [
    { label: "Total users", value: users.length },
    { label: ROLE_LABELS.ADMIN, value: roleCounts.ADMIN },
    { label: ROLE_LABELS.EDITOR, value: roleCounts.EDITOR },
    { label: ROLE_LABELS.USER, value: roleCounts.USER },
    {
      label: "Posts",
      value: users.reduce((sum, u) => sum + u.postCount, 0),
    },
    {
      label: "Bookmarks",
      value: users.reduce((sum, u) => sum + u.bookmarkCount, 0),
    },
    {
      label: "Comments",
      value: users.reduce((sum, u) => sum + u.commentCount, 0),
    },
  ];

  return (
    <>
      <AdminMetrics metrics={metrics} className="sm:grid-cols-4 lg:grid-cols-7" />

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="mb-1 font-serif text-xl text-ink-primary">No users yet</p>
          <p className="text-sm text-ink-secondary">
            Users appear here after they sign in for the first time.
          </p>
        </div>
      ) : (
        <AdminUsersTable users={users} currentUserId={currentUserId} />
      )}
    </>
  );
}
