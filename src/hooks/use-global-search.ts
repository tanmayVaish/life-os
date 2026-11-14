"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { localDataChangeEvent } from "@/lib/local-data/events";
import { usePreferences } from "@/hooks/use-preferences";
import {
  loadAllSearchRecords,
  searchAllRecords,
  type AllSearchRecords,
  type SearchModule,
  type SearchResultItem,
  type SearchResults,
} from "@/lib/search";

export function useGlobalSearch(initialQuery = "") {
  const router = useRouter();
  const { preferences } = usePreferences();
  const [records, setRecords] = useState<AllSearchRecords | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQueryState] = useState(initialQuery);
  const [moduleFilter, setModuleFilterState] = useState<"all" | SearchModule>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reloadVersion, setReloadVersion] = useState(0);

  const refreshRecords = useCallback(() => {
    setReloadVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const data = await loadAllSearchRecords();
        if (!active) return;
        setRecords(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load records for search.",
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }

    function handleDataChange() {
      void refresh();
    }

    function handleWindowFocus() {
      void refresh();
    }

    window.addEventListener(localDataChangeEvent, handleDataChange);
    window.addEventListener("focus", handleWindowFocus);
    void refresh();

    return () => {
      active = false;
      window.removeEventListener(localDataChangeEvent, handleDataChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [reloadVersion]);

  const setQuery = useCallback((nextQuery: string) => {
    setQueryState(nextQuery);
    setSelectedIndex(0);
  }, []);

  const setModuleFilter = useCallback((nextFilter: "all" | SearchModule) => {
    setModuleFilterState(nextFilter);
    setSelectedIndex(0);
  }, []);

  const searchResults: SearchResults = useMemo(() => {
    if (!records) {
      return {
        query,
        totalCount: 0,
        groups: [],
        flattenedItems: [],
      };
    }
    return searchAllRecords(
      query,
      records,
      preferences.currency,
      moduleFilter,
    );
  }, [query, records, preferences.currency, moduleFilter]);

  const clampedSelectedIndex =
    searchResults.flattenedItems.length > 0
      ? Math.min(selectedIndex, searchResults.flattenedItems.length - 1)
      : 0;

  const openResult = useCallback(
    (item: SearchResultItem, onBeforeNavigate?: () => void) => {
      if (onBeforeNavigate) {
        onBeforeNavigate();
      }
      router.push(item.url);
      window.setTimeout(() => {
        window.dispatchEvent(new Event("popstate"));
      }, 50);
    },
    [router],
  );

  const clearQuery = useCallback(() => {
    setQueryState("");
    setSelectedIndex(0);
  }, []);

  return {
    query,
    setQuery,
    clearQuery,
    moduleFilter,
    setModuleFilter,
    selectedIndex: clampedSelectedIndex,
    setSelectedIndex,
    searchResults,
    isLoading,
    error,
    refreshRecords,
    openResult,
  };
}
