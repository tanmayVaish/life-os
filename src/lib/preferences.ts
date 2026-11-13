export const preferencesStorageKey = "still:preferences:v1";
export const preferencesChangeEvent = "still:preferences-change";

export const themePreferences = ["dark", "light", "amoled"] as const;
export type ThemePreference = (typeof themePreferences)[number];

export const currencyPreferences = ["INR", "USD", "EUR", "GBP"] as const;
export type CurrencyPreference = (typeof currencyPreferences)[number];

export type UserPreferences = {
  name: string;
  currency: CurrencyPreference;
  theme: ThemePreference;
};

export const defaultPreferences: UserPreferences = {
  name: "",
  currency: "INR",
  theme: "dark",
};

export function isCurrencyPreference(
  value: string,
): value is CurrencyPreference {
  return currencyPreferences.some((currency) => currency === value);
}

export function isThemePreference(value: string): value is ThemePreference {
  return themePreferences.some((theme) => theme === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function applyThemePreference(theme: ThemePreference) {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme =
    theme === "light" ? "light" : "dark";
}

export function readPreferences(): UserPreferences {
  if (typeof window === "undefined") return defaultPreferences;

  let serialized: string | null;
  try {
    serialized = window.localStorage.getItem(preferencesStorageKey);
  } catch {
    throw new Error("Settings could not be read from this browser.");
  }

  if (!serialized) return defaultPreferences;

  let stored: unknown;
  try {
    stored = JSON.parse(serialized);
  } catch {
    throw new Error("Saved settings could not be read. They have not been changed.");
  }

  if (
    !isRecord(stored) ||
    (stored.name !== undefined && typeof stored.name !== "string") ||
    (stored.currency !== undefined &&
      (typeof stored.currency !== "string" ||
        !isCurrencyPreference(stored.currency))) ||
    (stored.theme !== undefined &&
      (typeof stored.theme !== "string" ||
        !isThemePreference(stored.theme)))
  ) {
    throw new Error("Saved settings are invalid. They have not been changed.");
  }

  return {
    name: stored.name ?? defaultPreferences.name,
    currency: stored.currency ?? defaultPreferences.currency,
    theme: stored.theme ?? defaultPreferences.theme,
  };
}

export function savePreferences(
  changes: Partial<UserPreferences>,
): UserPreferences {
  if (typeof window === "undefined") {
    throw new Error("Settings can only be saved in this browser.");
  }

  const updated = { ...readPreferences(), ...changes };
  try {
    window.localStorage.setItem(preferencesStorageKey, JSON.stringify(updated));
  } catch {
    throw new Error("Settings could not be saved in this browser.");
  }

  applyThemePreference(updated.theme);
  window.dispatchEvent(new Event(preferencesChangeEvent));
  return updated;
}
