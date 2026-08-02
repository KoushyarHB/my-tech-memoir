"use client";

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
  Users,
  X,
  Plus,
  PanelLeft,
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

const ADMIN_NAV = [
  { href: "/admin/users", label: "Users", icon: Users },
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
  isAdmin?: boolean;
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onExpand: () => void;
};

export function AdminSidebar({
  userName,
  isAdmin = false,
  collapsed,
  mobileOpen,
  onMobileOpenChange,
  onExpand,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const navLink = (
    href: string,
    label: string,
    Icon: (typeof MAIN_NAV)[number]["icon"],
    exact?: boolean,
    iconOnly?: boolean
  ) => {
    const active = isActive(pathname, href, exact);
    return (
      <Link
        key={href}
        href={href}
        onClick={() => onMobileOpenChange(false)}
        title={iconOnly ? label : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
          iconOnly && "justify-center px-2",
          active
            ? "bg-[var(--bg-muted)] font-medium text-ink-primary"
            : "text-ink-secondary hover:bg-[var(--bg-muted)]/70 hover:text-ink-primary"
        )}
      >
        <Icon className="size-4 shrink-0 opacity-80" />
        {!iconOnly ? label : null}
      </Link>
    );
  };

  const sidebar = (iconOnly = false) => (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-12 shrink-0 items-center border-b border-[var(--border)] lg:h-14",
          iconOnly ? "justify-center px-2" : "flex-col justify-center px-4"
        )}
      >
        {iconOnly ? (
          <button
            type="button"
            onClick={onExpand}
            className="flex size-8 items-center justify-center rounded-lg text-ink-secondary hover:bg-[var(--bg-muted)] hover:text-ink-primary"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeft className="size-4" />
          </button>
        ) : (
          <>
            <Link
              href="/admin"
              onClick={() => onMobileOpenChange(false)}
              className="font-serif text-lg font-semibold leading-tight tracking-tight text-ink-primary"
            >
              My Tech Memoir
            </Link>
            <p className="mt-0.5 text-xs text-ink-tertiary">Admin</p>
          </>
        )}
      </div>

      <nav
        className={cn(
          "flex-1 space-y-6 overflow-y-auto py-4",
          iconOnly ? "px-2" : "px-3"
        )}
      >
        <div className="space-y-1">
          {MAIN_NAV.map((item) =>
            navLink(
              item.href,
              item.label,
              item.icon,
              "exact" in item ? item.exact : false,
              iconOnly
            )
          )}
          {isAdmin
            ? ADMIN_NAV.map((item) =>
                navLink(item.href, item.label, item.icon, false, iconOnly)
              )
            : null}
        </div>

        <div>
          {!iconOnly ? (
            <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-tertiary">
              System
            </p>
          ) : null}
          <div className="space-y-1">
            {SYSTEM_NAV.map((item) =>
              navLink(item.href, item.label, item.icon, false, iconOnly)
            )}
          </div>
        </div>
      </nav>

      <div
        className={cn(
          "space-y-2 border-t border-[var(--border)]",
          iconOnly ? "p-2" : "p-3"
        )}
      >
        <Link
          href="/admin/new"
          onClick={() => onMobileOpenChange(false)}
          title={iconOnly ? "New post" : undefined}
          className={cn(
            buttonVariants({ variant: "default", size: iconOnly ? "icon" : "sm" }),
            !iconOnly && "w-full"
          )}
        >
          <Plus className="size-4" />
          {!iconOnly ? "New post" : null}
        </Link>
        <Link
          href="/blog"
          onClick={() => onMobileOpenChange(false)}
          title={iconOnly ? "View site" : undefined}
          className={cn(
            buttonVariants({ variant: "ghost", size: iconOnly ? "icon" : "sm" }),
            !iconOnly && "w-full text-ink-secondary",
            iconOnly && "text-ink-secondary"
          )}
        >
          {iconOnly ? (
            <ArrowUpRight className="size-4" />
          ) : (
            <>
              View site
              <ArrowUpRight className="size-3.5" />
            </>
          )}
        </Link>
        {!iconOnly && userName ? (
          <p className="truncate px-1 pt-1 text-xs text-ink-tertiary">{userName}</p>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-[var(--border)] bg-[var(--bg-elevated)] transition-[width] duration-200 lg:block",
          collapsed ? "w-14" : "w-60"
        )}
      >
        {sidebar(collapsed)}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => onMobileOpenChange(false)}
          />
          <aside className="relative h-full w-72 max-w-[85vw] bg-[var(--bg-elevated)] shadow-xl">
            <button
              type="button"
              onClick={() => onMobileOpenChange(false)}
              className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-md text-ink-secondary hover:bg-[var(--bg-muted)]"
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
            {sidebar(false)}
          </aside>
        </div>
      ) : null}
    </>
  );
}
