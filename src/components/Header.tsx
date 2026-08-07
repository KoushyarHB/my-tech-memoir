"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter as useNextRouter } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import {
  Bookmark,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";
import { useTheme } from "@/components/theme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import LanguageSwitcher from "@/components/language-switcher";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const menuItemClass = cn(
  "flex w-full cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none select-none",
  "text-ink-secondary data-highlighted:bg-(--bg-muted) data-highlighted:text-ink-primary"
);

function canAccessDashboard(role?: string | null) {
  return role === "EDITOR" || role === "ADMIN";
}

export default function Header() {
  const { resolvedTheme, toggleTheme, mounted } = useTheme();
  const { data: session, status } = useSession();
  const t = useTranslations("common");
  const tHome = useTranslations("home");
  const pathname = usePathname();
  const router = useRouter();
  const nextRouter = useNextRouter();

  const isDark = resolvedTheme === "dark";
  const isAuthenticated = status === "authenticated";
  const user = session?.user;
  const showDashboard = canAccessDashboard(user?.role);
  const aboutActive = pathname === "/about" || pathname.startsWith("/about/");

  return (
    <header
      className="sticky top-0 z-50 border-b border-border backdrop-blur-xl transition-colors"
      style={{
        backgroundColor: isDark
          ? "rgba(18, 18, 18, 0.88)"
          : "var(--bg-overlay)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4 sm:gap-3 sm:px-5">
        <Link
          href="/"
          className="shrink-0 font-serif text-[1.05rem] font-semibold tracking-tight text-ink-primary no-underline transition-opacity hover:opacity-80"
        >
          {tHome("title")}
        </Link>

        <nav className="ml-1 flex items-center" aria-label="Primary">
          <Link
            href="/about"
            className={cn(
              "rounded-md px-2 py-1.5 text-sm transition-colors sm:px-2.5",
              aboutActive
                ? "font-medium text-ink-primary"
                : "text-ink-secondary hover:text-ink-primary"
            )}
          >
            {t("about")}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-0.5">
          <LanguageSwitcher />

          {mounted ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={isDark ? t("theme.light") : t("theme.dark")}
              title={isDark ? t("theme.light") : t("theme.dark")}
              className="text-ink-secondary"
            >
              {isDark ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
          ) : (
            <div className="size-8" aria-hidden />
          )}

          {isAuthenticated && user ? (
            <Menu.Root>
              <Menu.Trigger
                className={cn(
                  "ml-1 inline-flex items-center gap-1.5 rounded-full py-0.5 pr-1.5 pl-0.5 transition-colors",
                  "hover:bg-(--bg-muted) data-popup-open:bg-(--bg-muted)",
                  "outline-none"
                )}
                aria-label={t("account")}
              >
                <Avatar size="sm">
                  {user.image ? (
                    <AvatarImage
                      src={user.image}
                      alt={user.name ?? "User avatar"}
                    />
                  ) : null}
                  <AvatarFallback>
                    {user.name?.charAt(0).toUpperCase() ?? (
                      <UserRound className="size-3" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="size-3.5 text-ink-tertiary" />
              </Menu.Trigger>

              <Menu.Portal>
                <Menu.Positioner
                  side="bottom"
                  align="end"
                  sideOffset={8}
                  className="isolate z-50 outline-none"
                >
                  <Menu.Popup
                    className={cn(
                      "w-56 origin-(--transform-origin) overflow-hidden rounded-xl border border-border bg-(--bg-elevated) p-1 shadow-(--shadow-lg)",
                      "outline-none"
                    )}
                    style={{ outline: "none" }}
                  >
                    <div className="border-b border-border px-2.5 py-2.5">
                      <p className="truncate text-sm font-medium text-ink-primary">
                        {user.name ?? t("account")}
                      </p>
                      {user.email ? (
                        <p className="truncate text-xs text-ink-tertiary">
                          {user.email}
                        </p>
                      ) : null}
                    </div>

                    <div className="py-1">
                      <Menu.Item
                        closeOnClick
                        label={t("bookmarks")}
                        onClick={() => router.push("/bookmarks")}
                        className={menuItemClass}
                      >
                        <Bookmark className="size-3.5 opacity-70" />
                        {t("bookmarks")}
                      </Menu.Item>

                      {showDashboard ? (
                        <Menu.Item
                          closeOnClick
                          label={t("dashboard")}
                          onClick={() => nextRouter.push("/admin")}
                          className={menuItemClass}
                        >
                          <LayoutDashboard className="size-3.5 opacity-70" />
                          {t("dashboard")}
                        </Menu.Item>
                      ) : null}
                    </div>

                    <div className="border-t border-border py-1">
                      <Menu.Item
                        closeOnClick
                        label={t("signOut")}
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className={menuItemClass}
                      >
                        <LogOut className="size-3.5 opacity-70" />
                        {t("signOut")}
                      </Menu.Item>
                    </div>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          ) : status !== "loading" ? (
            <Link
              href="/signin"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "ml-1"
              )}
            >
              <LogIn className="size-3.5" />
              <span className="hidden sm:inline">{t("signIn")}</span>
            </Link>
          ) : (
            <div className="ml-1 size-8" aria-hidden />
          )}
        </div>
      </div>
    </header>
  );
}
