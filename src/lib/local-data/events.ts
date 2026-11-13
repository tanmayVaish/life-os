import type { StoreName } from "@/lib/local-data/database";

export const localDataChangeEvent = "life-os:local-data-change";

export function notifyLocalDataChange(storeName: StoreName) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(localDataChangeEvent, { detail: { storeName } }),
  );
}
