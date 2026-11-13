import { createLocalRepository, runLocalTransaction } from "@/lib/local-data/repository";
import type { CreateRecord } from "@/lib/local-data/models/common";
import type { JournalEntryRecord, JournalMood } from "@/lib/local-data/models/journal-entry";
import { isDateKey } from "@/lib/local-date";
import { requireNonBlank } from "@/lib/local-data/validation";

const moods: JournalMood[] = ["great", "good", "okay", "low", "difficult"];

function validateJournalEntry(entry: JournalEntryRecord) {
  if (!isDateKey(entry.date)) {
    throw new Error("Choose a valid journal date.");
  }
  requireNonBlank(entry.content, "Journal entry");
  if (entry.mood !== undefined && !moods.includes(entry.mood)) {
    throw new Error("Choose a valid mood.");
  }
  for (const field of ["title", "highlights", "gratitude", "reflection"] as const) {
    const value = entry[field];
    if (value !== undefined && typeof value !== "string") {
      throw new Error("Journal details must be text.");
    }
  }
}

const journalEntryRepository = createLocalRepository<JournalEntryRecord>(
  "journalEntries",
  validateJournalEntry,
);

export type JournalEntryInput = Omit<
  CreateRecord<JournalEntryRecord>,
  "date"
>;

export const listJournalEntries = journalEntryRepository.list;
export const deleteJournalEntry = journalEntryRepository.delete;

export function getJournalEntryByDate(
  date: string,
): Promise<JournalEntryRecord | undefined> {
  if (!isDateKey(date)) {
    return Promise.reject(new Error("Choose a valid journal date."));
  }

  return runLocalTransaction<JournalEntryRecord | undefined>(
    "journalEntries",
    "readonly",
    (store, setResult) => {
      const request = store.index("date").get(date);
      request.onsuccess = () =>
        setResult(request.result as JournalEntryRecord | undefined);
    },
  );
}

export function saveJournalEntryForDate(
  date: string,
  input: JournalEntryInput,
): Promise<JournalEntryRecord> {
  const candidate: JournalEntryRecord = {
    ...input,
    date,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) Reflect.deleteProperty(candidate, key);
  }
  validateJournalEntry(candidate);

  return runLocalTransaction<JournalEntryRecord>(
    "journalEntries",
    "readwrite",
    (store, setResult, fail) => {
      const getRequest = store.index("date").get(date);
      getRequest.onsuccess = () => {
        const existing = getRequest.result as
          | JournalEntryRecord
          | undefined;
        const timestamp = new Date().toISOString();
        const record: JournalEntryRecord = existing
          ? {
              ...existing,
              ...input,
              date,
              id: existing.id,
              createdAt: existing.createdAt,
              updatedAt: timestamp,
            }
          : {
              ...candidate,
              updatedAt: timestamp,
            };

        if (existing) {
          for (const [key, value] of Object.entries(input)) {
            if (value === undefined) Reflect.deleteProperty(record, key);
          }
        }

        try {
          validateJournalEntry(record);
        } catch (error) {
          fail(
            error instanceof Error
              ? error
              : new Error("The journal entry is not valid."),
          );
          return;
        }

        const writeRequest = existing
          ? store.put(record)
          : store.add(record);
        writeRequest.onsuccess = () => setResult(record);
      };
    },
  );
}
