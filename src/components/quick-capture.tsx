"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import {
  createExpense,
  createNote,
  createTask,
} from "@/lib/local-data";
import { ModalDialog } from "@/components/modal-dialog";

type CaptureType = "task" | "note" | "expense";

type CapturePreview = {
  type: CaptureType;
  content: string;
  amount?: string;
};

const captureTypes: CaptureType[] = ["task", "note", "expense"];

const capturePrompts: Record<CaptureType, string> = {
  task: "What do you need to do?",
  note: "What would you like to remember?",
  expense: "What was the expense for?",
};

export function QuickCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [captureType, setCaptureType] = useState<CaptureType>("task");
  const [content, setContent] = useState("");
  const [amount, setAmount] = useState("");
  const [preview, setPreview] = useState<CapturePreview | null>(null);
  const [validationMessage, setValidationMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        setIsOpen(true);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = window.setTimeout(() => setSuccessMessage(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  function closeCapture() {
    setIsOpen(false);
    setPreview(null);
    setValidationMessage("");
    setErrorMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setPreview(null);
      setValidationMessage("Add a few words before previewing.");
      return;
    }
    if (
      captureType === "expense" &&
      (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0)
    ) {
      setPreview(null);
      setValidationMessage("Enter an expense amount greater than zero.");
      return;
    }

    setValidationMessage("");
    setErrorMessage("");
    setPreview({
      type: captureType,
      content: trimmedContent,
      ...(captureType === "expense" ? { amount } : {}),
    });
  }

  async function savePreview() {
    if (!preview || isSaving) return;

    setIsSaving(true);
    setErrorMessage("");
    try {
      switch (preview.type) {
        case "task":
          await createTask({ title: preview.content, completed: false });
          break;
        case "note":
          await createNote({ content: preview.content });
          break;
        case "expense":
          if (!preview.amount) {
            throw new Error("Enter an expense amount before saving.");
          }
          await createExpense({
            description: preview.content,
            amount: preview.amount,
          });
          break;
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The record could not be saved on this device.",
      );
      return;
    } finally {
      setIsSaving(false);
    }

    const savedType = preview.type;
    setIsOpen(false);
    setPreview(null);
    setContent("");
    setAmount("");
    setCaptureType("task");
    setSuccessMessage(
      `${savedType[0].toUpperCase()}${savedType.slice(1)} saved on this device.`,
    );
  }

  return (
    <>
      <button
        aria-label="Quick capture"
        className="capture-trigger"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Icon name="plus" />
        <span>Capture</span>
        <kbd>⌘ J</kbd>
      </button>

      <ModalDialog
        description="A small thought, task, or expense. Nothing is saved yet."
        onClose={closeCapture}
        open={isOpen}
        title="Quick capture"
      >
        <form className="capture-form" onSubmit={handleSubmit}>
          <div aria-label="Capture type" className="capture-types" role="group">
            {captureTypes.map((type) => (
              <button
                aria-pressed={captureType === type}
                className={captureType === type ? "capture-type is-selected" : "capture-type"}
                key={type}
                onClick={() => {
                  setCaptureType(type);
                  setPreview(null);
                  setValidationMessage("");
                  setErrorMessage("");
                }}
                type="button"
              >
                {type}
              </button>
            ))}
          </div>

          <label className="capture-field">
            <span>{capturePrompts[captureType]}</span>
            <textarea
              onChange={(event) => {
                setContent(event.target.value);
                setPreview(null);
                setValidationMessage("");
                setErrorMessage("");
              }}
              placeholder="Start with a few words..."
              required
              rows={3}
              value={content}
            />
          </label>

          {captureType === "expense" && (
            <label className="capture-field capture-amount">
              <span>Amount</span>
              <input
                inputMode="decimal"
                min="0.01"
                onChange={(event) => {
                  setAmount(event.target.value);
                  setPreview(null);
                  setValidationMessage("");
                  setErrorMessage("");
                }}
                placeholder="$0.00"
                required
                step="0.01"
                type="number"
                value={amount}
              />
            </label>
          )}

          {validationMessage && (
            <p aria-live="assertive" className="capture-validation" role="alert">
              {validationMessage}
            </p>
          )}

          {errorMessage && (
            <p aria-live="assertive" className="capture-error" role="alert">
              {errorMessage}
            </p>
          )}

          {preview && (
            <div aria-live="polite" className="capture-preview" role="status">
              <span>{preview.type} preview</span>
              <p>{preview.content}</p>
              {preview.amount && <span>Amount: {preview.amount}</span>}
              <small>Ready to save locally. No cloud sync.</small>
            </div>
          )}

          <div className="capture-footer">
            <span className="capture-feedback">
              {preview
                ? "This preview is not saved yet."
                : "Nothing is saved until you confirm."}
            </span>
            {preview ? (
              <button
                className="capture-submit"
                disabled={isSaving}
                onClick={savePreview}
                type="button"
              >
                {isSaving ? "Saving..." : "Save on this device"}
              </button>
            ) : (
              <button className="capture-submit" type="submit">
                Preview capture
              </button>
            )}
          </div>
        </form>
      </ModalDialog>
      {successMessage && (
        <p aria-live="polite" className="save-confirmation" role="status">
          {successMessage}
        </p>
      )}
    </>
  );
}
