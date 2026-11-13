import { openDatabase, type StoreName } from "@/lib/local-data/database";
import { notifyLocalDataChange } from "@/lib/local-data/events";
import type {
  CreateRecord,
  LocalRecord,
  UpdateRecord,
} from "@/lib/local-data/models/common";

type StoreScope = StoreName | readonly [StoreName, ...StoreName[]];

export function runLocalTransaction<TResult>(
  storeScope: StoreScope,
  mode: IDBTransactionMode,
  operation: (
    store: IDBObjectStore,
    setResult: (result: TResult) => void,
    fail: (error: Error) => void,
    transaction: IDBTransaction,
  ) => void,
): Promise<TResult> {
  const storeNames =
    typeof storeScope === "string" ? ([storeScope] as const) : storeScope;
  const primaryStoreName =
    typeof storeScope === "string" ? storeScope : storeScope[0];

  return openDatabase().then(
    (database) =>
      new Promise<TResult>((resolve, reject) => {
        let result: TResult;
        let hasResult = false;
        let settled = false;
        let operationError: Error | undefined;
        const transaction = database.transaction([...storeNames], mode);
        const store = transaction.objectStore(primaryStoreName);

        const rejectOnce = (error: Error) => {
          if (settled) return;
          settled = true;
          reject(error);
        };

        transaction.oncomplete = () => {
          if (settled) return;
          if (!hasResult) {
            rejectOnce(new Error("The local database returned no result."));
            return;
          }

          if (mode === "readwrite") {
            for (const storeName of storeNames) {
              notifyLocalDataChange(storeName);
            }
          }
          settled = true;
          resolve(result);
        };

        transaction.onerror = () => {
          rejectOnce(
            operationError ??
              transaction.error ??
              new Error("The local database operation failed."),
          );
        };

        transaction.onabort = () => {
          rejectOnce(
            operationError ??
              transaction.error ??
              new Error("The local database operation was cancelled."),
          );
        };

        const setResult = (value: TResult) => {
          result = value;
          hasResult = true;
        };

        const fail = (error: Error) => {
          operationError = error;
          transaction.abort();
        };

        try {
          operation(store, setResult, fail, transaction);
        } catch (error) {
          fail(
            error instanceof Error
              ? error
              : new Error("The local database operation failed."),
          );
        }
      }),
  );
}

export function createLocalRepository<T extends LocalRecord>(
  storeName: StoreName,
  validate: (record: T) => void,
) {
  return {
    async create(data: CreateRecord<T>): Promise<T> {
      const timestamp = new Date().toISOString();
      const record = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: timestamp,
        updatedAt: timestamp,
      } as T;
      validate(record);

      return runLocalTransaction<T>(storeName, "readwrite", (store, setResult) => {
        const request = store.add(record);
        request.onsuccess = () => setResult(record);
      });
    },

    get(id: string): Promise<T | undefined> {
      return runLocalTransaction<T | undefined>(
        storeName,
        "readonly",
        (store, setResult) => {
          const request = store.get(id);
          request.onsuccess = () => setResult(request.result as T | undefined);
        },
      );
    },

    list(): Promise<T[]> {
      return runLocalTransaction<T[]>(storeName, "readonly", (store, setResult) => {
        const request = store.getAll();
        request.onsuccess = () => setResult(request.result as T[]);
      });
    },

    update(id: string, changes: UpdateRecord<T>): Promise<T> {
      return runLocalTransaction<T>(
        storeName,
        "readwrite",
        (store, setResult, fail) => {
          const getRequest = store.get(id);
          getRequest.onsuccess = () => {
            const existing = getRequest.result as T | undefined;
            if (!existing) {
              fail(new Error(`No ${storeName.slice(0, -1)} found with that ID.`));
              return;
            }

            const updated = {
              ...existing,
              ...changes,
              id: existing.id,
              createdAt: existing.createdAt,
              updatedAt: new Date().toISOString(),
            } as T;
            for (const [key, value] of Object.entries(changes)) {
              if (value === undefined) Reflect.deleteProperty(updated, key);
            }
            try {
              validate(updated);
            } catch (error) {
              fail(
                error instanceof Error
                  ? error
                  : new Error("The updated record is not valid."),
              );
              return;
            }
            const putRequest = store.put(updated);
            putRequest.onsuccess = () => setResult(updated);
          };
        },
      );
    },

    delete(id: string): Promise<void> {
      return runLocalTransaction<void>(
        storeName,
        "readwrite",
        (store, setResult, fail) => {
          const getRequest = store.get(id);
          getRequest.onsuccess = () => {
            if (!getRequest.result) {
              fail(new Error(`No ${storeName.slice(0, -1)} found with that ID.`));
              return;
            }

            const deleteRequest = store.delete(id);
            deleteRequest.onsuccess = () => setResult(undefined);
          };
        },
      );
    },
  };
}
