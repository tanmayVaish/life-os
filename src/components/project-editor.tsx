"use client";

import { useState, type FormEvent } from "react";
import { ErrorNotice } from "@/components/local-data-ui";
import type { ProjectInput, ProjectRecord } from "@/lib/local-data";

function toDateField(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toStoredDate(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12).toISOString();
}

export function ProjectEditor({
  project,
  onSave,
}: {
  project: ProjectRecord | null;
  onSave: (input: ProjectInput) => Promise<void>;
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<ProjectInput["status"]>(
    project?.status ?? "active",
  );
  const [dueDate, setDueDate] = useState(toDateField(project?.dueAt));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Add a project name before saving.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      await onSave({
        name: trimmedName,
        description: description.trim(),
        status,
        dueAt: toStoredDate(dueDate),
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The project could not be saved on this device.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Project name</span>
        <input
          autoFocus
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </label>
      <label className="capture-field">
        <span>Description</span>
        <textarea
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          value={description}
        />
      </label>
      <label className="capture-field">
        <span>Status</span>
        <select
          onChange={(event) => {
            const value = event.target.value;
            if (
              value === "active" ||
              value === "paused" ||
              value === "completed"
            ) {
              setStatus(value);
            }
          }}
          value={status}
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </label>
      <label className="capture-field">
        <span>Due date <span className="optional-label">Optional</span></span>
        <input
          onChange={(event) => setDueDate(event.target.value)}
          type="date"
          value={dueDate}
        />
      </label>
      {error && <ErrorNotice message={error} />}
      <div className="record-form-footer">
        <span>Saved only on this device.</span>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : project ? "Save changes" : "Create project"}
        </button>
      </div>
    </form>
  );
}
