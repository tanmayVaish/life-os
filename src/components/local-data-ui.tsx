"use client";

import type { ReactNode } from "react";

type ScreenHeaderProps = {
  kicker: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function ScreenHeader({
  kicker,
  title,
  description,
  action,
}: ScreenHeaderProps) {
  return (
    <header className="data-screen-header">
      <div>
        <div className="eyebrow">
          <span className="eyebrow-line" />
          {kicker}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <p aria-live="polite" className="data-message">
      {label}
    </p>
  );
}

export function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div aria-live="assertive" className="data-error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button className="text-button" onClick={onRetry} type="button">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
