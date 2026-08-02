"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BadgeCheck, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { RolePicker } from "@/features/admin/components/role-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
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
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;

    return users.filter((user) => {
      const haystack = [
        user.name ?? "",
        user.email,
        user.bio ?? "",
        ROLE_LABELS[user.role],
        user.role,
        ...user.providers,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, query]);

  async function handleRoleChange(userId: string, role: UserRole) {
    setPendingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to update role");
      }
      toast.success(`Role updated to ${ROLE_LABELS[role]}`, {
        description: "They may need to sign out and back in for it to apply.",
      });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update role"
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-tertiary" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="mb-1 font-medium text-ink-primary">
            No users match your search.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-2 text-xs text-ink-secondary underline-offset-2 hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="min-w-48 px-3">User</TableHead>
                <TableHead className="min-w-48 px-3">Email</TableHead>
                <TableHead className="min-w-24 px-3">Sign-in</TableHead>
                <TableHead className="min-w-28 px-3">Joined</TableHead>
                <TableHead className="min-w-16 px-3 text-right">Posts</TableHead>
                <TableHead className="min-w-20 px-3 text-right">Bookmarks</TableHead>
                <TableHead className="min-w-20 px-3 text-right">Comments</TableHead>
                <TableHead className="min-w-36 px-3">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const isSelf = user.id === currentUserId;
                const busy = pendingId === user.id;

                return (
                  <TableRow
                    key={user.id}
                    className="border-border hover:bg-(--bg-muted)/60"
                  >
                    <TableCell className="px-3 py-3.5">
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
                            <p className="truncate text-xs text-ink-tertiary">
                              {user.bio}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3.5">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-sm text-ink-secondary">
                          {user.email}
                        </p>
                        {user.emailVerified ? (
                          <BadgeCheck
                            className="size-3.5 shrink-0 text-ink-tertiary"
                            aria-label="Email verified"
                          />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3.5 text-sm text-ink-secondary">
                      {user.providers.length > 0
                        ? user.providers.map(formatProvider).join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="px-3 py-3.5 text-sm text-ink-secondary">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="px-3 py-3.5 text-right text-sm tabular-nums text-ink-secondary">
                      {user.postCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="px-3 py-3.5 text-right text-sm tabular-nums text-ink-secondary">
                      {user.bookmarkCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="px-3 py-3.5 text-right text-sm tabular-nums text-ink-secondary">
                      {user.commentCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="px-3 py-3.5">
                      <RolePicker
                        value={user.role}
                        disabled={busy}
                        onChange={(role) =>
                          void handleRoleChange(user.id, role)
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
