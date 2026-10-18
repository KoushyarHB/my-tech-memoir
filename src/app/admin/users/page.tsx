import { requireAdmin } from "@/lib/auth-guard";
import { listUsers } from "@/features/admin/server/user-service";
import { AdminUsersView } from "@/features/admin/components/admin-users-view";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const users = await listUsers();

  const tableUsers = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    bio: user.bio,
    role: user.role,
    emailVerified: Boolean(user.emailVerified),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    providers: user.providers,
    postCount: user.postCount,
    bookmarkCount: user.bookmarkCount,
    commentCount: user.commentCount,
    translationCount: user.translationCount,
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
          Everything we know about each account from sign-in and site activity.
        </p>
      </div>

      <AdminUsersView users={tableUsers} currentUserId={session.user.id} />
    </div>
  );
}
