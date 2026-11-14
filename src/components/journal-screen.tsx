"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  EmptyState,
  ErrorNotice,
  LoadingState,
  ScreenHeader,
} from "@/components/local-data-ui";
import { JournalEntryEditor } from "@/components/journal-entry-editor";
import { ModalDialog } from "@/components/modal-dialog";
import { useLocalRecords } from "@/hooks/use-local-records";
import {
  createNote,
  deleteJournalEntry,
  deleteNote,
  listJournalEntries,
  listNotes,
  saveJournalEntryForDate,
  updateNote,
  type JournalEntryInput,
  type JournalEntryRecord,
  type JournalMood,
  type NoteRecord,
} from "@/lib/local-data";
import {
  addDaysToDateKey,
  formatDateKey,
  getLocalDateKey,
  isDateKey,
} from "@/lib/local-date";
import { formatLocalDate } from "@/lib/formatters";

type NoteInput = { title?: string; content: string };

const moods: { value: JournalMood; label: string }[] = [
  { value: "great", label: "Great" },
  { value: "good", label: "Good" },
  { value: "okay", label: "Okay" },
  { value: "low", label: "Low" },
  { value: "difficult", label: "Difficult" },
];

function getMoodLabel(mood?: JournalMood) {
  return moods.find((option) => option.value === mood)?.label;
}

function getJournalTitle(entry: JournalEntryRecord) {
  const title =
    entry.title?.trim() || entry.content.split(/\r?\n/, 1)[0]?.trim();
  if (!title) return "Untitled entry";
  return title.length > 84 ? `${title.slice(0, 81)}…` : title;
}

function getPreview(content: string, limit = 150) {
  const preview = content.trim().replace(/\s+/g, " ");
  return preview.length > limit
    ? `${preview.slice(0, limit - 3)}…`
    : preview;
}

