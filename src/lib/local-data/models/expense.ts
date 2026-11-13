import type { LocalRecord } from "@/lib/local-data/models/common";

export const expenseCategories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Education",
  "Other",
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return expenseCategories.some((category) => category === value);
}

export type ExpenseRecord = LocalRecord & {
  description: string;
  amount: string;
  category?: ExpenseCategory;
  notes?: string;
};
