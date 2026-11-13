"use client";

import { useState, type FormEvent } from "react";
import { ErrorNotice } from "@/components/local-data-ui";
import type {
  ProjectRecord,
  TaskPriority,
  TaskRecord,
} from "@/lib/local-data";

export type TaskInput = {
  title: string;
  notes?: string;
  dueAt?: string;
  projectId?: string;
  priority: TaskPriority;
};

function toDateTimeInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

type TaskEditorProps = {
  task: TaskRecord | null;
  projects: ProjectRecord[];
  projectsLoading?: boolean;
  initialProjectId?: string;
  onSave: (input: TaskInput) => Promise<void>;
};

export function TaskEditor({
  task,
  projects,
  projectsLoading = false,
  initialProjectId,
  onSave,
}: TaskEditorProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [dueAt, setDueAt] = useState(toDateTimeInput(task?.dueAt));
  const [projectId, setProjectId] = useState(
    task?.projectId ?? initialProjectId ?? "",
  );
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "medium",
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Add a task title before saving.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      await onSave({
        title: trimmedTitle,
        notes: notes.trim() || undefined,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        projectId: projectId || undefined,
        priority,
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The task could not be saved on this device.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Task</span>
        <input
          autoFocus
          onChange={(event) => setTitle(event.target.value)}
          required
          value={title}
        />
      </label>
      <label className="capture-field">
        <span>Project</span>
        <select
          disabled={projectsLoading}
          onChange={(event) => setProjectId(event.target.value)}
          value={projectId}
        >
          <option value="">No project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
              {project.status === "paused" ? " · Paused" : ""}
              {project.status === "completed" ? " · Completed" : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="capture-field">
        <span>Priority</span>
        <select
          onChange={(event) => {
            const value = event.target.value;
            if (value === "low" || value === "medium" || value === "high") {
              setPriority(value);
            }
          }}
          value={priority}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
      <label className="capture-field">
        <span>Due date</span>
        <input
          onChange={(event) => setDueAt(event.target.value)}
          type="datetime-local"
          value={dueAt}
        />
      </label>
      <label className="capture-field">
        <span>Notes</span>
        <textarea
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          value={notes}
        />
      </label>
      {error && <ErrorNotice message={error} />}
      <div className="record-form-footer">
        <span>Saved only on this device.</span>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : task ? "Save changes" : "Create task"}
        </button>
      </div>
    </form>
  );
}
