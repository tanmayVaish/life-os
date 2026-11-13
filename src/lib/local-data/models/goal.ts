import type { LocalRecord } from "@/lib/local-data/models/common";

export const goalLifeAreas = [
  "Personal",
  "Health",
  "Career",
  "Learning",
  "Finance",
  "Relationships",
  "Other",
] as const;

export type GoalLifeArea = (typeof goalLifeAreas)[number];
export type GoalStatus = "active" | "completed" | "archived";

export type GoalRecord = LocalRecord & {
  title: string;
  description?: string;
  lifeArea: GoalLifeArea;
  currentValue: number;
  targetValue: number;
  unit?: string;
  startDate?: string;
  targetDate?: string;
  status: GoalStatus;
};

export type GoalInput = Pick<
  GoalRecord,
  | "title"
  | "description"
  | "lifeArea"
  | "currentValue"
  | "targetValue"
  | "unit"
  | "startDate"
  | "targetDate"
  | "status"
>;
