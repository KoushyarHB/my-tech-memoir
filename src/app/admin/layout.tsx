import { requireEditor } from "@/lib/auth-guard";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { getPendingCommentCount } from "@/features/comments/server/comment-service";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireEditor();
  const pendingComments = await getPendingCommentCount();

  return (
    <AdminShell
      userName={session.user?.name ?? session.user?.email}
      userRole={session.user?.role}
      pendingComments={pendingComments}
    >
      {children}
    </AdminShell>
  );
}
