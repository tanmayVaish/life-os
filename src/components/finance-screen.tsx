"use client";

import { useState, type FormEvent } from "react";
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
  listExpenses,
  type ExpenseRecord,
  updateExpense,
} from "@/lib/local-data";
import { formatCurrency, formatLocalDate } from "@/lib/formatters";
import type { CurrencyPreference } from "@/lib/preferences";

type ExpenseInput = { description: string; amount: string; notes?: string };

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
        <span>Notes <span className="optional-label">Optional</span></span>
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
  const [operationError, setOperationError] = useState("");

  const sortedExpenses = [...expenses].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const total = expenses.reduce((sum, expense) => {
    const amount = Number(expense.amount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  function openCreate() {
    setSelectedExpense(null);
    setOperationError("");
    setIsEditorOpen(true);
  }

  function openEdit(expense: ExpenseRecord) {
    setSelectedExpense(expense);
    setOperationError("");
    setIsEditorOpen(true);
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
    <div className="data-screen">
      <ScreenHeader
        action={
          <button className="capture-submit" onClick={openCreate} type="button">
            + Add expense
          </button>
        }
        description="A simple record of what has gone out."
        kicker="YOUR SPACE"
        title="Finance"
      />

      <div
        aria-label={`Total expenses ${formatCurrency(total, preferences.currency)}`}
        className="finance-total"
      >
        <span>Total expenses</span>
        <strong>{formatCurrency(total, preferences.currency)}</strong>
      </div>

      {error && <ErrorNotice message={error} onRetry={reload} />}
      {operationError && <ErrorNotice message={operationError} />}

      {isLoading ? (
        <LoadingState label="Loading expenses from this device..." />
      ) : sortedExpenses.length ? (
        <ul className="expense-list">
          {sortedExpenses.map((expense) => (
            <li className="expense-row" key={expense.id}>
              <div className="expense-main">
                <span className="expense-description">{expense.description}</span>
                <time className="record-date" dateTime={expense.createdAt}>
                  {formatLocalDate(expense.createdAt)}
                </time>
              </div>
              <strong className="expense-amount">
                {formatCurrency(Number(expense.amount), preferences.currency)}
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
      ) : (
        <EmptyState
          action={
            <button className="text-button" onClick={openCreate} type="button">
              Add an expense
            </button>
          }
          description="Expenses captured here or with Quick Capture will appear in this list."
          title="No expenses recorded."
        />
      )}

      <p className="local-data-footnote">
        Amounts are shown in {preferences.currency}. Your records stay on this
        device.
      </p>

      <ModalDialog
        description="Keep an accurate, private record of this expense."
        onClose={() => setIsEditorOpen(false)}
        open={isEditorOpen}
        title={selectedExpense ? "Edit expense" : "Add expense"}
      >
        <ExpenseEditor
          key={selectedExpense?.id ?? "new-expense"}
          expense={selectedExpense}
          onSave={saveExpense}
          currency={preferences.currency}
        />
      </ModalDialog>
    </div>
  );
}
