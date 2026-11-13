"use client";

import { useState, type FormEvent } from "react";
import {
  EmptyState,
  ErrorNotice,
  LoadingState,
  ScreenHeader,
} from "@/components/local-data-ui";
import { ModalDialog } from "@/components/modal-dialog";
import { useLocalRecords } from "@/hooks/use-local-records";
import {
  createNote,
  deleteNote,
  listNotes,
  type NoteRecord,
  updateNote,
} from "@/lib/local-data";
import { formatLocalDate } from "@/lib/formatters";

type NoteInput = { title?: string; content: string };

function getNoteTitle(note: NoteRecord) {
  const title = note.title?.trim() || note.content.split(/\r?\n/, 1)[0]?.trim();
  if (!title) return "Untitled note";
  return title.length > 84 ? `${title.slice(0, 81)}…` : title;
}

function getNotePreview(note: NoteRecord) {
  const content = note.content.trim().replace(/\s+/g, " ");
  return content.length > 180 ? `${content.slice(0, 177)}…` : content;
}

function NoteEditor({
  note,
  onSave,
}: {
  note: NoteRecord | null;
  onSave: (input: NoteInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError("Add some words before saving.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      await onSave({
        content: trimmedContent,
        ...(title.trim() ? { title: title.trim() } : {}),
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The note could not be saved on this device.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Title <span className="optional-label">Optional</span></span>
        <input
          autoFocus
          onChange={(event) => setTitle(event.target.value)}
          placeholder="A short name for this note"
          value={title}
        />
      </label>
      <label className="capture-field">
        <span>Note</span>
        <textarea
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write what you want to remember..."
          required
          rows={7}
          value={content}
        />
      </label>
      {error && <ErrorNotice message={error} />}
      <div className="record-form-footer">
        <span>Saved only on this device.</span>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : note ? "Save changes" : "Save note"}
        </button>
      </div>
    </form>
  );
}

export function JournalScreen() {
  const {
    records: notes,
    isLoading,
    error,
    reload,
  } = useLocalRecords("notes", listNotes);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteRecord | null>(null);
  const [openNote, setOpenNote] = useState<NoteRecord | null>(null);
  const [operationError, setOperationError] = useState("");

  const sortedNotes = [...notes].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  function openCreate() {
    setSelectedNote(null);
    setOperationError("");
    setIsEditorOpen(true);
  }

  function openEdit(note: NoteRecord) {
    setSelectedNote(note);
    setOpenNote(null);
    setOperationError("");
    setIsEditorOpen(true);
  }

  async function saveNote(input: NoteInput) {
    if (selectedNote) {
      await updateNote(selectedNote.id, input);
    } else {
      await createNote(input);
    }
    setIsEditorOpen(false);
  }

  async function removeNote(note: NoteRecord) {
    if (!window.confirm(`Delete “${getNoteTitle(note)}”? This cannot be undone.`)) {
      return;
    }

    setOperationError("");
    try {
      await deleteNote(note.id);
      setOpenNote(null);
    } catch (deleteError) {
      setOperationError(
        deleteError instanceof Error
          ? deleteError.message
          : "The note could not be deleted.",
      );
    }
  }

  return (
    <div className="data-screen">
      <ScreenHeader
        action={
          <button className="capture-submit" onClick={openCreate} type="button">
            + New note
          </button>
        }
        description="A quiet place for the things you want to remember."
        kicker="YOUR SPACE"
        title="Journal"
      />

      {error && <ErrorNotice message={error} onRetry={reload} />}
      {operationError && <ErrorNotice message={operationError} />}

      {isLoading ? (
        <LoadingState label="Loading notes from this device..." />
      ) : sortedNotes.length ? (
        <ul className="note-list">
          {sortedNotes.map((note) => (
            <li className="note-row" key={note.id}>
              <button
                aria-label={`Open note: ${getNoteTitle(note)}`}
                className="note-open"
                onClick={() => setOpenNote(note)}
                type="button"
              >
                <span className="note-heading">
                  <span className="note-title">{getNoteTitle(note)}</span>
                  <time className="record-date" dateTime={note.createdAt}>
                    {formatLocalDate(note.createdAt)}
                  </time>
                </span>
                <span className="note-preview">{getNotePreview(note)}</span>
              </button>
              <div className="record-actions">
                <button
                  aria-label={`Edit ${getNoteTitle(note)}`}
                  onClick={() => openEdit(note)}
                  type="button"
                >
                  Edit
                </button>
                <button
                  aria-label={`Delete ${getNoteTitle(note)}`}
                  onClick={() => void removeNote(note)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          action={
            <button className="text-button" onClick={openCreate} type="button">
              Write a note
            </button>
          }
          description="Notes captured here or with Quick Capture will appear in this space."
          title="Nothing written down yet."
        />
      )}

      <p className="local-data-footnote">Your notes stay on this device.</p>

      <ModalDialog
        description={openNote ? formatLocalDate(openNote.createdAt) : ""}
        onClose={() => setOpenNote(null)}
        open={openNote !== null}
        title={openNote ? getNoteTitle(openNote) : "Note"}
      >
        {openNote && (
          <div className="note-detail">
            {operationError && <ErrorNotice message={operationError} />}
            <p>{openNote.content}</p>
            <div className="record-form-footer">
              <button
                className="text-button"
                onClick={() => openEdit(openNote)}
                type="button"
              >
                Edit note
              </button>
              <button
                className="text-button destructive-text"
                onClick={() => void removeNote(openNote)}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </ModalDialog>

      <ModalDialog
        description="Keep the details that matter to you."
        onClose={() => setIsEditorOpen(false)}
        open={isEditorOpen}
        title={selectedNote ? "Edit note" : "New note"}
      >
        <NoteEditor
          key={selectedNote?.id ?? "new-note"}
          note={selectedNote}
          onSave={saveNote}
        />
      </ModalDialog>
    </div>
  );
}
