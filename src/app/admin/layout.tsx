import Link from "next/link";
import { requireEditor } from "@/lib/auth-guard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireEditor();

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-ink-primary">
      <header
        className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-overlay)] backdrop-blur-xl"
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-serif text-lg font-semibold tracking-tight text-ink-primary">
              My Tech Memoir
            </Link>
            <nav className="hidden items-center gap-1 text-sm sm:flex">
              <Link
                href="/admin"
                className="rounded-md px-2.5 py-1.5 text-ink-secondary transition-colors hover:bg-[var(--bg-muted)] hover:text-ink-primary"
              >
                Posts
              </Link>
              <Link
                href="/admin/new"
                className="rounded-md px-2.5 py-1.5 text-ink-secondary transition-colors hover:bg-[var(--bg-muted)] hover:text-ink-primary"
              >
                New post
              </Link>
            </nav>
          </div>
          <Link
            href="/blog"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-ink-secondary"
            )}
          >
            View site
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
