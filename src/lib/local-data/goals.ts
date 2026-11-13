import { createLocalRepository } from "@/lib/local-data/repository";
import {
  goalLifeAreas,
  type GoalLifeArea,
  type GoalInput,
  type GoalRecord,
} from "@/lib/local-data/models/goal";
import { isDateKey } from "@/lib/local-date";
import { requireNonBlank } from "@/lib/local-data/validation";

export function isGoalLifeArea(value: string): value is GoalLifeArea {
  return goalLifeAreas.some((area) => area === value);
}

function validateGoal(goal: GoalRecord) {
  requireNonBlank(goal.title, "Goal title");
  if (goal.description !== undefined && typeof goal.description !== "string") {
    throw new Error("Goal description must be text.");
  }
  if (!isGoalLifeArea(goal.lifeArea)) {
    throw new Error("Choose a valid life area.");
  }
  if (!Number.isFinite(goal.currentValue) || goal.currentValue < 0) {
    throw new Error("Current value must be a non-negative number.");
  }
  if (!Number.isFinite(goal.targetValue) || goal.targetValue <= 0) {
    throw new Error("Target value must be a number greater than zero.");
  }
  if (goal.unit !== undefined && typeof goal.unit !== "string") {
    throw new Error("Goal unit must be text.");
  }
  if (goal.startDate !== undefined && !isDateKey(goal.startDate)) {
    throw new Error("Choose a valid start date.");
  }
  if (goal.targetDate !== undefined && !isDateKey(goal.targetDate)) {
    throw new Error("Choose a valid target date.");
  }
  if (!["active", "completed", "archived"].includes(goal.status)) {
    throw new Error("Choose a valid goal status.");
  }
}

const goalRepository = createLocalRepository<GoalRecord>("goals", validateGoal);

export function createGoal(data: GoalInput): Promise<GoalRecord> {
  return goalRepository.create(data);
}
export const getGoal = goalRepository.get;
export const listGoals = goalRepository.list;
export const updateGoal = goalRepository.update;
export const deleteGoal = goalRepository.delete;

export function calculateGoalProgress(
  currentValue: number,
  targetValue: number,
): number {
  if (
    !Number.isFinite(currentValue) ||
    !Number.isFinite(targetValue) ||
    targetValue <= 0
  ) {
    return 0;
  }

  return Math.round(
    Math.min(100, Math.max(0, (currentValue / targetValue) * 100)),
  );
}

export function formatGoalValue(value: number, unit?: string): string {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);

  if (!unit?.trim()) return formatted;
  return unit.trim() === "₹"
    ? `${unit.trim()}${formatted}`
    : `${formatted} ${unit.trim()}`;
}
