import { createLocalRepository } from "@/lib/local-data/repository";
import type { CreateRecord } from "@/lib/local-data/models/common";
import type { TaskRecord } from "@/lib/local-data/models/task";
import { requireNonBlank } from "@/lib/local-data/validation";

const taskRepository = createLocalRepository<TaskRecord>("tasks", (task) => {
  requireNonBlank(task.title, "Task title");
  if (
    task.priority !== undefined &&
    !["low", "medium", "high"].includes(task.priority)
  ) {
    throw new Error("Choose a valid task priority.");
  }
  if (task.projectId !== undefined) {
    requireNonBlank(task.projectId, "Project");
  }
});

export function createTask(data: CreateRecord<TaskRecord>): Promise<TaskRecord> {
  return taskRepository.create({
    ...data,
    priority: data.priority ?? "medium",
  });
}

export const getTask = taskRepository.get;
export const listTasks = taskRepository.list;
export const updateTask = taskRepository.update;
export const deleteTask = taskRepository.delete;
