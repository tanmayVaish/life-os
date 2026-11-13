import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";

type NavigationItem = {
  label: string;
  icon: IconName;
  active?: boolean;
};

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", icon: "dashboard", active: true },
  { label: "Tasks", icon: "task" },
  { label: "Projects", icon: "project" },
  { label: "Journal", icon: "journal" },
  { label: "Goals", icon: "goal" },
  { label: "Finance", icon: "finance" },
  { label: "People", icon: "people" },
  { label: "Wishlist", icon: "wishlist" },
];

export function NavigationLinks() {
  return (
    <ul className="space-y-1">
      {navigationItems.map((item) => (
        <li key={item.label}>
          {item.active ? (
            <Link
              aria-current="page"
              className="nav-link nav-link-active"
              href="/"
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
