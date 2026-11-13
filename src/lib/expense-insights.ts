import {
  expenseCategories,
  type ExpenseCategory,
  type ExpenseRecord,
} from "@/lib/local-data/models/expense";
import { getLocalDateKey, isDateKey } from "@/lib/local-date";

export type ExpensePeriod = "week" | "month" | "all" | "custom";

export type ExpenseDateRange = {
  startDate: string;
  endDate: string;
};

export type ExpenseCategoryTotal = {
  category: ExpenseCategory;
  amount: number;
};

export type ExpenseSummary = {
  total: number;
  count: number;
  categories: ExpenseCategoryTotal[];
};

export function getExpenseCategory(expense: ExpenseRecord): ExpenseCategory {
  return expense.category ?? "Other";
}

export function getExpenseDateRange(
  period: ExpensePeriod,
  currentDate: Date,
  customStart?: string,
  customEnd?: string,
): ExpenseDateRange | null {
  if (period === "all") return null;

  if (period === "custom") {
    if (
      !customStart ||
      !customEnd ||
      !isDateKey(customStart) ||
      !isDateKey(customEnd) ||
      customStart > customEnd
    ) {
      return null;
    }
    return { startDate: customStart, endDate: customEnd };
  }

  const start = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  );
  if (period === "week") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      startDate: getLocalDateKey(start),
      endDate: getLocalDateKey(end),
    };
  }

  return {
    startDate: getLocalDateKey(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    ),
    endDate: getLocalDateKey(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
    ),
  };
}

export function filterExpensesByDateRange(
  expenses: ExpenseRecord[],
  range: ExpenseDateRange | null,
): ExpenseRecord[] {
  if (!range) return expenses;

  return expenses.filter((expense) => {
    const date = new Date(expense.createdAt);
    if (Number.isNaN(date.getTime())) return false;
    const dateKey = getLocalDateKey(date);
    return dateKey >= range.startDate && dateKey <= range.endDate;
  });
}

export function summarizeExpenses(
  expenses: ExpenseRecord[],
): ExpenseSummary {
  const categoryCents = new Map<ExpenseCategory, number>();
  let totalCents = 0;
  let count = 0;

  for (const expense of expenses) {
    const amount = Number(expense.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const cents = Math.round(amount * 100);
    totalCents += cents;
    count += 1;
    const category = getExpenseCategory(expense);
    categoryCents.set(category, (categoryCents.get(category) ?? 0) + cents);
  }

  const categories = expenseCategories
    .map((category) => ({
      category,
      amount: (categoryCents.get(category) ?? 0) / 100,
    }))
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return {
    total: totalCents / 100,
    count,
    categories,
  };
}
