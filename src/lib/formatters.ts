import type { CurrencyPreference } from "@/lib/preferences";

const currencyLocales: Record<CurrencyPreference, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatCurrency(
  amount: number,
  currency: CurrencyPreference = "INR",
) {
  return new Intl.NumberFormat(currencyLocales[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(
  amount: number,
  currency: CurrencyPreference = "INR",
) {
  return new Intl.NumberFormat(currencyLocales[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatLocalDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : dateFormatter.format(date);
}
