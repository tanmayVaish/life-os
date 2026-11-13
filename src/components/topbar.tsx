"use client";

import Link from "next/link";
import { Icon } from "@/components/icon";
import { MobileNavigation } from "@/components/mobile-navigation";
import { QuickCapture } from "@/components/quick-capture";
import { BrandMark, NavigationLinks } from "@/components/sidebar";
import { usePreferences } from "@/hooks/use-preferences";

export function Topbar() {
  const { preferences } = usePreferences();
  const initials =
    preferences.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "ST";

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
        <Link
          aria-label="Settings"
          className="icon-button settings-button"
          href="/settings"
          title="Settings"
        >
          <Icon name="settings" />
        </Link>
        <span
          aria-label={preferences.name ? `Profile: ${preferences.name}` : "Profile"}
          className="profile-button"
          title={preferences.name || "Your profile"}
        >
          {initials}
        </span>
      </div>

      <MobileNavigation>
        <div className="sidebar-label">YOUR SPACE</div>
        <NavigationLinks />
      </MobileNavigation>
    </header>
  );
}
