import { createLocalRepository } from "@/lib/local-data/repository";
import type { ExpenseRecord } from "@/lib/local-data/models/expense";
import {
  requireNonBlank,
  requirePositiveAmount,
} from "@/lib/local-data/validation";

const expenseRepository = createLocalRepository<ExpenseRecord>(
  "expenses",
  (expense) => {
    requireNonBlank(expense.description, "Expense description");
    requirePositiveAmount(expense.amount);
  },
);

export const createExpense = expenseRepository.create;
export const getExpense = expenseRepository.get;
export const listExpenses = expenseRepository.list;
export const updateExpense = expenseRepository.update;
export const deleteExpense = expenseRepository.delete;
