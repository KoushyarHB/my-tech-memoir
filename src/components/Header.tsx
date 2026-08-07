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
  Menu as MenuIcon,
  Moon,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDark = resolvedTheme === "dark";
  const isAuthenticated = status === "authenticated";
  const user = session?.user;
  const showDashboard = canAccessDashboard(user?.role);
  const aboutActive = pathname === "/about" || pathname.startsWith("/about/");

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <header
      className="sticky top-0 z-50 border-b border-border backdrop-blur-xl transition-colors"
      style={{
        backgroundColor: isDark
          ? "rgba(18, 18, 18, 0.88)"
          : "var(--bg-overlay)",
      }}
    >
      <div className="relative mx-auto flex h-14 max-w-2xl items-center gap-3 px-5">
        <Link
          href="/"
          className="shrink-0 font-serif text-[1.05rem] font-semibold tracking-tight text-ink-primary no-underline transition-opacity hover:opacity-80"
          onClick={() => setMobileOpen(false)}
        >
          {tHome("title")}
        </Link>

        <nav
          className="ml-1 hidden items-center gap-0.5 sm:flex"
          aria-label="Primary"
        >
          <Link
            href="/about"
            className={cn(
              "rounded-md px-2.5 py-1.5 text-sm transition-colors",
              aboutActive
                ? "font-medium text-ink-primary"
                : "text-ink-secondary hover:text-ink-primary"
            )}
          >
            {t("about")}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-0.5">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

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

          <Button
            variant="ghost"
            size="icon"
            className="text-ink-secondary sm:hidden"
            aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <X className="size-4" />
            ) : (
              <MenuIcon className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="sm:hidden">
          <button
            type="button"
            className="fixed inset-0 top-14 z-40 bg-black/35"
            aria-label={t("closeMenu")}
            onClick={() => setMobileOpen(false)}
          />
          <nav
            id="mobile-nav"
            aria-label="Mobile"
            className="absolute inset-x-0 top-full z-50 border-b border-border px-3 py-3 shadow-(--shadow-lg)"
            style={{
              backgroundColor: isDark
                ? "rgba(18, 18, 18, 0.96)"
                : "var(--bg-elevated)",
            }}
          >
            <div className="mx-auto flex max-w-2xl flex-col gap-0.5">
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm transition-colors",
                  aboutActive
                    ? "bg-(--bg-muted) font-medium text-ink-primary"
                    : "text-ink-secondary hover:bg-(--bg-muted)/70 hover:text-ink-primary"
                )}
              >
                {t("about")}
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    href="/bookmarks"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-ink-secondary transition-colors hover:bg-(--bg-muted)/70 hover:text-ink-primary"
                  >
                    <Bookmark className="size-3.5 opacity-70" />
                    {t("bookmarks")}
                  </Link>
                  {showDashboard ? (
                    <a
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-ink-secondary transition-colors hover:bg-(--bg-muted)/70 hover:text-ink-primary"
                    >
                      <LayoutDashboard className="size-3.5 opacity-70" />
                      {t("dashboard")}
                    </a>
                  ) : null}
                </>
              ) : null}

              <div className="mt-2 flex items-center justify-between border-t border-border px-1 pt-3">
                <span className="text-xs text-ink-tertiary">{t("language")}</span>
                <LanguageSwitcher />
              </div>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
