import Link from "next/link";
import { Icon } from "@/components/icon";
import { MobileNavigation } from "@/components/mobile-navigation";
import { QuickCapture } from "@/components/quick-capture";
import { BrandMark, NavigationLinks } from "@/components/sidebar";

export function Topbar() {
  return (
    <header className="topbar">
      <Link aria-label="Still home" className="topbar-brand" href="/">
        <BrandMark />
        <span className="brand-name">still</span>
      </Link>

      <div className="topbar-context">
        <span className="context-divider" />
        <span>Personal space</span>
      </div>

      <div className="topbar-actions">
        <label className="search-field">
          <Icon name="search" />
          <input
            aria-label="Search your space"
            placeholder="Search"
            type="search"
          />
        </label>
        <QuickCapture />
        <button
          aria-label="Settings (coming soon)"
          className="icon-button settings-button"
          disabled
          title="Settings are coming soon"
          type="button"
        >
          <Icon name="settings" />
        </button>
        <button
          aria-label="Profile (coming soon)"
          className="profile-button"
          disabled
          title="Profile is coming soon"
          type="button"
        >
          MC
        </button>
      </div>

      <MobileNavigation>
        <div className="sidebar-label">YOUR SPACE</div>
        <NavigationLinks />
      </MobileNavigation>
    </header>
  );
}
