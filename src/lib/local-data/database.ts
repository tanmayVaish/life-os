export const databaseName = "life-os-local";
const databaseVersion = 2;

export const storeNames = ["tasks", "notes", "expenses", "projects"] as const;
export type StoreName = (typeof storeNames)[number];

let databasePromise: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(
      new Error("Local storage is unavailable in this browser."),
    );
  }

  if (!databasePromise) {
    databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      let settled = false;
      const request = indexedDB.open(databaseName, databaseVersion);

      request.onupgradeneeded = () => {
        const database = request.result;
        for (const storeName of storeNames) {
          if (!database.objectStoreNames.contains(storeName)) {
            database.createObjectStore(storeName, { keyPath: "id" });
          }
        }
      };

      request.onerror = () => {
        if (settled) return;
        settled = true;
        reject(
          request.error ?? new Error("The local database could not be opened."),
        );
      };

      request.onblocked = () => {
        if (settled) return;
        settled = true;
        reject(
          new Error(
            "The local database is busy in another tab. Close other Life OS tabs and try again.",
          ),
        );
      };

      request.onsuccess = () => {
        const database = request.result;
        if (settled) {
          database.close();
          return;
        }

        settled = true;
        database.onversionchange = () => {
          database.close();
          databasePromise = null;
        };
        resolve(database);
      };
    }).catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}
