"use client";

import { useState, type FormEvent } from "react";
import { ErrorNotice } from "@/components/local-data-ui";
import type {
  JournalEntryInput,
  JournalEntryRecord,
  JournalMood,
} from "@/lib/local-data";

type JournalEntryEditorProps = {
  entry: JournalEntryRecord | null;
  onSave: (input: JournalEntryInput) => Promise<void>;
  onCancel: () => void;
};

const moodOptions: { value: JournalMood; label: string }[] = [
  { value: "great", label: "Great" },
  { value: "good", label: "Good" },
  { value: "okay", label: "Okay" },
  { value: "low", label: "Low" },
  { value: "difficult", label: "Difficult" },
];

export function JournalEntryEditor({
  entry,
  onSave,
  onCancel,
}: JournalEntryEditorProps) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [mood, setMood] = useState<JournalMood | "">(entry?.mood ?? "");
  const [highlights, setHighlights] = useState(entry?.highlights ?? "");
  const [gratitude, setGratitude] = useState(entry?.gratitude ?? "");
  const [reflection, setReflection] = useState(entry?.reflection ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) {
      setError("Add a few words before saving.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      await onSave({
        content: content.trim(),
        title: title.trim() || undefined,
        mood: mood || undefined,
        highlights: highlights.trim() || undefined,
        gratitude: gratitude.trim() || undefined,
        reflection: reflection.trim() || undefined,
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The journal entry could not be saved on this device.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="record-form journal-editor" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>
          Title <span className="optional-label">Optional</span>
        </span>
        <input
          onChange={(event) => setTitle(event.target.value)}
          placeholder="A short title, if one comes to mind"
          value={title}
        />
      </label>

      <label className="capture-field">
        <span>Your entry</span>
        <textarea
          autoFocus
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write freely. This space is yours."
          required
          rows={12}
          value={content}
        />
      </label>

      <label className="capture-field journal-mood-control">
        <span>Mood <span className="optional-label">Optional</span></span>
        <select
          onChange={(event) => {
            const value = event.target.value;
            const option = moodOptions.find((item) => item.value === value);
            setMood(option?.value ?? "");
          }}
          value={mood}
        >
          <option value="">No mood</option>
          {moodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <details
        className="journal-extra-fields"
        open={Boolean(entry?.highlights || entry?.gratitude || entry?.reflection)}
      >
        <summary>More to reflect on</summary>
        <div className="journal-extra-fields-content">
          <label className="capture-field">
            <span>Highlights</span>
            <textarea
              onChange={(event) => setHighlights(event.target.value)}
              placeholder="A moment worth keeping"
              rows={3}
              value={highlights}
            />
          </label>
          <label className="capture-field">
            <span>Gratitude</span>
            <textarea
              onChange={(event) => setGratitude(event.target.value)}
              placeholder="Something you appreciate"
              rows={3}
              value={gratitude}
            />
          </label>
          <label className="capture-field">
            <span>Reflection</span>
            <textarea
              onChange={(event) => setReflection(event.target.value)}
              placeholder="Anything you want to understand better"
              rows={3}
              value={reflection}
            />
          </label>
        </div>
      </details>

      {error && <ErrorNotice message={error} />}

      <div className="record-form-footer">
        <button className="text-button" onClick={onCancel} type="button">
          Cancel
        </button>
        <span>Saved only on this device.</span>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : entry ? "Save changes" : "Save entry"}
        </button>
      </div>
    </form>
  );
}
