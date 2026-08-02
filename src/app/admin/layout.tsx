import { requireEditor } from "@/lib/auth-guard";
import { AdminShell } from "@/features/admin/components/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireEditor();

  return (
    <AdminShell
      userName={session.user?.name ?? session.user?.email}
      userRole={session.user?.role}
    >
      {children}
    </AdminShell>
  );
}
