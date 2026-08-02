import { requireAdmin } from "@/lib/auth-guard";
import { listUsers } from "@/features/admin/server/user-service";
import { ROLE_LABELS } from "@/features/admin/types/roles";
import { AdminUsersTable } from "@/features/admin/components/admin-users-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const users = await listUsers();

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
  ];

  const tableUsers = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }));

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
          View everyone with an account and promote them to Writer or Admin.
          Readers are the default role after sign-in.
        </p>
      </div>

      <dl className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-[var(--bg-elevated)] px-4 py-4 sm:px-5"
          >
            <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-tertiary">
              {metric.label}
            </dt>
            <dd className="mt-2 font-serif text-2xl font-semibold tabular-nums text-ink-primary">
              {metric.value.toLocaleString()}
            </dd>
          </div>
        ))}
      </dl>

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
          <p className="mb-1 font-serif text-xl text-ink-primary">No users yet</p>
          <p className="text-sm text-ink-secondary">
            Users appear here after they sign in for the first time.
          </p>
        </div>
      ) : (
        <AdminUsersTable users={tableUsers} currentUserId={session.user.id} />
      )}
    </div>
  );
}
