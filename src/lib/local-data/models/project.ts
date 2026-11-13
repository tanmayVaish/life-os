import type { LocalRecord } from "@/lib/local-data/models/common";

export type ProjectStatus = "active" | "paused" | "completed";

export type ProjectRecord = LocalRecord & {
  name: string;
  description: string;
  status: ProjectStatus;
  dueAt?: string;
};

export type ProjectInput = Pick<
  ProjectRecord,
  "name" | "description" | "status" | "dueAt"
>;
