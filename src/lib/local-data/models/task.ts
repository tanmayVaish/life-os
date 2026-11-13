import type { LocalRecord } from "@/lib/local-data/models/common";

export type TaskPriority = "low" | "medium" | "high";

export type TaskRecord = LocalRecord & {
  title: string;
  completed: boolean;
  notes?: string;
  dueAt?: string;
  projectId?: string;
  priority?: TaskPriority;
};
