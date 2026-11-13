"use client";

import { DetailPanel } from "@/components/detail-panel";
import type { TaskPriority, TaskRecord } from "@/lib/local-data";
import { formatLocalDate } from "@/lib/formatters";

type TaskRowProps = {
  task: TaskRecord;
  projectName?: string;
  onToggle: (completed: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function TaskRow({
  task,
  projectName,
  onToggle,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const hasActions = Boolean(onEdit || onDelete);
  const priority: TaskPriority = task.priority ?? "medium";
  const priorityLabel = priority[0].toUpperCase() + priority.slice(1);

  return (
    <li className={`today-item task-data-row${hasActions ? " task-row-with-actions" : ""}`}>
      <label className="task-check">
        <input
          aria-label={`${task.completed ? "Completed" : "Mark complete"}: ${task.title}`}
          checked={task.completed}
          onChange={(event) => onToggle(event.target.checked)}
          type="checkbox"
        />
        <span className="checkmark" />
      </label>
      <DetailPanel
        className={`task-disclosure${task.completed ? " task-is-done" : ""}`}
        label={task.title}
        summary={
          <span className="task-summary">
            <time className="task-time" dateTime={task.createdAt}>
              {formatLocalDate(task.createdAt)}
            </time>
            <span className="task-title-group">
              <span className="task-title">{task.title}</span>
              <span className="task-secondary">
                <span className={`task-priority task-priority-${priority}`}>
                  {priorityLabel}
                </span>
                {projectName && (
                  <span className="task-project">{projectName}</span>
                )}
              </span>
            </span>
          </span>
        }
      >
        <p>{task.notes?.trim() || "No additional details."}</p>
        {task.dueAt && <p>Due {formatLocalDate(task.dueAt)}</p>}
      </DetailPanel>
      {hasActions && (
        <div className="task-row-actions">
          {onEdit && (
            <button aria-label={`Edit ${task.title}`} onClick={onEdit} type="button">
              Edit
            </button>
          )}
          {onDelete && (
            <button
              aria-label={`Delete ${task.title}`}
              onClick={onDelete}
              type="button"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </li>
  );
}
