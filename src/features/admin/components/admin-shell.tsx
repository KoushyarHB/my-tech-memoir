"use client";

import { useSyncExternalStore, useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

type AdminShellProps = {
  userName?: string | null;
  userRole?: string | null;
  children: React.ReactNode;
};

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(onStoreChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function getServerDesktopSnapshot() {
  return true;
}

export function AdminShell({ userName, userRole, children }: AdminShellProps) {
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getServerDesktopSnapshot
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleSidebar() {
    if (isDesktop) {
      setSidebarCollapsed((prev) => !prev);
      return;
    }
    setMobileOpen((prev) => !prev);
  }

  const sidebarOpen = isDesktop ? !sidebarCollapsed : mobileOpen;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-ink-primary lg:flex">
      <AdminSidebar
        userName={userName}
        isAdmin={userRole === "ADMIN"}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        onExpand={() => setSidebarCollapsed(false)}
      />
      <div className="min-w-0 flex-1">
        <AdminTopbar
          userName={userName}
          sidebarOpen={sidebarOpen}
          showSidebarToggle={!isDesktop || !sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />
        <main className="min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
