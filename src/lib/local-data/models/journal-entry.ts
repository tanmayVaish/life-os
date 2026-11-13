import type { LocalRecord } from "@/lib/local-data/models/common";

export type JournalMood = "great" | "good" | "okay" | "low" | "difficult";

export type JournalEntryRecord = LocalRecord & {
  date: string;
  title?: string;
  content: string;
  mood?: JournalMood;
  highlights?: string;
  gratitude?: string;
  reflection?: string;
};
