"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  EmptyState,
  ErrorNotice,
  LoadingState,
  ScreenHeader,
} from "@/components/local-data-ui";
import { ModalDialog } from "@/components/modal-dialog";
import { useLocalRecords } from "@/hooks/use-local-records";
import { usePreferences } from "@/hooks/use-preferences";
import {
  createExpense,
  deleteExpense,
  expenseCategories,
  isExpenseCategory,
  listExpenses,
  type ExpenseCategory,
  type ExpenseRecord,
  updateExpense,
} from "@/lib/local-data";
import {
  filterExpensesByDateRange,
  getExpenseCategory,
  getExpenseDateRange,
  summarizeExpenses,
  type ExpensePeriod,
} from "@/lib/expense-insights";
import { formatCurrency, formatLocalDate } from "@/lib/formatters";
import { formatDateKey, getLocalDateKey, isDateKey } from "@/lib/local-date";
import type { CurrencyPreference } from "@/lib/preferences";

type ExpenseInput = {
  description: string;
  amount: string;
  category: ExpenseCategory;
  notes?: string;
};
type CategoryFilter = "all" | ExpenseCategory;

const periodOptions: { value: ExpensePeriod; label: string }[] = [
  { value: "week", label: "This week (Mon-Sun)" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
];

function isExpensePeriod(value: string): value is ExpensePeriod {
  return value === "week" || value === "month" || value === "all" || value === "custom";
}

function ExpenseEditor({
  expense,
  onSave,
  currency,
}: {
  expense: ExpenseRecord | null;
  onSave: (input: ExpenseInput) => Promise<void>;
  currency: CurrencyPreference;
}) {
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense?.amount ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(
    expense ? getExpenseCategory(expense) : "Other",
  );
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedDescription = description.trim();
    const numericAmount = Number(amount);

    if (!trimmedDescription) {
      setError("Add a description before saving.");
      return;
    }
    if (!amount || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      await onSave({
        description: trimmedDescription,
        amount,
        category,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The expense could not be saved on this device.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Description</span>
        <input
          autoFocus
          onChange={(event) => setDescription(event.target.value)}
          required
          value={description}
        />
      </label>
      <label className="capture-field">
        <span>Amount ({currency})</span>
        <input
          inputMode="decimal"
          min="0.01"
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
          required
          step="0.01"
          type="number"
          value={amount}
        />
      </label>
      <label className="capture-field">
        <span>Category</span>
        <select
          onChange={(event) => {
            if (isExpenseCategory(event.target.value)) {
              setCategory(event.target.value);
            }
          }}
          value={category}
        >
          {expenseCategories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="capture-field">
        <span>
          Notes <span className="optional-label">Optional</span>
        </span>
        <textarea
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          value={notes}
        />
      </label>
      {error && <ErrorNotice message={error} />}
      <div className="record-form-footer">
        <span>Saved only on this device.</span>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : expense ? "Save changes" : "Add expense"}
        </button>
      </div>
    </form>
  );
}

export function FinanceScreen() {
  const { preferences } = usePreferences();
  const {
    records: expenses,
    isLoading,
    error,
    reload,
  } = useLocalRecords("expenses", listExpenses);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(
    null,
  );
  const [editorVersion, setEditorVersion] = useState(0);
  const [operationError, setOperationError] = useState("");
  const [period, setPeriod] = useState<ExpensePeriod>("month");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const handledExpenseIdRef = useRef<string | null>(null);

  useEffect(() => {
    function checkRequestedExpense() {
      if (isLoading || !expenses.length) return;
      const requestedId = new URLSearchParams(window.location.search).get("expenseId");
      if (!requestedId || handledExpenseIdRef.current === requestedId) return;

      const target = expenses.find((e) => e.id === requestedId);
      if (target) {
        handledExpenseIdRef.current = requestedId;
        setPeriod("all");
        setCategoryFilter("all");
        setSelectedExpense(target);
        setEditorVersion((version) => version + 1);
        setOperationError("");
        setIsEditorOpen(true);
      }
    }

    checkRequestedExpense();
    window.addEventListener("popstate", checkRequestedExpense);
    return () => window.removeEventListener("popstate", checkRequestedExpense);
  }, [isLoading, expenses]);

  useEffect(() => {
    function refreshDate() {
      setCurrentDate(new Date());
    }

    refreshDate();
    window.addEventListener("focus", refreshDate);
    return () => window.removeEventListener("focus", refreshDate);
  }, []);

  const customRangeValid =
    period !== "custom" ||
    (isDateKey(customStart) && isDateKey(customEnd) && customStart <= customEnd);
  const dateRange = currentDate
    ? getExpenseDateRange(period, currentDate, customStart, customEnd)
    : null;
  const rangeReady = period === "all" || currentDate !== null;
  const periodExpenses =
    customRangeValid && rangeReady
      ? filterExpensesByDateRange(expenses, dateRange)
      : [];
  const summary = summarizeExpenses(periodExpenses);
  const sortedExpenses = periodExpenses
    .filter(
      (expense) =>
        categoryFilter === "all" ||
        getExpenseCategory(expense) === categoryFilter,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const rangeLabel =
    period === "all"
      ? "All recorded dates"
      : dateRange
        ? `${formatDateKey(dateRange.startDate)} – ${formatDateKey(dateRange.endDate)}`
        : "";

  function openCreate() {
    setSelectedExpense(null);
    setEditorVersion((version) => version + 1);
    setOperationError("");
    setIsEditorOpen(true);
  }

  function openEdit(expense: ExpenseRecord) {
    setSelectedExpense(expense);
    setEditorVersion((version) => version + 1);
    setOperationError("");
    setIsEditorOpen(true);
  }

  function changePeriod(value: string) {
    if (!isExpensePeriod(value)) return;
    setPeriod(value);
    if (value === "custom" && (!customStart || !customEnd)) {
      const today = getLocalDateKey(new Date());
      setCustomStart(`${today.slice(0, 7)}-01`);
      setCustomEnd(today);
    }
  }

  function changeCategory(value: string) {
    if (value === "all") {
      setCategoryFilter("all");
    } else if (isExpenseCategory(value)) {
      setCategoryFilter(value);
    }
  }

  async function saveExpense(input: ExpenseInput) {
    if (selectedExpense) {
      await updateExpense(selectedExpense.id, input);
    } else {
      await createExpense(input);
    }
    setIsEditorOpen(false);
  }

  async function removeExpense(expense: ExpenseRecord) {
    if (
      !window.confirm(
        `Delete “${expense.description}”? This cannot be undone.`,
      )
    ) {
      return;
    }

    setOperationError("");
    try {
      await deleteExpense(expense.id);
    } catch (deleteError) {
      setOperationError(
        deleteError instanceof Error
          ? deleteError.message
          : "The expense could not be deleted.",
      );
    }
  }

  return (
    <div className="data-screen finance-screen">
      <ScreenHeader
        action={
          <button className="capture-submit" onClick={openCreate} type="button">
            + Log expense
          </button>
        }
        description="A simple record of what has gone out."
        kicker="YOUR SPACE"
        title="Finance"
      />

      <div className="finance-controls">
        <label className="finance-select-control">
          <span>Period</span>
          <select onChange={(event) => changePeriod(event.target.value)} value={period}>
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {period === "custom" && (
          <div className="finance-date-range">
            <label className="finance-select-control">
              <span>From</span>
              <input
                aria-label="Start date"
                onChange={(event) => setCustomStart(event.target.value)}
                type="date"
                value={customStart}
              />
            </label>
            <label className="finance-select-control">
              <span>To</span>
              <input
                aria-label="End date"
                onChange={(event) => setCustomEnd(event.target.value)}
                type="date"
                value={customEnd}
              />
            </label>
          </div>
        )}
      </div>

      {error && <ErrorNotice message={error} onRetry={reload} />}
      {operationError && <ErrorNotice message={operationError} />}

      {isLoading ? (
        <LoadingState label="Loading expenses from this device..." />
      ) : (
        <>
          {period === "custom" && !customRangeValid && (
            <p aria-live="polite" className="finance-range-error" role="status">
              Choose a valid start and end date.
            </p>
          )}

          <div className="finance-overview-grid">
            <div className="finance-summary-column">
              <section
                aria-label={`Spending ${formatCurrency(summary.total, preferences.currency)} across ${summary.count} expenses`}
                className="finance-total"
              >
                <span className="finance-total-label">Period spending</span>
                <strong>
                  {formatCurrency(summary.total, preferences.currency)}
                </strong>
                <div className="finance-total-meta">
                  <span>
                    {summary.count}{" "}
                    {summary.count === 1 ? "expense" : "expenses"}
                  </span>
                  <span>{rangeLabel}</span>
                </div>
              </section>

              <section
                aria-labelledby="finance-breakdown-heading"
                className="finance-breakdown"
              >
                <div className="finance-section-heading">
                  <h2 id="finance-breakdown-heading">By category</h2>
                </div>
                {summary.categories.length ? (
                  <ul className="finance-category-list">
                    {summary.categories.map(({ category, amount }) => {
                      const share =
                        summary.total > 0
                          ? Math.min(100, (amount / summary.total) * 100)
                          : 0;
                      return (
                        <li className="finance-category-item" key={category}>
                          <div className="finance-category-row">
                            <span>{category}</span>
                            <strong>
                              {formatCurrency(amount, preferences.currency)}
                            </strong>
                          </div>
                          <div
                            aria-hidden="true"
                            className="finance-category-track"
                          >
                            <span style={{ width: `${share}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="finance-breakdown-empty">
                    Category totals appear when you log an expense in this
                    period.
                  </p>
                )}
              </section>
            </div>

            <section
              aria-labelledby="recent-expenses-heading"
              className="finance-recent-section"
            >
              <div className="finance-section-heading finance-recent-heading">
                <h2 id="recent-expenses-heading">Recent expenses</h2>
                <label className="finance-select-control finance-category-filter">
                  <span>Category</span>
                  <select
                    aria-label="Filter expenses by category"
                    onChange={(event) => changeCategory(event.target.value)}
                    value={categoryFilter}
                  >
                    <option value="all">All categories</option>
                    {expenseCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {customRangeValid && sortedExpenses.length ? (
                <ul className="expense-list">
                  {sortedExpenses.map((expense) => (
                    <li className="expense-row" key={expense.id}>
                      <div className="expense-main">
                        <span className="expense-description">
                          {expense.description}
                        </span>
                        <div className="expense-meta">
                          <time
                            className="record-date"
                            dateTime={expense.createdAt}
                          >
                            {formatLocalDate(expense.createdAt)}
                          </time>
                          <span className="expense-category">
                            {getExpenseCategory(expense)}
                          </span>
                        </div>
                      </div>
                      <strong className="expense-amount">
                        {formatCurrency(
                          Number(expense.amount),
                          preferences.currency,
                        )}
                      </strong>
                      <div className="record-actions">
                        <button
                          aria-label={`Edit ${expense.description}`}
                          onClick={() => openEdit(expense)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          aria-label={`Delete ${expense.description}`}
                          onClick={() => void removeExpense(expense)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : customRangeValid ? (
                <EmptyState
                  action={
                    periodExpenses.length ? (
                      <button
                        className="text-button"
                        onClick={() => setCategoryFilter("all")}
                        type="button"
                      >
                        Show all categories
                      </button>
                    ) : (
                      <button
                        className="text-button"
                        onClick={openCreate}
                        type="button"
                      >
                        Log an expense
                      </button>
                    )
                  }
                  description={
                    periodExpenses.length
                      ? "Try another category or return to all categories."
                      : "Expenses you log will appear here and in the period total."
                  }
                  title={
                    periodExpenses.length
                      ? "No expenses in this category."
                      : expenses.length
                        ? "No expenses in this period."
                        : "Nothing logged yet."
                  }
                />
              ) : null}
            </section>
          </div>
        </>
      )}

      <p className="local-data-footnote">
        Amounts in {preferences.currency}. Saved only on this device.
      </p>

      <ModalDialog
        description="Keep an accurate, private record of this expense."
        onClose={() => setIsEditorOpen(false)}
        open={isEditorOpen}
        title={selectedExpense ? "Edit expense" : "Add expense"}
      >
        <ExpenseEditor
          key={`${selectedExpense?.id ?? "new-expense"}-${editorVersion}`}
          expense={selectedExpense}
          onSave={saveExpense}
          currency={preferences.currency}
        />
      </ModalDialog>
    </div>
  );
}
