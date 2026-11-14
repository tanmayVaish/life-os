"use client";

import { useId } from "react";
import { Icon } from "@/components/icon";
import type { SearchResultItem, SearchResults } from "@/lib/search";

export function HighlightMatches({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const trimmed = query.trim();
  if (!trimmed || !text) return <>{text}</>;

  const tokens = Array.from(
    new Set(
      trimmed
        .toLowerCase()
        .split(/\s+/)
        .filter((token) => token.length > 0),
    ),
  );

  if (!tokens.length) return <>{text}</>;

  // Escape special regex characters
  const escapedTokens = tokens.map((t) =>
    t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const regex = new RegExp(`(${escapedTokens.join("|")})`, "gi");

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = tokens.some(
          (token) => token.toLowerCase() === part.toLowerCase(),
        );
        return isMatch ? (
          <mark className="search-match" key={index}>
            {part}
          </mark>
        ) : (
          part
        );
      })}
    </>
  );
}

export function SearchEmptyState({
  icon = "search",
  title = "Search your space",
  description = "Type to search across tasks, projects, journal entries, notes, finances, goals, people, and wishlist.",
  shortcuts,
}: {
  icon?: "search";
  title?: string;
  description?: string;
  shortcuts?: boolean;
}) {
  return (
    <div className="search-empty-state">
      <div className="search-empty-icon">
        <Icon name={icon} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {shortcuts && (
        <div className="search-shortcut-hints">
          <div className="shortcut-pill">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="shortcut-pill">
            <kbd>↵</kbd>
            <span>Open record</span>
          </div>
          <div className="shortcut-pill">
            <kbd>esc</kbd>
            <span>Close</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function SearchNoResults({
  query,
  onClear,
}: {
  query: string;
  onClear?: () => void;
}) {
  return (
    <div className="search-no-results">
      <h3>No matches for “{query}”</h3>
      <p>
        Check for typos, search with fewer words, or try keywords from another
        category.
      </p>
      {onClear && (
        <button className="text-button" onClick={onClear} type="button">
          Clear search
        </button>
      )}
    </div>
  );
}

export function SearchResultsList({
  searchResults,
  selectedIndex,
  onSelectIndex,
  onOpenItem,
  listId,
}: {
  searchResults: SearchResults;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onOpenItem: (item: SearchResultItem) => void;
  listId?: string;
}) {
  const generatedId = useId();
  const actualListId = listId ?? generatedId;

  let runningIndex = 0;

  return (
    <div
      aria-label="Search results"
      className="search-results-container"
      id={actualListId}
      role="listbox"
    >
      {searchResults.groups.map((group) => {
        return (
          <section
            aria-labelledby={`search-group-${group.module}`}
            className="search-result-group"
            key={group.module}
          >
            <div
              className="search-group-header"
              id={`search-group-${group.module}`}
            >
              <div className="search-group-title">
                <Icon name={group.icon} />
                <span>{group.label}</span>
              </div>
              <span className="search-group-count">
                {group.totalCount} {group.totalCount === 1 ? "match" : "matches"}
              </span>
            </div>

            <ul className="search-items-list" role="presentation">
              {group.items.map((item) => {
                const itemIndex = runningIndex++;
                const isSelected = itemIndex === selectedIndex;
                const itemId = `${actualListId}-item-${item.id}`;

                return (
                  <li
                    aria-selected={isSelected}
                    className={`search-result-row${isSelected ? " is-active" : ""}`}
                    id={itemId}
                    key={item.id}
                    onClick={() => onOpenItem(item)}
                    onMouseEnter={() => onSelectIndex(itemIndex)}
                    role="option"
                    tabIndex={-1}
                  >
                    <div className="search-result-main">
                      <div className="search-result-header">
                        <span className="search-result-title">
                          <HighlightMatches
                            query={searchResults.query}
                            text={item.title}
                          />
                        </span>
                        <div className="search-result-tags">
                          {item.metadata.map((meta, i) => (
                            <span
                              className={`search-meta-badge ${meta.type ? `meta-${meta.type}` : ""}`}
                              key={i}
                            >
                              {meta.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {item.excerpt && (
                        <p className="search-result-excerpt">
                          <HighlightMatches
                            query={searchResults.query}
                            text={item.excerpt}
                          />
                        </p>
                      )}
                    </div>

                    <div className="search-result-action" aria-hidden="true">
                      <span className="search-enter-hint">↵</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
