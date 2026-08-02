import { requireEditor } from "@/lib/auth-guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireEditor();

  return <div className="min-h-screen bg-background">{children}</div>;
}
