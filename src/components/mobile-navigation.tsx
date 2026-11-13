"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/icon";

type MobileNavigationProps = {
  children: ReactNode;
};

export function MobileNavigation({ children }: MobileNavigationProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleOutsidePointer(event: PointerEvent) {
      const details = detailsRef.current;
      if (
        details?.open &&
        event.target instanceof Node &&
        !details.contains(event.target)
      ) {
        details.open = false;
      }
    }

    function handleEscape(event: KeyboardEvent) {
      const details = detailsRef.current;
      if (event.key === "Escape" && details?.open) {
        details.open = false;
        summaryRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <details
      className="mobile-navigation"
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
          if (detailsRef.current) detailsRef.current.open = false;
          if (event.detail === 0) summaryRef.current?.focus();
        }
      }}
      ref={detailsRef}
    >
      <summary aria-label="Toggle navigation menu" ref={summaryRef}>
        <Icon name="menu" />
      </summary>
      <nav aria-label="Mobile navigation" className="mobile-navigation-panel">
        {children}
      </nav>
    </details>
  );
}
