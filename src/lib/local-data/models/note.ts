import type { LocalRecord } from "@/lib/local-data/models/common";

export type NoteRecord = LocalRecord & {
  content: string;
  title?: string;
};
