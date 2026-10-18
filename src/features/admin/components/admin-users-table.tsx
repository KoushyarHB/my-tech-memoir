"use client";

import { useCallback, useMemo } from "react";
import { BadgeCheck } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DataTable,
  DataTableColumnHeader,
  type DataTableQuery,
} from "@/components/data-table";
import { RolePicker } from "@/features/admin/components/role-picker";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/features/users/constants/roles";
import { useUserMutations } from "@/features/users/hooks/use-users";
import type { GetUserDto, UserRole } from "@/features/users/types";

export type AdminUserRow = GetUserDto;

type AdminUsersTableProps = {
  users: AdminUserRow[];
  currentUserId: string;
  query: DataTableQuery;
  onQueryChange: (patch: Partial<DataTableQuery>) => void;
  onFiltersChange: (expression: string) => void;
  totalItems: number;
  totalPages: number;
  isFetching?: boolean;
  isLoading?: boolean;
  onReload?: () => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatProvider(provider: string) {
  if (!provider) return "—";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function AdminUsersTable({
  users,
  currentUserId,
  query,
  onQueryChange,
  onFiltersChange,
  totalItems,
  totalPages,
  isFetching,
  isLoading,
  onReload,
}: AdminUsersTableProps) {
  const {
    mutate: updateRole,
    isPending: isUpdatingRole,
    variables,
  } = useUserMutations().updateRoleMutation;

  const pendingId = isUpdatingRole ? (variables?.userId ?? null) : null;

  const handleRoleChange = useCallback(
    (userId: string, role: UserRole) => {
      updateRole({ userId, role });
    },
    [updateRole]
  );

  const providerOptions = useMemo(() => {
    const set = new Set<string>();
    for (const user of users) {
      for (const provider of user.providers) {
        set.add(provider);
      }
    }
    return Array.from(set)
      .sort()
      .map((provider) => ({
        label: formatProvider(provider),
        value: provider,
      }));
  }, [users]);

  const columns = useMemo<ColumnDef<AdminUserRow>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => `${row.name ?? ""} ${row.bio ?? ""}`.trim(),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="User" />
        ),
        meta: {
          filterPlaceholder: "Search Name",
          filterField: "name",
          filterOperator: "contains",
        },
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = user.id === currentUserId;
          return (
            <div className="flex min-w-0 items-center gap-3">
              <Avatar size="sm">
                {user.image ? (
                  <AvatarImage
                    src={user.image}
                    alt={user.name ?? user.email}
                  />
                ) : null}
                <AvatarFallback>
                  {(user.name ?? user.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium text-ink-primary">
                  {user.name ?? "Unnamed"}
                  {isSelf ? (
                    <span className="ml-2 text-xs font-normal text-ink-tertiary">
                      you
                    </span>
                  ) : null}
                </p>
                {user.bio ? (
                  <p className="truncate text-xs text-ink-tertiary">{user.bio}</p>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        meta: {
          filterPlaceholder: "Search Email",
          filterField: "email",
          filterOperator: "contains",
        },
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm text-ink-secondary">
              {row.original.email}
            </p>
            {row.original.emailVerified ? (
              <BadgeCheck
                className="size-3.5 shrink-0 text-ink-tertiary"
                aria-label="Email verified"
              />
            ) : null}
          </div>
        ),
      },
      {
        id: "providers",
        accessorFn: (row) => row.providers.join(", "),
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Sign-in" />
        ),
        meta: {
          filterVariant: "select",
          filterField: "provider",
          filterOperator: "eq",
          filterOptions: providerOptions,
        },
        cell: ({ row }) => (
          <span className="text-sm text-ink-secondary">
            {row.original.providers.length > 0
              ? row.original.providers.map(formatProvider).join(", ")
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Joined" />
        ),
        meta: {
          filterPlaceholder: "From YYYY-MM-DD",
          filterField: "createdAt",
          filterOperator: "gte",
        },
        cell: ({ row }) => (
          <span className="text-sm text-ink-secondary">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "postCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Posts" />
        ),
        enableColumnFilter: false,
        meta: { align: "center" },
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-ink-secondary">
            {row.original.postCount.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "bookmarkCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Bookmarks" />
        ),
        enableColumnFilter: false,
        meta: { align: "center" },
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-ink-secondary">
            {row.original.bookmarkCount.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "commentCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Comments" />
        ),
        enableColumnFilter: false,
        meta: { align: "center" },
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-ink-secondary">
            {row.original.commentCount.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "role",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Role" />
        ),
        meta: {
          filterVariant: "select",
          filterField: "role",
          filterOperator: "eq",
          filterOptions: ASSIGNABLE_ROLES.map((role) => ({
            label: ROLE_LABELS[role],
            value: role,
          })),
        },
        cell: ({ row }) => (
          <RolePicker
            value={row.original.role}
            disabled={pendingId === row.original.id}
            onChange={(role) => void handleRoleChange(row.original.id, role)}
          />
        ),
      },
    ],
    [currentUserId, handleRoleChange, pendingId, providerOptions]
  );

  return (
    <DataTable
      columns={columns}
      data={users}
      getRowId={(row) => row.id}
      title="All users"
      searchPlaceholder="Search name, email, bio…"
      searchAriaLabel="Search users"
      emptyMessage="No users yet"
      emptyFilteredMessage="No users match your filters"
      query={query}
      onQueryChange={onQueryChange}
      onFiltersChange={onFiltersChange}
      totalItems={totalItems}
      totalPages={totalPages}
      isFetching={isFetching}
      isLoading={isLoading}
      onReload={onReload}
    />
  );
}
