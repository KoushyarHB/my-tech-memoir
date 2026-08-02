"use client";

import { Moon, PanelLeft, PanelLeftClose, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme";

type AdminTopbarProps = {
  userName?: string | null;
  sidebarOpen: boolean;
  showSidebarToggle?: boolean;
  onToggleSidebar: () => void;
};

export function AdminTopbar({
  userName,
  sidebarOpen,
  showSidebarToggle = true,
  onToggleSidebar,
}: AdminTopbarProps) {
  const { resolvedTheme, toggleTheme, mounted } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between gap-3 border-b border-border bg-(--bg-overlay) px-4 backdrop-blur-xl lg:h-14 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {showSidebarToggle ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="shrink-0"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeft className="size-4" />
            )}
          </Button>
        ) : null}
        <p className="truncate text-sm text-ink-secondary">
          Welcome
          {userName ? (
            <>
              ,{" "}
              <span className="font-medium text-ink-primary">{userName}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!mounted ? (
          <div className="size-8" aria-hidden="true" />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            title={isDark ? "Light theme" : "Dark theme"}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        )}
      </div>
    </header>
  );
}
