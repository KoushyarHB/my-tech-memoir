"use client";

import { useTheme } from "@/components/theme";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
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

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
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

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div
        className="fixed top-3 right-3 z-50 sm:top-4 sm:right-4"
        aria-hidden="true"
      >
        <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full border border-transparent" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="fixed top-3 right-3 z-50 sm:top-4 sm:right-4">
      <button
        type="button"
        onClick={toggleTheme}
        className="w-8 h-8 sm:w-11 sm:h-11 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? (
          <SunIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <MoonIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </button>
    </div>
  );
}