function getNoteTitle(note: NoteRecord) {
  const title = note.title?.trim() || note.content.split(/\r?\n/, 1)[0]?.trim();
  if (!title) return "Untitled note";
  return title.length > 84 ? `${title.slice(0, 81)}…` : title;
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
        title: title.trim() || undefined,
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
        <span>
          Title <span className="optional-label">Optional</span>
        </span>
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
  const entries = useLocalRecords("journalEntries", listJournalEntries);
  const notes = useLocalRecords("notes", listNotes);
  const [today, setToday] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [entryEditorInstance, setEntryEditorInstance] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [entryOperationError, setEntryOperationError] = useState("");
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [noteEditorInstance, setNoteEditorInstance] = useState(0);
  const [selectedNote, setSelectedNote] = useState<NoteRecord | null>(null);
  const [openNote, setOpenNote] = useState<NoteRecord | null>(null);
  const [noteOperationError, setNoteOperationError] = useState("");
  const handledNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    function checkRequestedNote() {
      if (notes.isLoading || !notes.records.length) return;
      const requestedId = new URLSearchParams(window.location.search).get("noteId");
      if (!requestedId || handledNoteIdRef.current === requestedId) return;

      const target = notes.records.find((n) => n.id === requestedId);
      if (target) {
        handledNoteIdRef.current = requestedId;
        setOpenNote(target);
      }
    }

    checkRequestedNote();
    window.addEventListener("popstate", checkRequestedNote);
    return () => window.removeEventListener("popstate", checkRequestedNote);
  }, [notes.isLoading, notes.records]);

  useEffect(() => {
    const updateToday = () => setToday(getLocalDateKey(new Date()));
    const initializeDate = () => {
      const currentDay = getLocalDateKey(new Date());
      const requestedDate = new URLSearchParams(
        window.location.search,
      ).get("date");
      setToday(currentDay);
      setSelectedDate(
        requestedDate && isDateKey(requestedDate)
          ? requestedDate
          : currentDay,
      );
    };
    const frame = window.requestAnimationFrame(initializeDate);
    const interval = window.setInterval(updateToday, 60_000);
    window.addEventListener("focus", updateToday);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(interval);
      window.removeEventListener("focus", updateToday);
    };
  }, []);

  const sortedEntries = [...entries.records].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      b.updatedAt.localeCompare(a.updatedAt),
  );
  const selectedEntry =
    entries.records.find((entry) => entry.date === selectedDate) ?? null;
  const search = searchQuery.trim().toLocaleLowerCase();
  const historyEntries = sortedEntries.filter((entry) => {
    if (
      !search &&
      entry.date === selectedDate
    ) {
      return false;
    }
    return [
      entry.title,
      entry.content,
      entry.highlights,
      entry.gratitude,
      entry.reflection,
    ]
      .filter(Boolean)
      .some((value) => value?.toLocaleLowerCase().includes(search));
  });

  function chooseDate(date: string) {
    if (!isDateKey(date)) return;
    setSelectedDate(date);
    setIsEditingEntry(false);
    setEntryOperationError("");
  }

  function openEntryEditor() {
    setEntryEditorInstance((instance) => instance + 1);
    setEntryOperationError("");
    setIsEditingEntry(true);
  }

  async function saveEntry(input: JournalEntryInput) {
    await saveJournalEntryForDate(selectedDate, input);
    setIsEditingEntry(false);
  }

  async function removeEntry(entry: JournalEntryRecord) {
    const dateLabel = formatDateKey(entry.date, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!window.confirm(`Delete the journal entry for ${dateLabel}?`)) return;

    setEntryOperationError("");
    try {
      await deleteJournalEntry(entry.id);
      setIsEditingEntry(false);
    } catch (deleteError) {
      setEntryOperationError(
        deleteError instanceof Error
          ? deleteError.message
          : "The journal entry could not be deleted.",
      );
    }
  }

  function openCreateNote() {
    setSelectedNote(null);
    setNoteEditorInstance((instance) => instance + 1);
    setNoteOperationError("");
    setIsNoteEditorOpen(true);
  }

  function openEditNote(note: NoteRecord) {
    setSelectedNote(note);
    setOpenNote(null);
    setNoteEditorInstance((instance) => instance + 1);
    setNoteOperationError("");
    setIsNoteEditorOpen(true);
  }

  async function saveNote(input: NoteInput) {
    if (selectedNote) {
      await updateNote(selectedNote.id, {
        content: input.content,
        title: input.title ?? undefined,
      });
    } else {
      await createNote({
        content: input.content,
        ...(input.title ? { title: input.title } : {}),
      });
    }
    setIsNoteEditorOpen(false);
  }

  async function removeNote(note: NoteRecord) {
    if (!window.confirm(`Delete “${getNoteTitle(note)}”? This cannot be undone.`)) {
      return;
    }

    setNoteOperationError("");
    try {
      await deleteNote(note.id);
      setOpenNote(null);
    } catch (deleteError) {
      setNoteOperationError(
        deleteError instanceof Error
          ? deleteError.message
          : "The note could not be deleted.",
      );
    }
  }

  const selectedDateLabel = selectedDate
    ? formatDateKey(selectedDate, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const selectedMood = getMoodLabel(selectedEntry?.mood);

  return (
    <div className="data-screen journal-screen">
      <ScreenHeader
        description="A little space to notice what the day held."
        kicker="YOUR SPACE"
        title="Journal"
      />

      {entries.error && <ErrorNotice message={entries.error} onRetry={entries.reload} />}
      {entryOperationError && <ErrorNotice message={entryOperationError} />}

      <div className="journal-layout">
        <section aria-label="Daily journal" className="journal-primary">
          <div className="journal-date-navigation">
            <button
              aria-label="Previous day"
              className="journal-date-step"
              onClick={() => chooseDate(addDaysToDateKey(selectedDate, -1))}
              type="button"
            >
              Previous
            </button>
            <label className="journal-date-picker">
              <span className="visually-hidden">Journal date</span>
              <input
                onChange={(event) => chooseDate(event.target.value)}
                type="date"
                value={selectedDate}
              />
            </label>
            <button
              aria-label="Next day"
              className="journal-date-step"
              onClick={() => chooseDate(addDaysToDateKey(selectedDate, 1))}
              type="button"
            >
              Next
            </button>
            {selectedDate !== today && (
              <button
                className="journal-today-button"
                onClick={() => chooseDate(today)}
                type="button"
              >
                Today
              </button>
            )}
          </div>

          <h2 className="journal-date-heading">
            {selectedDate === today ? "Today" : selectedDateLabel}
          </h2>
          {selectedDate && (
            <p className="journal-date-subheading">{selectedDateLabel}</p>
          )}

          {entries.isLoading || !selectedDate ? (
            <LoadingState label="Opening your journal..." />
          ) : isEditingEntry ? (
            <JournalEntryEditor
              entry={selectedEntry}
              key={`${selectedDate}-${selectedEntry?.id ?? "new"}-${entryEditorInstance}`}
              onCancel={() => setIsEditingEntry(false)}
              onSave={saveEntry}
            />
          ) : selectedEntry ? (
            <article className="journal-entry-view">
              <div className="journal-entry-topline">
                {selectedMood && (
                  <span
                    className={`journal-mood journal-mood-${selectedEntry.mood}`}
                  >
                    {selectedMood}
                  </span>
                )}
              </div>
              {selectedEntry.title?.trim() && (
                <h3 className="journal-entry-title">
                  {selectedEntry.title.trim()}
                </h3>
              )}
              <p className="journal-entry-content">{selectedEntry.content}</p>
              {(
                [
                  ["Highlights", selectedEntry.highlights],
                  ["Gratitude", selectedEntry.gratitude],
                  ["Reflection", selectedEntry.reflection],
                ] as const
              ).map(
                ([label, value]) =>
                  value?.trim() && (
                    <section className="journal-reflection" key={label}>
                      <h4>{label}</h4>
                      <p>{value}</p>
                    </section>
                  ),
              )}
              <div className="journal-entry-actions">
                <button className="text-button" onClick={openEntryEditor} type="button">
                  Edit entry
                </button>
                <button
                  className="text-button destructive-text"
                  onClick={() => void removeEntry(selectedEntry)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </article>
          ) : (
            <EmptyState
              action={
                <button className="text-button" onClick={openEntryEditor} type="button">
                  Write {selectedDate === today ? "today's" : "this day's"} entry
                </button>
              }
              description="Your entry stays private on this device. You can add a mood or reflection whenever it feels useful."
              title="A quiet page."
            />
          )}
        </section>

        <aside className="journal-history">
          <label className="journal-search">
            <span className="visually-hidden">Search journal entries</span>
            <input
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search entries"
              type="search"
              value={searchQuery}
            />
          </label>
          <div className="journal-history-heading">
            <h2>{search ? "Search results" : "Previous entries"}</h2>
            <span>{historyEntries.length}</span>
          </div>
          {entries.isLoading ? (
            <LoadingState label="Loading entries..." />
          ) : historyEntries.length ? (
            <ul aria-label="Journal entries" className="journal-history-list">
              {historyEntries.map((entry) => {
                const moodLabel = getMoodLabel(entry.mood);
                return (
                  <li key={entry.id}>
                    <button
                      aria-current={entry.date === selectedDate ? "date" : undefined}
                      className="journal-history-entry"
                      onClick={() => chooseDate(entry.date)}
                      type="button"
                    >
                      <span className="journal-history-date">
                        {formatDateKey(entry.date)}
                        {moodLabel && (
                          <span className={`journal-mood journal-mood-${entry.mood}`}>
                            {moodLabel}
                          </span>
                        )}
                      </span>
                      <span className="journal-history-title">
                        {getJournalTitle(entry)}
                      </span>
                      <span className="journal-history-preview">
                        {getPreview(entry.content)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="journal-history-empty">
              {search
                ? "No entries match that search."
                : "Saved entries will gather here."}
            </p>
          )}

          <details className="journal-notes-archive" id="notes">
            <summary>
              Existing notes <span>{notes.records.length}</span>
            </summary>
            <div className="journal-notes-content">
              <p>
                Notes created before daily journaling remain unchanged and live
                here.
              </p>
              {notes.error && (
                <ErrorNotice message={notes.error} onRetry={notes.reload} />
              )}
              <button
                className="text-button"
                onClick={openCreateNote}
                type="button"
              >
                + New note
              </button>
              {notes.isLoading ? (
                <LoadingState label="Loading existing notes..." />
              ) : notes.records.length ? (
                <ul className="note-list">
                  {[...notes.records]
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .map((note) => (
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
                          <span className="note-preview">
                            {getPreview(note.content, 180)}
                          </span>
                        </button>
                        <div className="record-actions">
                          <button
                            aria-label={`Edit ${getNoteTitle(note)}`}
                            onClick={() => openEditNote(note)}
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
                <p className="journal-history-empty">
                  No existing notes. Notes saved with Quick Capture will appear
                  here.
                </p>
              )}
              {noteOperationError && (
                <ErrorNotice message={noteOperationError} />
              )}
            </div>
          </details>
        </aside>
      </div>

      <p className="local-data-footnote">
        Entries and notes stay on this device.
      </p>

      <ModalDialog
        description={openNote ? formatLocalDate(openNote.createdAt) : ""}
        onClose={() => setOpenNote(null)}
        open={openNote !== null}
        title={openNote ? getNoteTitle(openNote) : "Note"}
      >
        {openNote && (
          <div className="note-detail">
            {noteOperationError && <ErrorNotice message={noteOperationError} />}
            <p>{openNote.content}</p>
            <div className="record-form-footer">
              <button
                className="text-button"
                onClick={() => openEditNote(openNote)}
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
        onClose={() => setIsNoteEditorOpen(false)}
        open={isNoteEditorOpen}
        title={selectedNote ? "Edit note" : "New note"}
      >
        <NoteEditor
          key={`${selectedNote?.id ?? "new-note"}-${noteEditorInstance}`}
          note={selectedNote}
          onSave={saveNote}
        />
      </ModalDialog>
    </div>
  );
}
