import { requireAdmin } from "@/lib/auth-guard";
import { getUsersPage, getUserStats } from "@/features/users/server/user-service";
import { AdminUsersView } from "@/features/admin/components/admin-users-view";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requireAdmin();

  const [users, stats] = await Promise.all([
    getUsersPage({ page: 1, pageSize: DEFAULT_PAGE_SIZE }),
    getUserStats(),
  ]);

  return (
    <div className="px-5 py-8 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-tertiary">
          Access
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-ink-primary">
          Users
        </h1>
        <p className="mt-1 max-w-xl text-sm text-ink-secondary">
          Everything we know about each account from sign-in and site activity.
        </p>
      </div>

      <AdminUsersView
        users={users.items}
        stats={stats}
        currentUserId={session.user.id}
      />
    </div>
  );
}
