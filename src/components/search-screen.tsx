"use client";

import { useEffect, useId, useRef } from "react";
import { Icon } from "@/components/icon";
import { ScreenHeader } from "@/components/local-data-ui";
import { useGlobalSearch } from "@/hooks/use-global-search";
import {
  SearchEmptyState,
  SearchNoResults,
  SearchResultsList,
} from "@/components/search-results";
import { searchModules } from "@/lib/search";

export function SearchScreen() {
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

  // On mount, check if there's a ?q= in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q");
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [setQuery]);

  // Update browser URL query without reloading the page as user types
  useEffect(() => {
    const trimmed = query.trim();
    const currentUrl = new URL(window.location.href);
    if (trimmed) {
      currentUrl.searchParams.set("q", trimmed);
    } else {
      currentUrl.searchParams.delete("q");
    }
    window.history.replaceState({}, "", currentUrl.toString());
  }, [query]);

  // Keyboard navigation
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
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
        openResult(searchResults.flattenedItems[selectedIndex]);
      }
    }
  }

  const activeId =
    searchResults.flattenedItems[selectedIndex]
      ? `${listboxId}-item-${searchResults.flattenedItems[selectedIndex].id}`
      : undefined;

  const availableModules = searchModules.filter((m) =>
    searchResults.groups.some((g) => g.module === m.id),
  );

  return (
    <div className="data-screen search-screen" onKeyDown={handleKeyDown}>
      <ScreenHeader
        description="Search across tasks, projects, journal entries, notes, finances, goals, people, and wishlist."
        kicker="SYSTEM"
        title="Search"
      />

      <div className="search-page-controls">
        <label className="search-page-input-wrap" htmlFor={inputId}>
          <span className="search-input-icon">
            <Icon name="search" />
          </span>
          <input
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-controls={listboxId}
            autoComplete="off"
            autoFocus
            className="search-page-input"
            id={inputId}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type anything to search your space…"
            ref={inputRef}
            spellCheck={false}
            type="search"
            value={query}
          />
          {query && (
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
          )}
        </label>

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
      </div>

      <div className="search-page-content">
        {isLoading ? (
          <p className="data-message">Reading your space…</p>
        ) : !query.trim() ? (
          <SearchEmptyState />
        ) : searchResults.totalCount === 0 ? (
          <SearchNoResults onClear={clearQuery} query={query} />
        ) : (
          <SearchResultsList
            listId={listboxId}
            onOpenItem={(item) => openResult(item)}
            onSelectIndex={setSelectedIndex}
            searchResults={searchResults}
            selectedIndex={selectedIndex}
          />
        )}
      </div>
    </div>
  );
}
