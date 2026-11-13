import { createLocalRepository, runLocalTransaction } from "@/lib/local-data/repository";
import type { ProjectRecord } from "@/lib/local-data/models/project";
import type { TaskRecord } from "@/lib/local-data/models/task";
import { requireNonBlank } from "@/lib/local-data/validation";

const projectRepository = createLocalRepository<ProjectRecord>(
  "projects",
  (project) => {
    requireNonBlank(project.name, "Project name");
    if (typeof project.description !== "string") {
      throw new Error("Project description must be text.");
    }
    if (!["active", "paused", "completed"].includes(project.status)) {
      throw new Error("Choose a valid project status.");
    }
    if (
      project.dueAt !== undefined &&
      (!project.dueAt || Number.isNaN(Date.parse(project.dueAt)))
    ) {
      throw new Error("Choose a valid project due date.");
    }
  },
);

export const createProject = projectRepository.create;
export const getProject = projectRepository.get;
export const listProjects = projectRepository.list;
export const updateProject = projectRepository.update;

export function deleteProjectAndUnassignTasks(projectId: string): Promise<void> {
  return runLocalTransaction<void>(
    ["projects", "tasks"],
    "readwrite",
    (projectStore, setResult, fail, transaction) => {
      const getProjectRequest = projectStore.get(projectId);
      getProjectRequest.onsuccess = () => {
        if (!getProjectRequest.result) {
          fail(new Error("No project found with that ID."));
          return;
        }

        const taskStore = transaction.objectStore("tasks");
        const getTasksRequest = taskStore.getAll();
        getTasksRequest.onsuccess = () => {
          const tasks = getTasksRequest.result as TaskRecord[];
          for (const task of tasks) {
            if (task.projectId !== projectId) continue;

            const unassignedTask = { ...task };
            Reflect.deleteProperty(unassignedTask, "projectId");
            taskStore.put(unassignedTask);
          }

          const deleteRequest = projectStore.delete(projectId);
          deleteRequest.onsuccess = () => setResult(undefined);
        };
      };
    },
  );
}

export type ProjectProgress = {
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  nextTask?: TaskRecord;
};

export function getProjectProgress(
  projectId: string,
  tasks: TaskRecord[],
): ProjectProgress {
  const projectTasks = tasks.filter((task) => task.projectId === projectId);
  const openTasks = projectTasks
    .filter((task) => !task.completed)
    .sort((a, b) => {
      if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt);
      if (a.dueAt) return -1;
      if (b.dueAt) return 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
  const completedTasks = projectTasks.filter((task) => task.completed).length;

  return {
    totalTasks: projectTasks.length,
    completedTasks,
    percentage: projectTasks.length
      ? Math.round((completedTasks / projectTasks.length) * 100)
      : 0,
    nextTask: openTasks[0],
  };
}
