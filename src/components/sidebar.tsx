"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";

type NavigationItem = {
  label: string;
  icon: IconName;
  href?: string;
};

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/" },
  { label: "Tasks", icon: "task", href: "/tasks" },
  { label: "Projects", icon: "project", href: "/projects" },
  { label: "Journal", icon: "journal", href: "/journal" },
  { label: "Goals", icon: "goal", href: "/goals" },
  { label: "Finance", icon: "finance", href: "/finance" },
  { label: "People", icon: "people", href: "/people" },
  { label: "Wishlist", icon: "wishlist", href: "/wishlist" },
  { label: "Settings", icon: "settings", href: "/settings" },
];

export function NavigationLinks() {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {navigationItems.map((item) => (
        <li key={item.label}>
          {item.href ? (
            <Link
              aria-current={pathname === item.href ? "page" : undefined}
              className={`nav-link${pathname === item.href ? " nav-link-active" : ""}`}
              href={item.href}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="nav-link nav-link-upcoming"
              title={`${item.label} is not available yet`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

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

export function Sidebar() {
  return (
    <aside className="sidebar">
      <Link aria-label="Still home" className="brand" href="/">
        <BrandMark />
        <span className="brand-name">still</span>
      </Link>

      <div className="sidebar-label">YOUR SPACE</div>
      <nav aria-label="Main navigation">
        <NavigationLinks />
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <span className="status-dot" />
          <span>Made for your own pace.</span>
        </div>
        <div className="sidebar-version">PERSONAL OS&nbsp; · &nbsp;01</div>
      </div>
    </aside>
  );
}
