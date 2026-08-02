import { requireEditor } from "@/lib/auth-guard";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireEditor();

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-ink-primary lg:flex">
      <AdminSidebar userName={session.user?.name ?? session.user?.email} />
      <div className="min-w-0 flex-1">
        <header className="hidden border-b border-[var(--border)] bg-[var(--bg-overlay)] px-6 py-4 backdrop-blur-xl lg:block">
          <p className="text-sm text-ink-secondary">
            Welcome
            {session.user?.name ? (
              <>
                ,{" "}
                <span className="font-medium text-ink-primary">
                  {session.user.name}
                </span>
              </>
            ) : null}
          </p>
        </header>
        <main className="min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
