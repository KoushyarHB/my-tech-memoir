"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/components/theme";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sun, Moon, LogOut, LogIn, Bookmark } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/language-switcher";

export default function Header() {
  const { resolvedTheme, toggleTheme, mounted } = useTheme();
  const { data: session, status } = useSession();
  const tCommon = useTranslations("common");
  const tHome = useTranslations("home");
  const isDark = resolvedTheme === "dark";
  const isAuthenticated = status === "authenticated";

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl transition-all duration-300"
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: isDark
          ? "rgba(18, 18, 18, 0.85)"
          : "var(--bg-overlay)",
      }}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="group flex items-baseline gap-3 no-underline"
        >
          <span className="font-serif text-lg font-semibold leading-tight tracking-tight text-ink-primary transition-colors duration-200">
            {tHome("title")}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />

          {!mounted ? (
            <div className="size-8" aria-hidden="true" />
          ) : isAuthenticated && session?.user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/bookmarks"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                aria-label={tCommon("bookmarks")}
                title={tCommon("bookmarks")}
              >
                <Bookmark className="size-4" />
              </Link>
              <Avatar size="sm">
                {session.user.image ? (
                  <AvatarImage
                    src={session.user.image}
                    alt={session.user.name ?? "User avatar"}
                  />
                ) : null}
                <AvatarFallback>
                  {session.user.name?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="size-3.5" />
                {tCommon("signOut")}
              </Button>
            </div>
          ) : (
            <Link
              href="/signin"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              <LogIn className="size-3.5" />
              {tCommon("signIn")}
            </Link>
          )}

          {mounted ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={isDark ? tCommon("theme.light") : tCommon("theme.dark")}
              title={isDark ? tCommon("theme.light") : tCommon("theme.dark")}
            >
              {isDark ? <Sun /> : <Moon />}
            </Button>
          ) : (
            <div className="size-8" aria-hidden="true" />
          )}
        </div>
      </div>
    </header>
  );
}
