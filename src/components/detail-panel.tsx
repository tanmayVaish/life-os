"use client";

import { useId, useState, type ReactNode } from "react";
import { Icon } from "@/components/icon";

type DetailPanelProps = {
  label: string;
  summary: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DetailPanel({
  label,
  summary,
  children,
  className = "",
}: DetailPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <div className={`detail-panel ${className}`}>
      <button
        aria-controls={contentId}
        aria-expanded={isOpen}
        aria-label={`${label} details`}
        className="detail-trigger"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        {summary}
        <span className="detail-action">Details</span>
        <Icon className={isOpen ? "detail-chevron is-open" : "detail-chevron"} name="chevron" />
      </button>
      <div className="detail-content" hidden={!isOpen} id={contentId}>
        {children}
      </div>
    </div>
  );
}
