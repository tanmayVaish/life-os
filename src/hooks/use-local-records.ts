"use client";

import { useCallback, useEffect, useState } from "react";
import type { StoreName } from "@/lib/local-data/database";
import { localDataChangeEvent } from "@/lib/local-data/events";
import type { LocalRecord } from "@/lib/local-data/models/common";

type UseLocalRecordsResult<T> = {
  records: T[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
};

export function useLocalRecords<T extends LocalRecord>(
  storeName: StoreName,
  loadRecords: () => Promise<T[]>,
): UseLocalRecordsResult<T> {
  const [records, setRecords] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  const reload = useCallback(() => {
    setReloadVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const nextRecords = await loadRecords();
        if (!active) return;
        setRecords(nextRecords);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Local records could not be loaded.",
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }

    function handleDataChange(event: Event) {
      if (!(event instanceof CustomEvent)) return;
      if (event.detail?.storeName === storeName) void refresh();
    }

    function handleFocus() {
      void refresh();
    }

    window.addEventListener(localDataChangeEvent, handleDataChange);
    window.addEventListener("focus", handleFocus);
    void refresh();

    return () => {
      active = false;
      window.removeEventListener(localDataChangeEvent, handleDataChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadRecords, reloadVersion, storeName]);

  return { records, isLoading, error, reload };
}
