"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SearchOverlay } from "@/components/search-overlay";

type AppShellProps = {
  children: ReactNode;
};

function subscribeToSidebarState(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("still:sidebar-toggle", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("still:sidebar-toggle", callback);
  };
}

function getSidebarSnapshot() {
  try {
    return localStorage.getItem("still:sidebar-collapsed") === "true";
  } catch {
    return false;
  }
}

function getSidebarServerSnapshot() {
  return false;
}

export function AppShell({ children }: AppShellProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isSidebarCollapsed = useSyncExternalStore(
    subscribeToSidebarState,
    getSidebarSnapshot,
    getSidebarServerSnapshot,
  );

  function handleToggleCollapse() {
    const next = !getSidebarSnapshot();
    try {
      localStorage.setItem("still:sidebar-collapsed", String(next));
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event("still:sidebar-toggle"));
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen((open) => !open);
      } else if (
        event.key === "/" &&
        !(
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          (event.target as HTMLElement)?.isContentEditable
        )
      ) {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    }

    function handleOpenSearch() {
      setIsSearchOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("still:open-search", handleOpenSearch);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("still:open-search", handleOpenSearch);
    };
  }, []);

  return (
    <div
      className={`app-frame${isSidebarCollapsed ? " is-sidebar-collapsed" : ""}`}
    >
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleCollapse={handleToggleCollapse}
      />

      <div className="workspace">
        <main className="main-content">{children}</main>
      </div>

      <MobileBottomNav onOpenSearch={() => setIsSearchOpen(true)} />

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
