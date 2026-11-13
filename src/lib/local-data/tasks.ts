import { createLocalRepository } from "@/lib/local-data/repository";
import type { TaskRecord } from "@/lib/local-data/models/task";
import { requireNonBlank } from "@/lib/local-data/validation";

const taskRepository = createLocalRepository<TaskRecord>("tasks", (task) => {
  requireNonBlank(task.title, "Task title");
});

export const createTask = taskRepository.create;
export const getTask = taskRepository.get;
export const listTasks = taskRepository.list;
export const updateTask = taskRepository.update;
export const deleteTask = taskRepository.delete;
