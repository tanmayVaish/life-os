"use client";

import { useState, type FormEvent } from "react";
import { ErrorNotice } from "@/components/local-data-ui";
import { calculateGoalProgress } from "@/lib/local-data";
import type {
  GoalInput,
  GoalRecord,
} from "@/lib/local-data";
import { goalLifeAreas, isGoalLifeArea } from "@/lib/local-data";

function previewGoalProgress(
  currentValueText: string,
  targetValueText: string,
): number | null {
  if (!currentValueText.trim() || !targetValueText.trim()) return null;
  const currentValue = Number(currentValueText);
  const targetValue = Number(targetValueText);
  if (
    !Number.isFinite(currentValue) ||
    currentValue < 0 ||
    !Number.isFinite(targetValue) ||
    targetValue <= 0
  ) {
    return null;
  }
  return calculateGoalProgress(currentValue, targetValue);
}

function GoalProgressPreview({ percentage }: { percentage: number | null }) {
  return (
    <div aria-live="polite" className="goal-progress-preview">
      <div className="goal-progress-copy">
        <span>Progress preview</span>
        <span>{percentage === null ? "—" : `${percentage}%`}</span>
      </div>
      {percentage === null ? (
        <span aria-hidden="true" className="goal-progress-track">
          <span />
        </span>
      ) : (
        <span
          aria-label={`${percentage}% complete`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={percentage}
          className="goal-progress-track"
          role="progressbar"
        >
          <span style={{ width: `${percentage}%` }} />
        </span>
      )}
    </div>
  );
}

type GoalEditorProps = {
  goal: GoalRecord | null;
  onSave: (input: GoalInput) => Promise<void>;
};

export function GoalEditor({ goal, onSave }: GoalEditorProps) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [lifeArea, setLifeArea] = useState(goal?.lifeArea ?? "Personal");
  const [currentValue, setCurrentValue] = useState(
    String(goal?.currentValue ?? 0),
  );
  const [targetValue, setTargetValue] = useState(
    String(goal?.targetValue ?? ""),
  );
  const [unit, setUnit] = useState(goal?.unit ?? "");
  const [startDate, setStartDate] = useState(goal?.startDate ?? "");
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const progressPreview = previewGoalProgress(currentValue, targetValue);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const current = Number(currentValue);
    const target = Number(targetValue);

    if (!trimmedTitle) {
      setError("Add a title for this goal.");
      return;
    }
    if (
      currentValue.trim() === "" ||
      !Number.isFinite(current) ||
      current < 0
    ) {
      setError("Current value must be a non-negative number.");
      return;
    }
    if (
      targetValue.trim() === "" ||
      !Number.isFinite(target) ||
      target <= 0
    ) {
      setError("Target value must be greater than zero.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      await onSave({
        title: trimmedTitle,
        description: description.trim() || undefined,
        lifeArea,
        currentValue: current,
        targetValue: target,
        unit: unit.trim() || undefined,
        startDate: startDate || undefined,
        targetDate: targetDate || undefined,
        status: goal?.status ?? "active",
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The goal could not be saved on this device.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="record-form goal-editor" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Goal title</span>
        <input
          autoFocus
          onChange={(event) => setTitle(event.target.value)}
          required
          value={title}
        />
      </label>

      <label className="capture-field">
        <span>
          Description <span className="optional-label">Optional</span>
        </span>
        <textarea
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          value={description}
        />
      </label>

      <label className="capture-field">
        <span>Life area</span>
        <select
          onChange={(event) => {
            const value = event.target.value;
            if (isGoalLifeArea(value)) setLifeArea(value);
          }}
          value={lifeArea}
        >
          {goalLifeAreas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </label>

      <div className="goal-value-fields">
        <label className="capture-field">
          <span>Current value</span>
          <input
            min="0"
            onChange={(event) => setCurrentValue(event.target.value)}
            required
            step="any"
            type="number"
            value={currentValue}
          />
        </label>
        <label className="capture-field">
          <span>Target value</span>
          <input
            min="0"
            onChange={(event) => setTargetValue(event.target.value)}
            required
            step="any"
            type="number"
            value={targetValue}
          />
        </label>
      </div>
      <GoalProgressPreview percentage={progressPreview} />

      <label className="capture-field">
        <span>
          Unit <span className="optional-label">Optional</span>
        </span>
        <input
          onChange={(event) => setUnit(event.target.value)}
          placeholder="Books, km, hours, ₹"
          value={unit}
        />
      </label>

      <div className="goal-value-fields">
        <label className="capture-field">
          <span>
            Start date <span className="optional-label">Optional</span>
          </span>
          <input
            onChange={(event) => setStartDate(event.target.value)}
            type="date"
            value={startDate}
          />
        </label>
        <label className="capture-field">
          <span>
            Target date <span className="optional-label">Optional</span>
          </span>
          <input
            onChange={(event) => setTargetDate(event.target.value)}
            type="date"
            value={targetDate}
          />
        </label>
      </div>

      {error && <ErrorNotice message={error} />}

      <div className="record-form-footer">
        <span>Saved only on this device.</span>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : goal ? "Save changes" : "Create goal"}
        </button>
      </div>
    </form>
  );
}

export function GoalProgressEditor({
  goal,
  onSave,
}: {
  goal: GoalRecord;
  onSave: (currentValue: number) => Promise<void>;
}) {
  const [currentValue, setCurrentValue] = useState(String(goal.currentValue));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const progressPreview = previewGoalProgress(
    currentValue,
    String(goal.targetValue),
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(currentValue);
    if (
      currentValue.trim() === "" ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      setError("Current value must be a non-negative number.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      await onSave(value);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Progress could not be updated.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="goal-progress-form" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Current value{goal.unit ? ` (${goal.unit})` : ""}</span>
        <input
          min="0"
          onChange={(event) => setCurrentValue(event.target.value)}
          required
          step="any"
          type="number"
          value={currentValue}
        />
      </label>
      <GoalProgressPreview percentage={progressPreview} />
      {error && <ErrorNotice message={error} />}
      <button className="capture-submit" disabled={isSaving} type="submit">
        {isSaving ? "Saving..." : "Save progress"}
      </button>
    </form>
  );
}
