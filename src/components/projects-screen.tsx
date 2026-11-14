"use client";

import { useEffect, useRef, useState } from "react";
import {
  EmptyState,
  ErrorNotice,
  LoadingState,
  ScreenHeader,
} from "@/components/local-data-ui";
import { ModalDialog } from "@/components/modal-dialog";
import { ProjectEditor } from "@/components/project-editor";
import { TaskEditor, type TaskInput } from "@/components/task-editor";
import { TaskRow } from "@/components/task-row";
import { useLocalRecords } from "@/hooks/use-local-records";
import {
  createProject,
  createTask,
  deleteProjectAndUnassignTasks,
  deleteTask,
  getProjectProgress,
  listProjects,
  listTasks,
  updateProject,
  updateTask,
  type ProjectInput,
  type ProjectRecord,
  type ProjectStatus,
  type TaskRecord,
} from "@/lib/local-data";
import { formatLocalDate } from "@/lib/formatters";

type ProjectFilter = "all" | ProjectStatus;
type DialogMode = "closed" | "project" | "detail" | "task";

function statusLabel(status: ProjectStatus) {
  return status[0].toUpperCase() + status.slice(1);
}

function ProjectSummary({
  project,
  tasks,
  tasksUnavailable,
  onOpen,
}: {
  project: ProjectRecord;
  tasks: TaskRecord[];
  tasksUnavailable: boolean;
  onOpen: () => void;
}) {
  const progress = getProjectProgress(project.id, tasks);

  return (
    <li className="project-row">
      <button
        aria-label={`Open ${project.name} details`}
        className="project-summary"
        onClick={onOpen}
        type="button"
      >
        <span className="project-summary-top">
          <span className="project-summary-name">{project.name}</span>
          <span className={`project-status project-status-${project.status}`}>
            {statusLabel(project.status)}
          </span>
        </span>
        {project.description.trim() && (
          <span className="project-summary-description">
            {project.description}
          </span>
        )}
        {project.dueAt && (
          <span className="project-summary-due">
            Due {formatLocalDate(project.dueAt)}
          </span>
        )}
        {tasksUnavailable ? (
          <span className="project-progress-unavailable">
            Task progress unavailable
          </span>
        ) : (
          <span className="project-summary-progress">
            <span className="project-progress-copy">
              <span>
                {progress.completedTasks} of {progress.totalTasks} tasks
              </span>
              <span>{progress.percentage}%</span>
            </span>
            <span
              aria-label={`${progress.percentage}% complete`}
              className="project-progress-track"
              role="progressbar"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progress.percentage}
            >
              <span style={{ width: `${progress.percentage}%` }} />
            </span>
            {progress.nextTask && (
              <span className="project-next-task">
                Next · {progress.nextTask.title}
              </span>
            )}
          </span>
        )}
      </button>
      <span aria-hidden="true" className="project-row-affordance">
        Details
      </span>
    </li>
  );
}

