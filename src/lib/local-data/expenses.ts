import {
  isExpenseCategory,
  type ExpenseCategory,
  type ExpenseRecord,
} from "@/lib/local-data/models/expense";
import { createLocalRepository } from "@/lib/local-data/repository";
import type { CreateRecord } from "@/lib/local-data/models/common";
import {
  requireNonBlank,
  requirePositiveAmount,
} from "@/lib/local-data/validation";

const expenseRepository = createLocalRepository<ExpenseRecord>(
  "expenses",
  (expense) => {
    requireNonBlank(expense.description, "Expense description");
    requirePositiveAmount(expense.amount);
    if (
      expense.category !== undefined &&
      !isExpenseCategory(expense.category)
    ) {
      throw new Error("Choose a valid expense category.");
    }
  },
);

export function createExpense(
  data: CreateRecord<ExpenseRecord>,
): Promise<ExpenseRecord> {
  const category: ExpenseCategory = data.category ?? "Other";
  return expenseRepository.create({ ...data, category });
}

export const getExpense = expenseRepository.get;
export const listExpenses = expenseRepository.list;
export const updateExpense = expenseRepository.update;
export const deleteExpense = expenseRepository.delete;
