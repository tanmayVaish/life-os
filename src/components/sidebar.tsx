"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";
import { QuickCapture } from "@/components/quick-capture";

type NavigationItem = {
  label: string;
  icon: IconName;
  href: string;
};

const navigationItems: NavigationItem[] = [
  { label: "Home", icon: "dashboard", href: "/" },
  { label: "Tasks", icon: "task", href: "/tasks" },
  { label: "Projects", icon: "project", href: "/projects" },
  { label: "Journal", icon: "journal", href: "/journal" },
  { label: "Goals", icon: "goal", href: "/goals" },
  { label: "Finance", icon: "finance", href: "/finance" },
  { label: "People", icon: "people", href: "/people" },
  { label: "Wishlist", icon: "wishlist", href: "/wishlist" },
  { label: "Search", icon: "search", href: "/search" },
];

export function BrandMark() {
  return (
    <span aria-hidden="true" className="brand-mark">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

export function NavigationLinks({
  isCollapsed,
  onOpenSearch,
}: {
  isCollapsed?: boolean;
  onOpenSearch?: () => void;
}) {
  const pathname = usePathname();

  return (
    <ul className="sidebar-nav-list">
      {navigationItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <li key={item.label}>
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`nav-link${isActive ? " nav-link-active" : ""}`}
              href={item.href}
              title={item.label}
            >
              <Icon name={item.icon} />
              <span className="nav-link-label">{item.label}</span>
              {item.label === "Search" && !isCollapsed && (
                <kbd
                  className="sidebar-kbd"
                  onClick={(event) => {
                    if (onOpenSearch) {
                      event.preventDefault();
                      event.stopPropagation();
                      onOpenSearch();
                    }
                  }}
                  role="button"
                  tabIndex={-1}
                  title="Press ⌘K to open search overlay"
                >
                  ⌘K
                </kbd>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

type SidebarProps = {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenSearch?: () => void;
};

export function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  onOpenSearch,
}: SidebarProps) {
  const pathname = usePathname();
  const isSettingsActive =
    pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <aside
      aria-label="Main sidebar"
      className={`sidebar${isCollapsed ? " is-collapsed" : ""}`}
    >
      <div className="sidebar-brand-wrapper">
        <Link aria-label="Still home" className="brand" href="/">
          <BrandMark />
          <span className="brand-name">still</span>
        </Link>
        {onToggleCollapse && (
          <button
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="sidebar-collapse-toggle"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            type="button"
          >
            <Icon
              className={`collapse-icon${isCollapsed ? " is-rotated" : ""}`}
              name="chevron"
            />
          </button>
        )}
      </div>

      <div className="sidebar-label">YOUR SPACE</div>
      <nav aria-label="Primary navigation" className="sidebar-nav">
        <NavigationLinks
          isCollapsed={isCollapsed}
          onOpenSearch={onOpenSearch}
        />
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-quick-capture">
          <QuickCapture />
        </div>

        <Link
          aria-current={isSettingsActive ? "page" : undefined}
          className={`nav-link settings-nav-link${isSettingsActive ? " nav-link-active" : ""}`}
          href="/settings"
          title="Settings"
        >
          <Icon name="settings" />
          <span className="nav-link-label">Settings</span>
        </Link>

        <div className="sidebar-note">
          <span className="status-dot" />
          <span className="sidebar-note-text">Made for your own pace.</span>
        </div>
        <div className="sidebar-version">PERSONAL OS&nbsp; · &nbsp;01</div>
      </div>
    </aside>
  );
}