export function ProjectsScreen() {
  const projects = useLocalRecords("projects", listProjects);
  const tasks = useLocalRecords("tasks", listTasks);
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [dialogMode, setDialogMode] = useState<DialogMode>("closed");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [taskEditorInstance, setTaskEditorInstance] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [operationError, setOperationError] = useState("");
  const handledProjectIdRef = useRef<string | null>(null);

  useEffect(() => {
    function checkRequestedProject() {
      if (projects.isLoading || !projects.records.length) return;
      const requestedId = new URLSearchParams(window.location.search).get("projectId");
      if (!requestedId || handledProjectIdRef.current === requestedId) return;

      const target = projects.records.find((p) => p.id === requestedId);
      if (target) {
        handledProjectIdRef.current = requestedId;
        setFilter(target.status);
        setSelectedProjectId(target.id);
        setSelectedTask(null);
        setSelectedTaskId("");
        setOperationError("");
        setDialogMode("detail");
      }
    }

    checkRequestedProject();
    window.addEventListener("popstate", checkRequestedProject);
    return () => window.removeEventListener("popstate", checkRequestedProject);
  }, [projects.isLoading, projects.records]);

  const selectedProject =
    projects.records.find((project) => project.id === selectedProjectId) ?? null;
  const projectNames = new Map(
    projects.records.map((project) => [project.id, project.name]),
  );
  const visibleProjects = [...projects.records]
    .filter((project) => filter === "all" || project.status === filter)
    .sort((a, b) => {
      const statusOrder: Record<ProjectStatus, number> = {
        active: 0,
        paused: 1,
        completed: 2,
      };
      return (
        statusOrder[a.status] - statusOrder[b.status] ||
        b.updatedAt.localeCompare(a.updatedAt)
      );
    });
  const activeCount = projects.records.filter(
    (project) => project.status === "active",
  ).length;
  const pausedCount = projects.records.filter(
    (project) => project.status === "paused",
  ).length;
  const completedCount = projects.records.filter(
    (project) => project.status === "completed",
  ).length;
  const projectTasks = selectedProject
    ? tasks.records
        .filter((task) => task.projectId === selectedProject.id)
        .sort(
          (a, b) =>
            Number(a.completed) - Number(b.completed) ||
            (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999") ||
            a.createdAt.localeCompare(b.createdAt),
        )
    : [];
  const projectProgress = selectedProject
    ? getProjectProgress(selectedProject.id, tasks.records)
    : null;
  const availableTasks = selectedProject
    ? tasks.records.filter((task) => task.projectId !== selectedProject.id)
    : [];

  function closeDialog() {
    setDialogMode("closed");
    setSelectedProjectId(null);
    setSelectedTask(null);
    setSelectedTaskId("");
    setOperationError("");
  }

  function openProjectDetails(projectId: string) {
    setSelectedProjectId(projectId);
    setSelectedTask(null);
    setOperationError("");
    setDialogMode("detail");
  }

  function openProjectEditor(project: ProjectRecord | null = null) {
    setSelectedProjectId(project?.id ?? null);
    setSelectedTask(null);
    setOperationError("");
    setDialogMode("project");
  }

  function openNewTask(project: ProjectRecord) {
    setSelectedProjectId(project.id);
    setSelectedTask(null);
    setTaskEditorInstance((instance) => instance + 1);
    setOperationError("");
    setDialogMode("task");
  }

  function openTaskEditor(task: TaskRecord) {
    setSelectedTask(task);
    setTaskEditorInstance((instance) => instance + 1);
    setOperationError("");
    setDialogMode("task");
  }

  async function saveProject(input: ProjectInput) {
    const savedProject = selectedProjectId
      ? await updateProject(selectedProjectId, input)
      : await createProject(input);
    setSelectedProjectId(savedProject.id);
    setDialogMode("detail");
  }

  async function saveTask(input: TaskInput) {
    if (selectedTask) {
      await updateTask(selectedTask.id, input);
    } else {
      await createTask({ ...input, completed: false });
    }
    setSelectedTask(null);
    setDialogMode("detail");
  }

  async function toggleTask(task: TaskRecord, completed: boolean) {
    setOperationError("");
    try {
      await updateTask(task.id, { completed });
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "The task status could not be updated.",
      );
    }
  }

  async function removeTask(task: TaskRecord) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) {
      return;
    }
    setOperationError("");
    try {
      await deleteTask(task.id);
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "The task could not be deleted.",
      );
    }
  }

  async function changeProjectStatus(status: ProjectStatus) {
    if (!selectedProject) return;
    setOperationError("");
    try {
      await updateProject(selectedProject.id, { status });
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "The project status could not be updated.",
      );
    }
  }

  async function removeProject() {
    if (!selectedProject) return;
    const confirmed = window.confirm(
      `Delete “${selectedProject.name}”? Its tasks will be kept and unassigned.`,
    );
    if (!confirmed) return;

    setOperationError("");
    try {
      await deleteProjectAndUnassignTasks(selectedProject.id);
      closeDialog();
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "The project could not be deleted.",
      );
    }
  }

  async function assignExistingTask() {
    if (!selectedProject || !selectedTaskId) return;
    const task = tasks.records.find((record) => record.id === selectedTaskId);
    if (!task) {
      setOperationError("Choose an existing task to add to this project.");
      return;
    }

    setOperationError("");
    try {
      await updateTask(task.id, { projectId: selectedProject.id });
      setSelectedTaskId("");
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "The task could not be added to this project.",
      );
    }
  }

  const isLoading = projects.isLoading || tasks.isLoading;
  const dialogTitle =
    dialogMode === "project"
      ? selectedProject
        ? "Edit project"
        : "New project"
      : dialogMode === "task"
        ? selectedTask
          ? "Edit task"
          : "New task"
        : selectedProject?.name ?? "Project details";
  const dialogDescription =
    dialogMode === "project"
      ? "Keep the details that help you move this forward."
      : dialogMode === "task"
        ? "Add or update a task connected to this project."
        : "A focused view of the work connected to this project.";

  return (
    <div className="data-screen project-screen">
      <ScreenHeader
        action={
          <button
            className="capture-submit"
            onClick={() => openProjectEditor()}
            type="button"
          >
            + New project
          </button>
        }
        description="A light structure for the things you are moving forward."
        kicker="YOUR SPACE"
        title="Projects"
      />

      {projects.error && (
        <ErrorNotice message={projects.error} onRetry={projects.reload} />
      )}
      {tasks.error && (
        <ErrorNotice message={tasks.error} onRetry={tasks.reload} />
      )}
      {operationError && dialogMode === "closed" && (
        <ErrorNotice message={operationError} />
      )}

      <div aria-label="Filter projects" className="record-filters" role="group">
        {([
          ["all", "All", projects.records.length],
          ["active", "Active", activeCount],
          ["paused", "Paused", pausedCount],
          ["completed", "Completed", completedCount],
        ] as const).map(([value, label, count]) => (
          <button
            aria-pressed={filter === value}
            className={
              filter === value ? "record-filter is-active" : "record-filter"
            }
            key={value}
            onClick={() => setFilter(value)}
            type="button"
          >
            {label} <span>{count}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState label="Loading projects from this device..." />
      ) : projects.error ? null : visibleProjects.length ? (
        <ul className="project-list">
          {visibleProjects.map((project) => (
            <ProjectSummary
              key={project.id}
              onOpen={() => openProjectDetails(project.id)}
              project={project}
              tasks={tasks.records}
              tasksUnavailable={Boolean(tasks.error)}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          action={
            filter === "all" ? (
              <button
                className="text-button"
                onClick={() => openProjectEditor()}
                type="button"
              >
                Create a project
              </button>
            ) : undefined
          }
          description={
            filter === "all"
              ? "Projects you create will appear here. No sample projects are added."
              : `There are no ${filter} projects right now.`
          }
          title={
            filter === "all" ? "A little room to begin." : "Nothing here yet."
          }
        />
      )}

      <p className="local-data-footnote">
        Project progress is calculated from its tasks. Changes stay on this
        device.
      </p>

      <ModalDialog
        description={dialogDescription}
        onClose={closeDialog}
        open={dialogMode !== "closed"}
        title={dialogTitle}
      >
        {dialogMode === "project" && (
          <ProjectEditor
            key={selectedProject?.id ?? "new-project"}
            onSave={saveProject}
            project={selectedProject}
          />
        )}
        {dialogMode === "task" && (
          <TaskEditor
            key={`${selectedTask?.id ?? `new-task-${selectedProjectId ?? "none"}`}-${taskEditorInstance}`}
            initialProjectId={selectedProjectId ?? undefined}
            onSave={saveTask}
            projects={projects.records}
            projectsLoading={projects.isLoading}
            task={selectedTask}
          />
        )}
        {dialogMode === "detail" &&
          (selectedProject && projectProgress ? (
            <div className="project-detail">
              {selectedProject.description.trim() ? (
                <p className="project-detail-description">
                  {selectedProject.description}
                </p>
              ) : (
                <p className="project-detail-description project-description-empty">
                  No description added.
                </p>
              )}
              <div className="project-detail-meta">
                <span
                  className={`project-status project-status-${selectedProject.status}`}
                >
                  {statusLabel(selectedProject.status)}
                </span>
                {selectedProject.dueAt && (
                  <span>Due {formatLocalDate(selectedProject.dueAt)}</span>
                )}
              </div>

              {tasks.isLoading || tasks.error ? (
                <p className="project-progress-unavailable">
                  {tasks.isLoading
                    ? "Loading task progress..."
                    : "Task progress is unavailable until tasks can be loaded."}
                </p>
              ) : (
                <div className="project-detail-progress">
                  <div className="project-progress-copy">
                    <span>
                      {projectProgress.completedTasks} completed ·{" "}
                      {projectProgress.totalTasks -
                        projectProgress.completedTasks}{" "}
                      open
                    </span>
                    <span>{projectProgress.percentage}%</span>
                  </div>
                  <span
                    aria-label={`${projectProgress.percentage}% complete`}
                    className="project-progress-track"
                    role="progressbar"
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={projectProgress.percentage}
                  >
                    <span
                      style={{ width: `${projectProgress.percentage}%` }}
                    />
                  </span>
                </div>
              )}

              <div className="project-detail-actions">
                <button
                  className="text-button"
                  onClick={() => openProjectEditor(selectedProject)}
                  type="button"
                >
                  Edit
                </button>
                {selectedProject.status !== "completed" ? (
                  <button
                    className="text-button"
                    onClick={() =>
                      void changeProjectStatus(
                        selectedProject.status === "paused"
                          ? "active"
                          : "paused",
                      )
                    }
                    type="button"
                  >
                    {selectedProject.status === "paused" ? "Resume" : "Pause"}
                  </button>
                ) : (
                  <button
                    className="text-button"
                    onClick={() => void changeProjectStatus("active")}
                    type="button"
                  >
                    Reopen
                  </button>
                )}
                {selectedProject.status !== "completed" && (
                  <button
                    className="text-button"
                    onClick={() => void changeProjectStatus("completed")}
                    type="button"
                  >
                    Mark complete
                  </button>
                )}
                <button
                  className="text-button destructive-text"
                  onClick={() => void removeProject()}
                  type="button"
                >
                  Delete
                </button>
              </div>

              {operationError && <ErrorNotice message={operationError} />}

              <section aria-labelledby="project-tasks-heading">
                <div className="project-task-heading">
                  <h3 id="project-tasks-heading">Tasks</h3>
                  <button
                    className="text-button"
                    onClick={() => openNewTask(selectedProject)}
                    type="button"
                  >
                    + Add task
                  </button>
                </div>
                {tasks.isLoading ? (
                  <LoadingState label="Loading project tasks..." />
                ) : tasks.error ? (
                  <p className="project-progress-unavailable">
                    The task list could not be loaded.
                  </p>
                ) : projectTasks.length ? (
                  <ul className="today-list project-task-list">
                    {projectTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        onDelete={() => void removeTask(task)}
                        onEdit={() => openTaskEditor(task)}
                        onToggle={(completed) =>
                          void toggleTask(task, completed)
                        }
                        task={task}
                      />
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    description="Create a task here or add one you have already saved."
                    title="No tasks in this project yet."
                  />
                )}
              </section>

              <form
                className="project-assignment"
                onSubmit={(event) => {
                  event.preventDefault();
                  void assignExistingTask();
                }}
              >
                <label className="capture-field">
                  <span>Add an existing task</span>
                  <select
                    disabled={
                      tasks.isLoading ||
                      Boolean(tasks.error) ||
                      availableTasks.length === 0
                    }
                    onChange={(event) => setSelectedTaskId(event.target.value)}
                    value={selectedTaskId}
                  >
                    <option value="">
                      {availableTasks.length
                        ? "Choose a task"
                        : "No other tasks available"}
                    </option>
                    {availableTasks.map((task) => {
                      const previousProject = task.projectId
                        ? projectNames.get(task.projectId)
                        : undefined;
                      return (
                        <option key={task.id} value={task.id}>
                          {task.title}
                          {previousProject
                            ? ` · from ${previousProject}`
                            : ""}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <button
                  className="capture-submit"
                  disabled={
                    !selectedTaskId || tasks.isLoading || Boolean(tasks.error)
                  }
                  type="submit"
                >
                  Add task
                </button>
              </form>
            </div>
          ) : (
            <ErrorNotice message="This project is no longer available." />
          ))}
      </ModalDialog>
    </div>
  );
}
