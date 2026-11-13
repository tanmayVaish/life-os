"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyThemePreference,
  defaultPreferences,
  preferencesChangeEvent,
  preferencesStorageKey,
  readPreferences,
  savePreferences,
  type UserPreferences,
} from "@/lib/preferences";

export function usePreferences() {
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function refresh() {
      try {
        const stored = readPreferences();
        setPreferences(stored);
        setError(null);
        applyThemePreference(stored.theme);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Settings could not be loaded from this browser.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    function handleStorageChange(event: StorageEvent) {
      if (event.key === null || event.key === preferencesStorageKey) refresh();
    }

    window.addEventListener(preferencesChangeEvent, refresh);
    window.addEventListener("storage", handleStorageChange);
    refresh();

    return () => {
      window.removeEventListener(preferencesChangeEvent, refresh);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const updatePreferences = useCallback(
    (changes: Partial<UserPreferences>) => {
      try {
        const updated = savePreferences(changes);
        setPreferences(updated);
        setError(null);
        return updated;
      } catch (saveError) {
        const message =
          saveError instanceof Error
            ? saveError.message
            : "Settings could not be saved in this browser.";
        setError(message);
        throw saveError instanceof Error ? saveError : new Error(message);
      }
    },
    [],
  );

  return { preferences, isLoading, error, updatePreferences };
}
