"use client";

import { useState } from "react";
import {
  EmptyState,
  ErrorNotice,
  LoadingState,
  ScreenHeader,
} from "@/components/local-data-ui";
import { GoalEditor, GoalProgressEditor } from "@/components/goal-editor";
import { ModalDialog } from "@/components/modal-dialog";
import { useLocalRecords } from "@/hooks/use-local-records";
import {
  calculateGoalProgress,
  createGoal,
  deleteGoal,
  formatGoalValue,
  goalLifeAreas,
  isGoalLifeArea,
  listGoals,
  updateGoal,
  type GoalInput,
  type GoalLifeArea,
  type GoalRecord,
  type GoalStatus,
} from "@/lib/local-data";
import { formatDateKey } from "@/lib/local-date";

type DialogMode = "closed" | "form" | "detail";

const statusFilters: { value: GoalStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

function statusLabel(status: GoalStatus) {
  return status[0].toUpperCase() + status.slice(1);
}

function GoalSummary({
  goal,
  onOpen,
}: {
  goal: GoalRecord;
  onOpen: () => void;
}) {
  const percentage = calculateGoalProgress(
    goal.currentValue,
    goal.targetValue,
  );

  return (
    <li className="goal-row">
      <button
        aria-label={`Open ${goal.title} details`}
        className="goal-summary"
        onClick={onOpen}
        type="button"
      >
        <span className="goal-summary-heading">
          <span className="goal-summary-title">{goal.title}</span>
          <span className={`goal-status goal-status-${goal.status}`}>
            {statusLabel(goal.status)}
          </span>
        </span>
        {goal.description?.trim() && (
          <span className="goal-summary-description">
            {goal.description}
          </span>
        )}
        <span className="goal-summary-meta">
          <span>{goal.lifeArea}</span>
          {goal.targetDate ? (
            <span>Target {formatDateKey(goal.targetDate)}</span>
          ) : (
            <span>No target date</span>
          )}
        </span>
        <span className="goal-summary-progress">
          <span className="goal-progress-copy">
            <span>
              {formatGoalValue(goal.currentValue, goal.unit)} /{" "}
              {formatGoalValue(goal.targetValue, goal.unit)}
            </span>
            <span>{percentage}%</span>
          </span>
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
        </span>
      </button>
      <span aria-hidden="true" className="goal-row-affordance">
        Details
      </span>
    </li>
  );
}

export function GoalsScreen() {
  const goals = useLocalRecords("goals", listGoals);
  const [statusFilter, setStatusFilter] = useState<GoalStatus>("active");
  const [lifeAreaFilter, setLifeAreaFilter] = useState<
    GoalLifeArea | "all"
  >("all");
  const [dialogMode, setDialogMode] = useState<DialogMode>("closed");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [operationError, setOperationError] = useState("");

  const selectedGoal =
    goals.records.find((goal) => goal.id === selectedGoalId) ?? null;
  const statusCounts = {
    active: goals.records.filter((goal) => goal.status === "active").length,
    completed: goals.records.filter((goal) => goal.status === "completed")
      .length,
    archived: goals.records.filter((goal) => goal.status === "archived").length,
  };
  const visibleGoals = goals.records
    .filter((goal) => goal.status === statusFilter)
    .filter(
      (goal) => lifeAreaFilter === "all" || goal.lifeArea === lifeAreaFilter,
    )
    .sort((a, b) => {
      if (statusFilter === "active") {
        if (a.targetDate && b.targetDate) {
          return (
            a.targetDate.localeCompare(b.targetDate) ||
            b.updatedAt.localeCompare(a.updatedAt)
          );
        }
        if (a.targetDate) return -1;
        if (b.targetDate) return 1;
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  function closeDialog() {
    setDialogMode("closed");
    setSelectedGoalId(null);
    setOperationError("");
  }

  function openGoalDetails(goalId: string) {
    setSelectedGoalId(goalId);
    setOperationError("");
    setDialogMode("detail");
  }

  function openGoalEditor(goal: GoalRecord | null = null) {
    setSelectedGoalId(goal?.id ?? null);
    setOperationError("");
    setDialogMode("form");
  }

  async function saveGoal(input: GoalInput) {
    if (selectedGoalId) {
      await updateGoal(selectedGoalId, input);
      setDialogMode("detail");
      return;
    }

    await createGoal(input);
    closeDialog();
  }

  async function saveProgress(currentValue: number) {
    if (!selectedGoal) {
      throw new Error("This goal is no longer available.");
    }
    await updateGoal(selectedGoal.id, { currentValue });
  }

  async function changeStatus(status: GoalStatus) {
    if (!selectedGoal) return;
    setOperationError("");
    try {
      await updateGoal(selectedGoal.id, { status });
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "The goal status could not be updated.",
      );
    }
  }

  async function removeGoal() {
    if (!selectedGoal) return;
    if (
      !window.confirm(
        `Delete “${selectedGoal.title}”? This cannot be undone.`,
      )
    ) {
      return;
    }

    setOperationError("");
    try {
      await deleteGoal(selectedGoal.id);
      closeDialog();
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "The goal could not be deleted.",
      );
    }
  }

  function changeLifeArea(value: string) {
    setLifeAreaFilter(value === "all" || isGoalLifeArea(value) ? value : "all");
  }

  const dialogTitle =
    dialogMode === "form"
      ? selectedGoal
        ? "Edit goal"
        : "New goal"
      : selectedGoal?.title ?? "Goal details";
  const dialogDescription =
    dialogMode === "form"
      ? "Shape a goal around what matters to you."
      : "A focused view of your goal and its progress.";

  return (
    <div className="data-screen goal-screen">
      <ScreenHeader
        action={
          <button
            className="capture-submit"
            onClick={() => openGoalEditor()}
            type="button"
          >
            + New goal
          </button>
        }
        description="A steady view of what you are working toward."
        kicker="YOUR SPACE"
        title="Goals"
      />

      {goals.error && (
        <ErrorNotice message={goals.error} onRetry={goals.reload} />
      )}
      {operationError && dialogMode === "closed" && (
        <ErrorNotice message={operationError} />
      )}

      <div className="goal-filters">
        <div
          aria-label="Filter goals by status"
          className="record-filters"
          role="group"
        >
          {statusFilters.map(({ value, label }) => (
            <button
              aria-pressed={statusFilter === value}
              className={
                statusFilter === value
                  ? "record-filter is-active"
                  : "record-filter"
              }
              key={value}
              onClick={() => setStatusFilter(value)}
              type="button"
            >
              {label} <span>{statusCounts[value]}</span>
            </button>
          ))}
        </div>

        <label className="goal-area-control">
          <span>Life area</span>
          <select
            aria-label="Filter goals by life area"
            onChange={(event) => changeLifeArea(event.target.value)}
            value={lifeAreaFilter}
          >
            <option value="all">All areas</option>
            {goalLifeAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
      </div>

      {goals.isLoading ? (
        <LoadingState label="Loading goals from this device..." />
      ) : goals.error ? null : visibleGoals.length ? (
        <ul className="goal-list">
          {visibleGoals.map((goal) => (
            <GoalSummary
              goal={goal}
              key={goal.id}
              onOpen={() => openGoalDetails(goal.id)}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          action={
            statusFilter === "active" ? (
              <button
                className="text-button"
                onClick={() => openGoalEditor()}
                type="button"
              >
                Create a goal
              </button>
            ) : undefined
          }
          description={
            statusFilter === "active"
              ? "Goals you create will appear here. No sample goals are added."
              : `There are no ${statusFilter} goals in this area.`
          }
          title={
            statusFilter === "active"
              ? "A direction, at your own pace."
              : "Nothing here yet."
          }
        />
      )}

      <p className="local-data-footnote">
        Progress is calculated from your current and target values. Saved only
        on this device.
      </p>

      <ModalDialog
        description={dialogDescription}
        onClose={closeDialog}
        open={dialogMode !== "closed"}
        title={dialogTitle}
      >
        {dialogMode === "form" && (
          <GoalEditor
            goal={selectedGoal}
            key={selectedGoal?.id ?? "new-goal"}
            onSave={saveGoal}
          />
        )}
        {dialogMode === "detail" &&
          (selectedGoal ? (
            <div className="goal-detail">
              {selectedGoal.description?.trim() ? (
                <p className="goal-detail-description">
                  {selectedGoal.description}
                </p>
              ) : (
                <p className="goal-detail-description goal-description-empty">
                  No description added.
                </p>
              )}

              <div className="goal-detail-meta">
                <span>{selectedGoal.lifeArea}</span>
                <span className={`goal-status goal-status-${selectedGoal.status}`}>
                  {statusLabel(selectedGoal.status)}
                </span>
              </div>

              <div className="goal-detail-dates">
                {selectedGoal.startDate && (
                  <span>Started {formatDateKey(selectedGoal.startDate)}</span>
                )}
                {selectedGoal.targetDate ? (
                  <span>Target {formatDateKey(selectedGoal.targetDate)}</span>
                ) : (
                  <span>No target date</span>
                )}
              </div>

              <div className="goal-detail-progress">
                <div className="goal-progress-copy">
                  <span>
                    {formatGoalValue(
                      selectedGoal.currentValue,
                      selectedGoal.unit,
                    )}{" "}
                    of{" "}
                    {formatGoalValue(
                      selectedGoal.targetValue,
                      selectedGoal.unit,
                    )}
                  </span>
                  <span>
                    {calculateGoalProgress(
                      selectedGoal.currentValue,
                      selectedGoal.targetValue,
                    )}
                    %
                  </span>
                </div>
                <span
                  aria-label={`${calculateGoalProgress(
                    selectedGoal.currentValue,
                    selectedGoal.targetValue,
                  )}% complete`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={calculateGoalProgress(
                    selectedGoal.currentValue,
                    selectedGoal.targetValue,
                  )}
                  className="goal-progress-track"
                  role="progressbar"
                >
                  <span
                    style={{
                      width: `${calculateGoalProgress(
                        selectedGoal.currentValue,
                        selectedGoal.targetValue,
                      )}%`,
                    }}
                  />
                </span>
              </div>

              {selectedGoal.status !== "archived" && (
                <details className="goal-progress-disclosure">
                  <summary>Update progress</summary>
                  <GoalProgressEditor
                    goal={selectedGoal}
                    key={`${selectedGoal.id}-${selectedGoal.updatedAt}`}
                    onSave={saveProgress}
                  />
                </details>
              )}

              <div className="goal-detail-actions">
                <button
                  className="text-button"
                  onClick={() => openGoalEditor(selectedGoal)}
                  type="button"
                >
                  Edit
                </button>
                {selectedGoal.status === "active" && (
                  <button
                    className="text-button"
                    onClick={() => void changeStatus("completed")}
                    type="button"
                  >
                    Mark complete
                  </button>
                )}
                {selectedGoal.status === "completed" && (
                  <button
                    className="text-button"
                    onClick={() => void changeStatus("active")}
                    type="button"
                  >
                    Reopen
                  </button>
                )}
                {selectedGoal.status === "archived" ? (
                  <button
                    className="text-button"
                    onClick={() => void changeStatus("active")}
                    type="button"
                  >
                    Restore
                  </button>
                ) : (
                  <button
                    className="text-button"
                    onClick={() => void changeStatus("archived")}
                    type="button"
                  >
                    Archive
                  </button>
                )}
                <button
                  className="text-button destructive-text"
                  onClick={() => void removeGoal()}
                  type="button"
                >
                  Delete
                </button>
              </div>

              {operationError && <ErrorNotice message={operationError} />}
            </div>
          ) : (
            <ErrorNotice message="This goal is no longer available." />
          ))}
      </ModalDialog>
    </div>
  );
}
