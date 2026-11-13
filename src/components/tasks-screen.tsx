"use client";

import { useEffect, useState } from "react";
import {
  EmptyState,
  ErrorNotice,
  LoadingState,
  ScreenHeader,
} from "@/components/local-data-ui";
import { ModalDialog } from "@/components/modal-dialog";
import { TaskEditor, type TaskInput } from "@/components/task-editor";
import { TaskRow } from "@/components/task-row";
import { useLocalRecords } from "@/hooks/use-local-records";
import {
  createTask,
  deleteTask,
  listProjects,
  listTasks,
  type TaskPriority,
  type TaskRecord,
  updateTask,
} from "@/lib/local-data";

type TaskView = "today" | "upcoming" | "overdue" | "all" | "completed";
type PriorityFilter = "all" | TaskPriority;
type TaskSort = "dueAt" | "priority" | "createdAt";

const taskViews: { value: TaskView; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "overdue", label: "Overdue" },
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
];

const priorityOrder: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function localDateKey(value: string | Date): string | null {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function taskDateKey(task: TaskRecord): string | null {
  return task.dueAt ? localDateKey(task.dueAt) : null;
}

function tasksForView(
  tasks: TaskRecord[],
  view: TaskView,
  today: string | null,
): TaskRecord[] {
  if (view === "completed") return tasks.filter((task) => task.completed);

  const openTasks = tasks.filter((task) => !task.completed);
  if (view === "all") return openTasks;
  if (!today) return [];

  return openTasks.filter((task) => {
    const due = taskDateKey(task);
    if (!due) return false;
    if (view === "today") return due === today;
    if (view === "upcoming") return due > today;
    return due < today;
  });
}

function compareRecentlyCreated(a: TaskRecord, b: TaskRecord): number {
  return b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
}

function dueTimestamp(task: TaskRecord): number {
  const timestamp = task.dueAt ? Date.parse(task.dueAt) : Number.NaN;
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function compareTasks(a: TaskRecord, b: TaskRecord, sort: TaskSort): number {
  if (sort === "dueAt") {
    return dueTimestamp(a) - dueTimestamp(b) || compareRecentlyCreated(a, b);
  }
  if (sort === "priority") {
    const aPriority = priorityOrder[a.priority ?? "medium"];
    const bPriority = priorityOrder[b.priority ?? "medium"];
    return aPriority - bPriority || dueTimestamp(a) - dueTimestamp(b) ||
      compareRecentlyCreated(a, b);
  }
  return compareRecentlyCreated(a, b);
}

function priorityFilterFor(value: string): PriorityFilter {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : "all";
}

function taskSortFor(value: string): TaskSort {
  return value === "dueAt" || value === "priority" ? value : "createdAt";
}

export function TasksScreen() {
  const {
    records: tasks,
    isLoading,
    error,
    reload,
  } = useLocalRecords("tasks", listTasks);
  const projects = useLocalRecords("projects", listProjects);
  const [view, setView] = useState<TaskView>("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [sort, setSort] = useState<TaskSort>("createdAt");
  const [today, setToday] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [editorInstance, setEditorInstance] = useState(0);
  const [operationError, setOperationError] = useState("");

  useEffect(() => {
    const updateToday = () => setToday(localDateKey(new Date()));
    updateToday();
    const interval = window.setInterval(updateToday, 60_000);
    window.addEventListener("focus", updateToday);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", updateToday);
    };
  }, []);

  const activeProjectFilter =
    projectFilter === "all" ||
    projectFilter === "unassigned" ||
    projects.records.some((project) => project.id === projectFilter)
      ? projectFilter
      : "all";
  const projectFilteredTasks = tasks.filter((task) => {
    if (activeProjectFilter === "unassigned") return !task.projectId;
    if (activeProjectFilter !== "all") {
      return task.projectId === activeProjectFilter;
    }
    return true;
  });
  const priorityFilteredTasks = projectFilteredTasks.filter(
    (task) => priorityFilter === "all" || (task.priority ?? "medium") === priorityFilter,
  );
  const visibleTasks = tasksForView(priorityFilteredTasks, view, today).sort(
    (a, b) => compareTasks(a, b, sort),
  );
  const viewCounts: Record<TaskView, number> = {
    today: tasksForView(priorityFilteredTasks, "today", today).length,
    upcoming: tasksForView(priorityFilteredTasks, "upcoming", today).length,
    overdue: tasksForView(priorityFilteredTasks, "overdue", today).length,
    all: tasksForView(priorityFilteredTasks, "all", today).length,
    completed: tasksForView(priorityFilteredTasks, "completed", today).length,
  };
  const projectNames = new Map(
    projects.records.map((project) => [project.id, project.name]),
  );

  function openCreate() {
    setSelectedTask(null);
    setEditorInstance((instance) => instance + 1);
    setOperationError("");
    setIsEditorOpen(true);
  }

  function openEdit(task: TaskRecord) {
    setSelectedTask(task);
    setEditorInstance((instance) => instance + 1);
    setOperationError("");
    setIsEditorOpen(true);
  }

  async function saveTask(input: TaskInput) {
    if (selectedTask) {
      await updateTask(selectedTask.id, input);
    } else {
      await createTask({ ...input, completed: false });
    }
    setIsEditorOpen(false);
  }

  async function toggleTask(task: TaskRecord, completed: boolean) {
    setOperationError("");
    try {
      await updateTask(task.id, { completed });
    } catch (toggleError) {
      setOperationError(
        toggleError instanceof Error
          ? toggleError.message
          : "The task status could not be updated.",
      );
    }
  }

  async function removeTask(task: TaskRecord) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    setOperationError("");
    try {
      await deleteTask(task.id);
    } catch (deleteError) {
      setOperationError(
        deleteError instanceof Error
          ? deleteError.message
          : "The task could not be deleted.",
      );
    }
  }

  const filtersApplied =
    activeProjectFilter !== "all" || priorityFilter !== "all";
  const emptyContent = filtersApplied
    ? {
        title: "No matching tasks.",
        description: "Try changing the project or priority filters.",
      }
    : {
        today: {
          title: "Nothing due today.",
          description: "Incomplete tasks due today will appear here.",
        },
        upcoming: {
          title: "No upcoming tasks.",
          description: "Tasks with a future due date will appear here.",
        },
        overdue: {
          title: "Nothing overdue.",
          description: "Incomplete tasks past their due date will appear here.",
        },
        all: {
          title: "A little room to begin.",
          description: "Tasks you capture will appear here.",
        },
        completed: {
          title: "Nothing completed yet.",
          description: "Finished tasks will gather here.",
        },
      }[view];

  return (
    <div className="data-screen">
      <ScreenHeader
        action={
          <button className="capture-submit" onClick={openCreate} type="button">
            + New task
          </button>
        }
        description="Focus on what is due, and filter by project or priority."
        kicker="YOUR SPACE"
        title="Tasks"
      />

      {error && <ErrorNotice message={error} onRetry={reload} />}
      {projects.error && (
        <ErrorNotice message={projects.error} onRetry={projects.reload} />
      )}
      {operationError && <ErrorNotice message={operationError} />}

      <div
        aria-label="Task views"
        className="record-filters task-view-filters"
        role="group"
      >
        {taskViews.map(({ value, label }) => (
          <button
            aria-pressed={view === value}
            className={view === value ? "record-filter is-active" : "record-filter"}
            key={value}
            onClick={() => setView(value)}
            type="button"
          >
            {label} <span>{viewCounts[value]}</span>
          </button>
        ))}
      </div>

      <div className="task-list-controls">
        <label className="task-select-control">
          <span>Project</span>
          <select
            disabled={projects.isLoading || Boolean(projects.error)}
            onChange={(event) => setProjectFilter(event.target.value)}
            value={activeProjectFilter}
          >
            <option value="all">All projects</option>
            <option value="unassigned">Unassigned</option>
            {projects.records.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <label className="task-select-control">
          <span>Priority</span>
          <select
            onChange={(event) =>
              setPriorityFilter(priorityFilterFor(event.target.value))
            }
            value={priorityFilter}
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>

        <label className="task-select-control">
          <span>Sort by</span>
          <select
            onChange={(event) => setSort(taskSortFor(event.target.value))}
            value={sort}
          >
            <option value="dueAt">Due date</option>
            <option value="priority">Priority</option>
            <option value="createdAt">Recently created</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <LoadingState label="Loading tasks from this device..." />
      ) : visibleTasks.length ? (
        <ul className="today-list record-list">
          {visibleTasks.map((task) => (
            <TaskRow
              key={task.id}
              onDelete={() => void removeTask(task)}
              onEdit={() => openEdit(task)}
              onToggle={(completed) => void toggleTask(task, completed)}
              projectName={
                task.projectId ? projectNames.get(task.projectId) : undefined
              }
              task={task}
            />
          ))}
        </ul>
      ) : (
        <EmptyState description={emptyContent.description} title={emptyContent.title} />
      )}

      <p className="local-data-footnote">
        Changes stay on this device. Dates shown in your local time.
      </p>

      <ModalDialog
        description="Keep the details that help you move this forward."
        onClose={() => setIsEditorOpen(false)}
        open={isEditorOpen}
        title={selectedTask ? "Edit task" : "New task"}
      >
        <TaskEditor
          key={`${selectedTask?.id ?? "new-task"}-${editorInstance}`}
          onSave={saveTask}
          projects={projects.records}
          projectsLoading={projects.isLoading}
          task={selectedTask}
        />
      </ModalDialog>
    </div>
  );
}
