"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  FileText,
  LayoutDashboard,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  Tags,
  File,
  Palette,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/tags", label: "Tags", icon: Tags },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/pages", label: "Pages", icon: File },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
] as const;

const SYSTEM_NAV = [
  { href: "/admin/appearance", label: "Appearance", icon: Palette },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AdminSidebarProps = {
  userName?: string | null;
};

export function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navLink = (
    href: string,
    label: string,
    Icon: (typeof MAIN_NAV)[number]["icon"],
    exact?: boolean
  ) => {
    const active = isActive(pathname, href, exact);
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
          active
            ? "bg-[var(--bg-muted)] font-medium text-ink-primary"
            : "text-ink-secondary hover:bg-[var(--bg-muted)]/70 hover:text-ink-primary"
        )}
      >
        <Icon className="size-4 shrink-0 opacity-80" />
        {label}
      </Link>
    );
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--border)] px-4 py-5">
        <Link
          href="/admin"
          onClick={() => setOpen(false)}
          className="font-serif text-lg font-semibold tracking-tight text-ink-primary"
        >
          My Tech Memoir
        </Link>
        <p className="mt-1 text-xs text-ink-tertiary">Admin</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {MAIN_NAV.map((item) =>
            navLink(item.href, item.label, item.icon, "exact" in item ? item.exact : false)
          )}
        </div>

        <div>
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-tertiary">
            System
          </p>
          <div className="space-y-1">
            {SYSTEM_NAV.map((item) => navLink(item.href, item.label, item.icon))}
          </div>
        </div>
      </nav>

      <div className="space-y-2 border-t border-[var(--border)] p-3">
        <Link
          href="/admin/new"
          onClick={() => setOpen(false)}
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-full")}
        >
          <Plus className="size-4" />
          New post
        </Link>
        <Link
          href="/blog"
          onClick={() => setOpen(false)}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-full text-ink-secondary"
          )}
        >
          View site
          <ArrowUpRight className="size-3.5" />
        </Link>
        {userName ? (
          <p className="truncate px-1 pt-1 text-xs text-ink-tertiary">{userName}</p>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-overlay)] px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex size-8 items-center justify-center rounded-md text-ink-secondary hover:bg-[var(--bg-muted)] hover:text-ink-primary"
          aria-label="Open menu"
        >
          <Menu className="size-4" />
        </button>
        <span className="font-serif text-base font-semibold text-ink-primary">
          My Tech Memoir
        </span>
      </div>

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-[var(--border)] bg-[var(--bg-elevated)] lg:block">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-72 max-w-[85vw] bg-[var(--bg-elevated)] shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-md text-ink-secondary hover:bg-[var(--bg-muted)]"
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}
    </>
  );
}
