"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { useGlobalSearch } from "@/hooks/use-global-search";
import {
  SearchEmptyState,
  SearchNoResults,
  SearchResultsList,
} from "@/components/search-results";
import { searchModules } from "@/lib/search";

type SearchOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const {
    query,
    setQuery,
    clearQuery,
    moduleFilter,
    setModuleFilter,
    selectedIndex,
    setSelectedIndex,
    searchResults,
    isLoading,
    openResult,
  } = useGlobalSearch("");

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const listboxId = useId();

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      // Clear or keep previous search query? Let's focus input
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  // Prevent background scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Keyboard navigation within the overlay
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    const total = searchResults.flattenedItems.length;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (total > 0) {
        setSelectedIndex((prev) => (prev + 1) % total);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (total > 0) {
        setSelectedIndex((prev) => (prev - 1 + total) % total);
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (total > 0 && searchResults.flattenedItems[selectedIndex]) {
        openResult(searchResults.flattenedItems[selectedIndex], onClose);
      }
    }
  }

  if (!isOpen) return null;

  const activeId =
    searchResults.flattenedItems[selectedIndex]
      ? `${listboxId}-item-${searchResults.flattenedItems[selectedIndex].id}`
      : undefined;

  // Available module chips that have results
  const availableModules = searchModules.filter((m) =>
    searchResults.groups.some((g) => g.module === m.id),
  );

  return (
    <div
      aria-modal="true"
      className="search-overlay-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={handleKeyDown}
      role="dialog"
    >
      <div className="search-overlay-dialog" role="document">
        <header className="search-overlay-header">
          <label className="search-overlay-input-wrap" htmlFor={inputId}>
            <span className="search-input-icon">
              <Icon name="search" />
            </span>
            <input
              aria-activedescendant={activeId}
              aria-autocomplete="list"
              aria-controls={listboxId}
              autoComplete="off"
              className="search-overlay-input"
              id={inputId}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks, projects, journal, finance, goals, people, wishlist…"
              ref={inputRef}
              spellCheck={false}
              type="text"
              value={query}
            />
            {query ? (
              <button
                aria-label="Clear search query"
                className="search-clear-button"
                onClick={() => {
                  clearQuery();
                  inputRef.current?.focus();
                }}
                type="button"
              >
                <Icon name="close" />
              </button>
            ) : (
              <kbd className="search-esc-hint">esc</kbd>
            )}
          </label>

          {/* Module filter chips if results exist */}
          {query.trim() && (
            <div
              aria-label="Filter results by module"
              className="search-filter-chips"
              role="group"
            >
              <button
                aria-pressed={moduleFilter === "all"}
                className={`search-chip${moduleFilter === "all" ? " is-active" : ""}`}
                onClick={() => setModuleFilter("all")}
                type="button"
              >
                All <span>{searchResults.totalCount}</span>
              </button>
              {availableModules.map((module) => {
                const group = searchResults.groups.find(
                  (g) => g.module === module.id,
                );
                const count = group?.totalCount ?? 0;
                return (
                  <button
                    aria-pressed={moduleFilter === module.id}
                    className={`search-chip${moduleFilter === module.id ? " is-active" : ""}`}
                    key={module.id}
                    onClick={() =>
                      setModuleFilter(
                        moduleFilter === module.id ? "all" : module.id,
                      )
                    }
                    type="button"
                  >
                    <span>{module.label}</span>
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </header>

        <div className="search-overlay-body">
          {isLoading ? (
            <p className="search-loading-message">Reading your space…</p>
          ) : !query.trim() ? (
            <SearchEmptyState shortcuts />
          ) : searchResults.totalCount === 0 ? (
            <SearchNoResults onClear={clearQuery} query={query} />
          ) : (
            <SearchResultsList
              listId={listboxId}
              onOpenItem={(item) => openResult(item, onClose)}
              onSelectIndex={setSelectedIndex}
              searchResults={searchResults}
              selectedIndex={selectedIndex}
            />
          )}
        </div>

        <footer className="search-overlay-footer">
          <div className="search-footer-shortcuts">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> navigate
            </span>
            <span>
              <kbd>↵</kbd> select
            </span>
            <span>
              <kbd>esc</kbd> close
            </span>
          </div>
          <Link
            className="search-dedicated-link"
            href={query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search"}
            onClick={onClose}
          >
            Open full search page →
          </Link>
        </footer>
      </div>
    </div>
  );
}
