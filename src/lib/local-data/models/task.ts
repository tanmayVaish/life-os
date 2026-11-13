import type { LocalRecord } from "@/lib/local-data/models/common";

export type TaskRecord = LocalRecord & {
  title: string;
  completed: boolean;
  notes?: string;
  dueAt?: string;
};
