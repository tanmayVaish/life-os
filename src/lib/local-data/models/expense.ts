import type { LocalRecord } from "@/lib/local-data/models/common";

export type ExpenseRecord = LocalRecord & {
  description: string;
  amount: string;
  notes?: string;
};
