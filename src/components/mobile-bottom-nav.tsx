"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";

type PrimaryNavItem = {
  label: string;
  icon: IconName;
  href: string;
};

const primaryNavItems: PrimaryNavItem[] = [
  { label: "Home", icon: "dashboard", href: "/" },
  { label: "Tasks", icon: "task", href: "/tasks" },
  { label: "Projects", icon: "project", href: "/projects" },
  { label: "Journal", icon: "journal", href: "/journal" },
];

type MoreNavItem = {
  label: string;
  icon: IconName;
  href: string;
  note: string;
};

const moreNavItems: MoreNavItem[] = [
  { label: "Goals", icon: "goal", href: "/goals", note: "Aims & progress" },
  { label: "Finance", icon: "finance", href: "/finance", note: "Spend & categories" },
  { label: "People", icon: "people", href: "/people", note: "Stay connected" },
  { label: "Wishlist", icon: "wishlist", href: "/wishlist", note: "Ideas for later" },
  { label: "Search", icon: "search", href: "/search", note: "Find anything" },
  { label: "Settings", icon: "settings", href: "/settings", note: "Preferences & data" },
];

type MobileBottomNavProps = {
  onOpenSearch?: () => void;
};

export function MobileBottomNav({ onOpenSearch }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const sheetRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // Close more menu when route changes (render-phase reset to avoid cascading renders)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMoreOpen(false);
  }

  // Handle escape key and click outside
  useEffect(() => {
    if (!isMoreOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMoreOpen(false);
        moreButtonRef.current?.focus();
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        sheetRef.current &&
        !sheetRef.current.contains(event.target as Node) &&
        !moreButtonRef.current?.contains(event.target as Node)
      ) {
        setIsMoreOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMoreOpen]);

  const isMoreRouteActive = moreNavItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <>
      {/* "More" Sheet Overlay */}
      {isMoreOpen && (
        <div
          aria-hidden="true"
          className="mobile-more-backdrop"
          onClick={() => setIsMoreOpen(false)}
        />
      )}

      {isMoreOpen && (
        <section
          aria-label="More destinations"
          aria-modal="true"
          className="mobile-more-sheet"
          ref={sheetRef}
          role="dialog"
        >
          <div className="mobile-more-header">
            <div className="mobile-more-header-title">
              <span className="sidebar-label">MORE DESTINATIONS</span>
            </div>
            <button
              aria-label="Close menu"
              className="mobile-more-close"
              onClick={() => setIsMoreOpen(false)}
              type="button"
            >
              <Icon name="close" />
            </button>
          </div>

          <div className="mobile-more-grid">
            {moreNavItems.map((item) => {
              const isItemActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  aria-current={isItemActive ? "page" : undefined}
                  className={`mobile-more-link${isItemActive ? " is-active" : ""}`}
                  href={item.href}
                  key={item.href}
                  onClick={(e) => {
                    setIsMoreOpen(false);
                    if (item.label === "Search" && onOpenSearch) {
                      e.preventDefault();
                      onOpenSearch();
                    }
                  }}
                >
                  <div className="mobile-more-icon">
                    <Icon name={item.icon} />
                  </div>
                  <div className="mobile-more-text">
                    <span className="mobile-more-label">{item.label}</span>
                    <span className="mobile-more-note">{item.note}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav aria-label="Mobile navigation" className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-bar">
          {/* Primary 4 destinations */}
          {primaryNavItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`mobile-nav-tab${isActive ? " is-active" : ""}`}
                href={item.href}
                key={item.href}
              >
                <span className="mobile-nav-icon">
                  <Icon name={item.icon} />
                </span>
                <span className="mobile-nav-label">{item.label}</span>
              </Link>
            );
          })}

          {/* 5. More */}
          <button
            aria-expanded={isMoreOpen}
            aria-haspopup="dialog"
            aria-label="More destinations"
            className={`mobile-nav-tab${isMoreRouteActive || isMoreOpen ? " is-active" : ""}`}
            onClick={() => setIsMoreOpen((prev) => !prev)}
            ref={moreButtonRef}
            type="button"
          >
            <span className="mobile-nav-icon">
              <Icon name="menu" />
            </span>
            <span className="mobile-nav-label">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
