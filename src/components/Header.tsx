"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "@/components/theme";

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export default function Header() {
  const { resolvedTheme, toggleTheme, mounted } = useTheme();
  const { data: session, status } = useSession();
  const isDark = resolvedTheme === "dark";
  const isAuthenticated = status === "authenticated";

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl transition-all duration-300"
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: isDark
          ? "rgba(18, 18, 18, 0.85)"
          : "rgba(250, 250, 250, 0.85)",
      }}
    >
      <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
        {/* Logotype */}
        <Link
          href="/"
          className="group flex items-baseline gap-3"
          style={{ textDecoration: "none" }}
        >
          <span
            className="font-serif text-lg font-semibold leading-tight tracking-tight transition-colors duration-200"
            style={{ color: "var(--ink-primary)" }}
          >
            My Tech Memoir
          </span>
        </Link>

        {/* Right side: auth + theme */}
        <div className="flex items-center gap-2">
          {/* Auth */}
          {!mounted ? (
            <div className="w-8 h-8" aria-hidden="true" />
          ) : isAuthenticated && session?.user ? (
            <>
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name ?? "User avatar"}
                  className="w-7 h-7 rounded-full"
                />
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-xs px-2.5 py-1 rounded-md transition-all duration-150 hover:opacity-80 active:scale-95"
                style={{
                  color: "var(--ink-secondary)",
                  backgroundColor: "var(--bg-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => signIn()}
              className="text-xs px-2.5 py-1 rounded-md transition-all duration-150 hover:opacity-80 active:scale-95"
              style={{
                color: "var(--ink-inverse)",
                backgroundColor: "var(--accent)",
                border: "1px solid var(--accent)",
              }}
            >
              Sign in
            </button>
          )}

          {/* Theme toggle */}
          {mounted ? (
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                color: "var(--ink-secondary)",
              }}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          ) : (
            <div className="w-8 h-8" aria-hidden="true" />
          )}
        </div>
      </div>
    </header>
  );
}
