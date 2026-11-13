"use client";

import { useState } from "react";
import { ErrorNotice } from "@/components/local-data-ui";
import { usePreferences } from "@/hooks/use-preferences";
import {
  currencyPreferences,
  isCurrencyPreference,
  isThemePreference,
  themePreferences,
  type CurrencyPreference,
  type ThemePreference,
} from "@/lib/preferences";

const currencyNames: Record<CurrencyPreference, string> = {
  INR: "INR",
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
};

const themeNames: Record<ThemePreference, string> = {
  dark: "Dark",
  light: "Light",
  amoled: "AMOLED",
};

export function SettingsScreen() {
  const { preferences, isLoading, error, updatePreferences } =
    usePreferences();
  const [saveError, setSaveError] = useState<string | null>(null);

  function saveName(value: string) {
    const nextName = value.trim();
    if (nextName === preferences.name) return;

    try {
      updatePreferences({ name: nextName });
      setSaveError(null);
    } catch (saveFailure) {
      setSaveError(
        saveFailure instanceof Error
          ? saveFailure.message
          : "The name could not be saved.",
      );
    }
  }

  function updateCurrency(value: string) {
    if (!isCurrencyPreference(value)) return;

    try {
      updatePreferences({ currency: value });
      setSaveError(null);
    } catch (saveFailure) {
      setSaveError(
        saveFailure instanceof Error
          ? saveFailure.message
          : "The currency could not be saved.",
      );
    }
  }

  function updateTheme(value: string) {
    if (!isThemePreference(value)) return;

    try {
      updatePreferences({ theme: value });
      setSaveError(null);
    } catch (saveFailure) {
      setSaveError(
        saveFailure instanceof Error
          ? saveFailure.message
          : "The appearance could not be saved.",
      );
    }
  }

  return (
    <div className="settings-screen">
      <header className="settings-header">
        <div className="eyebrow">
          <span className="eyebrow-line" />
          SYSTEM
        </div>
        <h1>Settings</h1>
      </header>

      {(error || saveError) && (
        <ErrorNotice message={saveError ?? error ?? "Settings could not be saved."} />
      )}

      <div className="settings-grid">
        <section aria-labelledby="settings-profile-heading" className="settings-panel">
          <h2 id="settings-profile-heading">Profile</h2>
          <div className="settings-fields">
            <label className="settings-field">
              <span>Name</span>
              <input
                autoComplete="name"
                disabled={isLoading || Boolean(error)}
                key={`${isLoading ? "loading" : "ready"}-${preferences.name}`}
                maxLength={60}
                onBlur={(event) => saveName(event.currentTarget.value)}
                placeholder="Your name"
                type="text"
                defaultValue={preferences.name}
              />
            </label>

            <label className="settings-field">
              <span>Currency</span>
              <select
                disabled={isLoading || Boolean(error)}
                onChange={(event) => updateCurrency(event.target.value)}
                value={preferences.currency}
              >
                {currencyPreferences.map((currency) => (
                  <option key={currency} value={currency}>
                    {currencyNames[currency]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section
          aria-labelledby="settings-appearance-heading"
          className="settings-panel"
        >
          <h2 id="settings-appearance-heading">Appearance</h2>
          <fieldset
            aria-label="Theme"
            className="settings-theme-options"
            disabled={isLoading || Boolean(error)}
          >
            <legend className="visually-hidden">Theme</legend>
            {themePreferences.map((theme) => (
              <label className="settings-theme-option" key={theme}>
                <input
                  checked={preferences.theme === theme}
                  name="theme"
                  onChange={(event) => {
                    if (event.target.checked) updateTheme(theme);
                  }}
                  type="radio"
                  value={theme}
                />
                <span>{themeNames[theme]}</span>
              </label>
            ))}
          </fieldset>
          <p className="settings-hint">
            Appearance is saved in this browser and applied throughout STILL.
          </p>
        </section>

        <section aria-labelledby="settings-local-heading" className="settings-panel">
          <h2 id="settings-local-heading">Local data</h2>
          <p className="settings-local-copy">
            Your tasks, notes and expenses stay in this browser. STILL has no
            demo data to reset.
          </p>
        </section>
      </div>

      <p className="settings-footnote">
        Currency changes how amounts are displayed; they do not convert saved
        values.
      </p>
    </div>
  );
}
