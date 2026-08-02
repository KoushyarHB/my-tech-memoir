"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BadgeCheck } from "lucide-react";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { RolePicker } from "@/features/admin/components/role-picker";
import {
  ASSIGNABLE_ROLES,
  ROLE_LABELS,
  type UserRole,
} from "@/features/admin/types/roles";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  providers: string[];
  postCount: number;
  bookmarkCount: number;
  commentCount: number;
  translationCount: number;
};

type AdminUsersTableProps = {
  users: AdminUserRow[];
  currentUserId: string;
};

const includesString: FilterFn<AdminUserRow> = (row, columnId, filterValue) => {
  const query = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!query) return true;
  const value = row.getValue(columnId);
  return String(value ?? "")
    .toLowerCase()
    .includes(query);
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

export function AdminUsersTable({ users, currentUserId }: AdminUsersTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleRoleChange = useCallback(
    async (userId: string, role: UserRole) => {
      setPendingId(userId);
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        const json = (await res.json()) as {
          success?: boolean;
          error?: string;
        };
        if (!res.ok || !json.success) {
          throw new Error(json.error ?? "Failed to update role");
        }
        toast.success(`Role updated to ${ROLE_LABELS[role]}`, {
          description:
            "They may need to sign out and back in for it to apply.",
        });
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update role"
        );
      } finally {
        setPendingId(null);
      }
    },
    [router]
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
        id: "user",
        accessorFn: (row) => `${row.name ?? ""} ${row.bio ?? ""}`.trim(),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="User" />
        ),
        meta: { filterPlaceholder: "Search Name" },
        filterFn: includesString,
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
        meta: { filterPlaceholder: "Search Email" },
        filterFn: includesString,
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
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Sign-in" />
        ),
        meta: {
          filterVariant: "select",
          filterOptions: providerOptions,
        },
        filterFn: (row, _id, filterValue) => {
          const value = String(filterValue ?? "");
          if (!value) return true;
          return row.original.providers.includes(value);
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
        meta: { filterPlaceholder: "Search Date" },
        filterFn: (row, _id, filterValue) => {
          const query = String(filterValue ?? "")
            .trim()
            .toLowerCase();
          if (!query) return true;
          return formatDate(row.original.createdAt)
            .toLowerCase()
            .includes(query);
        },
        sortingFn: (a, b) =>
          new Date(a.original.createdAt).getTime() -
          new Date(b.original.createdAt).getTime(),
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
          filterOptions: ASSIGNABLE_ROLES.map((role) => ({
            label: ROLE_LABELS[role],
            value: role,
          })),
        },
        filterFn: (row, _id, filterValue) => {
          const value = String(filterValue ?? "");
          if (!value) return true;
          return row.original.role === value;
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
      searchPlaceholder="Search name, email, provider, role…"
      searchAriaLabel="Search users"
      emptyMessage="No users yet"
      emptyFilteredMessage="No users match your filters"
    />
  );
}
