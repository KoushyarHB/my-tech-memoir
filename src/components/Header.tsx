"use client";

import Link from "next/link";
import { useTheme } from "@/components/theme";

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
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
      width="16"
      height="16"
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
  const isDark = resolvedTheme === "dark";

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--bg-raised)",
      }}
    >
      <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
        {/* Logotype — serif */}
        <Link
          href="/"
          className="group flex flex-col gap-0"
          style={{ textDecoration: "none" }}
        >
          <span
            className="font-serif text-lg font-semibold leading-tight tracking-tight transition-colors"
            style={{ color: "var(--ink-primary)" }}
          >
            My Tech Memoir
          </span>
          <span
            className="text-xs font-sans font-normal tracking-wide uppercase leading-none transition-colors"
            style={{ color: "var(--accent)", letterSpacing: "0.1em" }}
          >
            Networking &amp; Protocols
          </span>
        </Link>

        {/* Theme toggle */}
        {mounted ? (
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150 hover:scale-105 active:scale-95"
            style={{
              color: "var(--ink-secondary)",
              backgroundColor: "var(--bg-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        ) : (
          /* SSR placeholder — same size, invisible */
          <div className="w-8 h-8" aria-hidden="true" />
        )}
      </div>
    </header>
  );
}
