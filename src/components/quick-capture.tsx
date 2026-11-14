"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import { ModalDialog } from "@/components/modal-dialog";
import { usePreferences } from "@/hooks/use-preferences";
import {
  createTask,
  createNote,
  createExpense,
  createGoal,
  createPerson,
  createWishlistItem,
  createProject,
  saveJournalEntryForDate,
  listProjects,
  expenseCategories,
  goalLifeAreas,
  personRelationshipTypes,
  wishlistCategories,
  wishlistPriorities,
  type ExpenseCategory,
  type GoalLifeArea,
  type PersonRelationshipType,
  type WishlistCategory,
  type WishlistPriority,
  type ProjectRecord,
} from "@/lib/local-data";
import { getLocalDateKey } from "@/lib/local-date";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type CaptureType =
  | "task"
  | "note"
  | "expense"
  | "journal"
  | "goal"
  | "person"
  | "wishlist"
  | "project";

const captureTypes: CaptureType[] = [
  "task",
  "note",
  "expense",
  "journal",
  "goal",
  "person",
  "wishlist",
  "project",
];

const typeLabels: Record<CaptureType, string> = {
  task: "Task",
  note: "Note",
  expense: "Expense",
  journal: "Journal",
  goal: "Goal",
  person: "Person",
  wishlist: "Wishlist",
  project: "Project",
};

const typeDescriptions: Record<CaptureType, string> = {
  task: "What do you need to do?",
  note: "What would you like to remember?",
  expense: "What was the expense for?",
  journal: "How was your day?",
  goal: "What do you want to achieve?",
  person: "Who would you like to remember?",
  wishlist: "What would you like to have?",
  project: "What are you working on?",
};

// ─────────────────────────────────────────────
// Optional fields toggle
// ─────────────────────────────────────────────

function ExpandToggle({
  expanded,
  onToggle,
  label = "More options",
}: {
  expanded: boolean;
  onToggle: () => void;
  label?: string;
}) {
  return (
    <button
      className="capture-expand-toggle"
      onClick={onToggle}
      type="button"
    >
      <Icon
        className={`capture-expand-icon${expanded ? " is-open" : ""}`}
        name="chevron"
      />
      {expanded ? "Fewer options" : label}
    </button>
  );
}

// ─────────────────────────────────────────────
// Form: Task
// ─────────────────────────────────────────────

function TaskForm({
  projects,
  onSave,
  onCancel,
}: {
  projects: ProjectRecord[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("medium");
  const [projectId, setProjectId] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Add a task title before saving.");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      await createTask({
        title: title.trim(),
        completed: false,
        priority: priority as "low" | "medium" | "high",
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        projectId: projectId || undefined,
      });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save task.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="capture-form" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Title</span>
        <input
          onChange={(e) => { setTitle(e.target.value); setError(""); }}
          placeholder="What do you need to do?"
          ref={titleRef}
          required
          value={title}
        />
      </label>

      <ExpandToggle expanded={expanded} onToggle={() => setExpanded((p) => !p)} />

      {expanded && (
        <>
          <label className="capture-field">
            <span>
              Due date <span className="optional-label">Optional</span>
            </span>
            <input
              onChange={(e) => setDueAt(e.target.value)}
              type="datetime-local"
              value={dueAt}
            />
          </label>

          <label className="capture-field">
            <span>Priority</span>
            <select
              onChange={(e) => setPriority(e.target.value)}
              value={priority}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          {projects.length > 0 && (
            <label className="capture-field">
              <span>
                Project <span className="optional-label">Optional</span>
              </span>
              <select
                onChange={(e) => setProjectId(e.target.value)}
                value={projectId}
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </>
      )}

      {error && (
        <p aria-live="assertive" className="capture-validation" role="alert">
          {error}
        </p>
      )}

      <div className="capture-footer">
        <button className="capture-cancel" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving…" : "Save task"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Form: Note
// ─────────────────────────────────────────────

function NoteForm({
  onSave,
  onCancel,
}: {
  onSave: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    contentRef.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) {
      setError("Add some content before saving.");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      await createNote({
        content: content.trim(),
        title: title.trim() || undefined,
      });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save note.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="capture-form" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>
          Title <span className="optional-label">Optional</span>
        </span>
        <input
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A short title, if one comes to mind"
          value={title}
        />
      </label>

      <label className="capture-field">
        <span>Content</span>
        <textarea
          onChange={(e) => { setContent(e.target.value); setError(""); }}
          placeholder="What would you like to remember?"
          ref={contentRef}
          rows={4}
          value={content}
        />
      </label>

      {error && (
        <p aria-live="assertive" className="capture-validation" role="alert">
          {error}
        </p>
      )}

      <div className="capture-footer">
        <button className="capture-cancel" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving…" : "Save note"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Form: Expense
// ─────────────────────────────────────────────

function ExpenseForm({
  currency,
  onSave,
  onCancel,
}: {
  currency: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Other");
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const descriptionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    descriptionRef.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!description.trim()) {
      setError("Add a description before saving.");
      return;
    }
    const numericAmount = Number(amount);
    if (!amount || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      await createExpense({
        description: description.trim(),
        amount,
        category,
        notes: notes.trim() || undefined,
      });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save expense.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="capture-form" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Description</span>
        <input
          onChange={(e) => { setDescription(e.target.value); setError(""); }}
          placeholder="What was this expense for?"
          ref={descriptionRef}
          required
          value={description}
        />
      </label>

      <div className="capture-row">
        <label className="capture-field">
          <span>Amount ({currency})</span>
          <input
            inputMode="decimal"
            min="0.01"
            onChange={(e) => { setAmount(e.target.value); setError(""); }}
            placeholder="0.00"
            required
            step="0.01"
            type="number"
            value={amount}
          />
        </label>

        <label className="capture-field">
          <span>Category</span>
          <select
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            value={category}
          >
            {expenseCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ExpandToggle expanded={expanded} onToggle={() => setExpanded((p) => !p)} />

      {expanded && (
        <label className="capture-field">
          <span>
            Notes <span className="optional-label">Optional</span>
          </span>
          <textarea
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra context"
            rows={2}
            value={notes}
          />
        </label>
      )}

      {error && (
        <p aria-live="assertive" className="capture-validation" role="alert">
          {error}
        </p>
      )}

      <div className="capture-footer">
        <button className="capture-cancel" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving…" : "Save expense"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Form: Journal Entry
// ─────────────────────────────────────────────

const moodOptions = [
  { value: "great", label: "Great" },
  { value: "good", label: "Good" },
  { value: "okay", label: "Okay" },
  { value: "low", label: "Low" },
  { value: "difficult", label: "Difficult" },
] as const;

function JournalForm({
  onSave,
  onCancel,
}: {
  onSave: () => void;
  onCancel: () => void;
}) {
  const today = getLocalDateKey(new Date());
  const [date, setDate] = useState(today);
  const [mood, setMood] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [highlights, setHighlights] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [reflection, setReflection] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    contentRef.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) {
      setError("Add a few words before saving.");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      await saveJournalEntryForDate(date, {
        content: content.trim(),
        title: title.trim() || undefined,
        mood: (mood as "great" | "good" | "okay" | "low" | "difficult") || undefined,
        highlights: highlights.trim() || undefined,
        gratitude: gratitude.trim() || undefined,
        reflection: reflection.trim() || undefined,
      });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save journal entry.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="capture-form" onSubmit={handleSubmit}>
      <div className="capture-row">
        <label className="capture-field">
          <span>Date</span>
          <input
            max={today}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            value={date}
          />
        </label>

        <label className="capture-field">
          <span>
            Mood <span className="optional-label">Optional</span>
          </span>
          <select
            onChange={(e) => setMood(e.target.value)}
            value={mood}
          >
            <option value="">— select —</option>
            {moodOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="capture-field">
        <span>
          Title <span className="optional-label">Optional</span>
        </span>
        <input
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A short title, if one comes to mind"
          value={title}
        />
      </label>

      <label className="capture-field">
        <span>Your entry</span>
        <textarea
          onChange={(e) => { setContent(e.target.value); setError(""); }}
          placeholder="Write freely. This space is yours."
          ref={contentRef}
          required
          rows={4}
          value={content}
        />
      </label>

      <ExpandToggle
        expanded={expanded}
        label="Add highlights, gratitude & reflection"
        onToggle={() => setExpanded((p) => !p)}
      />

      {expanded && (
        <>
          <label className="capture-field">
            <span>
              Highlights <span className="optional-label">Optional</span>
            </span>
            <textarea
              onChange={(e) => setHighlights(e.target.value)}
              placeholder="What went well?"
              rows={2}
              value={highlights}
            />
          </label>
          <label className="capture-field">
            <span>
              Gratitude <span className="optional-label">Optional</span>
            </span>
            <textarea
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="What are you grateful for?"
              rows={2}
              value={gratitude}
            />
          </label>
          <label className="capture-field">
            <span>
              Reflection <span className="optional-label">Optional</span>
            </span>
            <textarea
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What would you do differently?"
              rows={2}
              value={reflection}
            />
          </label>
        </>
      )}

      {error && (
        <p aria-live="assertive" className="capture-validation" role="alert">
          {error}
        </p>
      )}

      <p className="capture-hint">
        If an entry already exists for this date it will be updated, not duplicated.
      </p>

      <div className="capture-footer">
        <button className="capture-cancel" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving…" : "Save entry"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Form: Goal
// ─────────────────────────────────────────────

function GoalForm({
  onSave,
  onCancel,
}: {
  onSave: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [lifeArea, setLifeArea] = useState<GoalLifeArea>("Personal");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [targetValue, setTargetValue] = useState("100");
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Add a goal title before saving.");
      return;
    }
    const target = Number(targetValue);
    if (!Number.isFinite(target) || target <= 0) {
      setError("Target value must be greater than zero.");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      await createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        lifeArea,
        currentValue: 0,
        targetValue: target,
        targetDate: targetDate || undefined,
        status: "active",
      });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save goal.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="capture-form" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Title</span>
        <input
          onChange={(e) => { setTitle(e.target.value); setError(""); }}
          placeholder="What do you want to achieve?"
          ref={titleRef}
          required
          value={title}
        />
      </label>

      <div className="capture-row">
        <label className="capture-field">
          <span>Life area</span>
          <select
            onChange={(e) => setLifeArea(e.target.value as GoalLifeArea)}
            value={lifeArea}
          >
            {goalLifeAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>

        <label className="capture-field">
          <span>Target value</span>
          <input
            inputMode="decimal"
            min="0.01"
            onChange={(e) => { setTargetValue(e.target.value); setError(""); }}
            placeholder="100"
            step="any"
            type="number"
            value={targetValue}
          />
        </label>
      </div>

      <ExpandToggle expanded={expanded} onToggle={() => setExpanded((p) => !p)} />

      {expanded && (
        <>
          <label className="capture-field">
            <span>
              Description <span className="optional-label">Optional</span>
            </span>
            <textarea
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this goal"
              rows={2}
              value={description}
            />
          </label>

          <label className="capture-field">
            <span>
              Target date <span className="optional-label">Optional</span>
            </span>
            <input
              onChange={(e) => setTargetDate(e.target.value)}
              type="date"
              value={targetDate}
            />
          </label>
        </>
      )}

      {error && (
        <p aria-live="assertive" className="capture-validation" role="alert">
          {error}
        </p>
      )}

      <div className="capture-footer">
        <button className="capture-cancel" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving…" : "Save goal"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Form: Person
// ─────────────────────────────────────────────

function PersonForm({
  onSave,
  onCancel,
}: {
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [relationshipType, setRelationshipType] = useState<PersonRelationshipType>("Friend");
  const [notes, setNotes] = useState("");
  const [birthday, setBirthday] = useState("");
  const [reminderIntervalDays, setReminderIntervalDays] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Add a name before saving.");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      await createPerson({
        name: name.trim(),
        relationshipType,
        notes: notes.trim() || undefined,
        birthday: birthday || undefined,
        reminderIntervalDays: reminderIntervalDays
          ? Number(reminderIntervalDays)
          : undefined,
      });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save person.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="capture-form" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Name</span>
        <input
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="Full name"
          ref={nameRef}
          required
          value={name}
        />
      </label>

      <label className="capture-field">
        <span>Relationship</span>
        <select
          onChange={(e) => setRelationshipType(e.target.value as PersonRelationshipType)}
          value={relationshipType}
        >
          {personRelationshipTypes.map((rel) => (
            <option key={rel} value={rel}>
              {rel}
            </option>
          ))}
        </select>
      </label>

      <ExpandToggle expanded={expanded} onToggle={() => setExpanded((p) => !p)} />

      {expanded && (
        <>
          <label className="capture-field">
            <span>
              Notes <span className="optional-label">Optional</span>
            </span>
            <textarea
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything you want to remember about this person"
              rows={2}
              value={notes}
            />
          </label>

          <div className="capture-row">
            <label className="capture-field">
              <span>
                Birthday <span className="optional-label">Optional</span>
              </span>
              <input
                onChange={(e) => setBirthday(e.target.value)}
                type="date"
                value={birthday}
              />
            </label>

            <label className="capture-field">
              <span>
                Reconnect every <span className="optional-label">days</span>
              </span>
              <input
                inputMode="numeric"
                min="1"
                onChange={(e) => setReminderIntervalDays(e.target.value)}
                placeholder="e.g. 30"
                step="1"
                type="number"
                value={reminderIntervalDays}
              />
            </label>
          </div>
        </>
      )}

      {error && (
        <p aria-live="assertive" className="capture-validation" role="alert">
          {error}
        </p>
      )}

      <div className="capture-footer">
        <button className="capture-cancel" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving…" : "Save person"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Form: Wishlist Item
// ─────────────────────────────────────────────

function WishlistForm({
  currency,
  onSave,
  onCancel,
}: {
  currency: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<WishlistCategory>("Other");
  const [priority, setPriority] = useState<WishlistPriority>("Medium");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [description, setDescription] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Add a name before saving.");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      const price = estimatedPrice ? Number(estimatedPrice) : undefined;
      await createWishlistItem({
        name: name.trim(),
        category,
        priority,
        estimatedPrice: price !== undefined && !Number.isNaN(price) ? price : undefined,
        productUrl: productUrl.trim() || undefined,
        description: description.trim() || undefined,
      });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save wishlist item.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="capture-form" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Name</span>
        <input
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="What would you like to have?"
          ref={nameRef}
          required
          value={name}
        />
      </label>

      <div className="capture-row">
        <label className="capture-field">
          <span>Category</span>
          <select
            onChange={(e) => setCategory(e.target.value as WishlistCategory)}
            value={category}
          >
            {wishlistCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <label className="capture-field">
          <span>Priority</span>
          <select
            onChange={(e) => setPriority(e.target.value as WishlistPriority)}
            value={priority}
          >
            {wishlistPriorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ExpandToggle expanded={expanded} onToggle={() => setExpanded((p) => !p)} />

      {expanded && (
        <>
          <label className="capture-field">
            <span>
              Estimated price ({currency}){" "}
              <span className="optional-label">Optional</span>
            </span>
            <input
              inputMode="decimal"
              min="0"
              onChange={(e) => setEstimatedPrice(e.target.value)}
              placeholder="0.00"
              step="0.01"
              type="number"
              value={estimatedPrice}
            />
          </label>

          <label className="capture-field">
            <span>
              Product URL <span className="optional-label">Optional</span>
            </span>
            <input
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://…"
              type="url"
              value={productUrl}
            />
          </label>

          <label className="capture-field">
            <span>
              Description <span className="optional-label">Optional</span>
            </span>
            <textarea
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any extra details"
              rows={2}
              value={description}
            />
          </label>
        </>
      )}

      {error && (
        <p aria-live="assertive" className="capture-validation" role="alert">
          {error}
        </p>
      )}

      <div className="capture-footer">
        <button className="capture-cancel" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving…" : "Save item"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Form: Project
// ─────────────────────────────────────────────

function ProjectForm({
  onSave,
  onCancel,
}: {
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "paused" | "completed">("active");
  const [dueAt, setDueAt] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function toIso(dateStr: string): string | undefined {
    if (!dateStr) return undefined;
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day, 12).toISOString();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Add a project name before saving.");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      await createProject({
        name: name.trim(),
        description: description.trim(),
        status,
        dueAt: toIso(dueAt),
      });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save project.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="capture-form" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Name</span>
        <input
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="What are you working on?"
          ref={nameRef}
          required
          value={name}
        />
      </label>

      <div className="capture-row">
        <label className="capture-field">
          <span>Status</span>
          <select
            onChange={(e) => setStatus(e.target.value as "active" | "paused" | "completed")}
            value={status}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </label>

        <label className="capture-field">
          <span>
            Due date <span className="optional-label">Optional</span>
          </span>
          <input
            onChange={(e) => setDueAt(e.target.value)}
            type="date"
            value={dueAt}
          />
        </label>
      </div>

      <ExpandToggle expanded={expanded} onToggle={() => setExpanded((p) => !p)} />

      {expanded && (
        <label className="capture-field">
          <span>
            Description <span className="optional-label">Optional</span>
          </span>
          <textarea
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short description of this project"
            rows={2}
            value={description}
          />
        </label>
      )}

      {error && (
        <p aria-live="assertive" className="capture-validation" role="alert">
          {error}
        </p>
      )}

      <div className="capture-footer">
        <button className="capture-cancel" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="capture-submit" disabled={isSaving} type="submit">
          {isSaving ? "Saving…" : "Save project"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Main QuickCapture component
// ─────────────────────────────────────────────

export function QuickCapture() {
  const { preferences } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [captureType, setCaptureType] = useState<CaptureType>("task");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [successClearTimer, setSuccessClearTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Load projects for task form (project dropdown)
  useEffect(() => {
    if (!isOpen) return;
    listProjects().then((p) => setProjects(p)).catch(() => {});
  }, [isOpen]);

  // Global keyboard shortcut ⌘J / Ctrl+J
  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        setIsOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  function showSuccess(message: string) {
    if (successClearTimer) clearTimeout(successClearTimer);
    setSuccessMessage(message);
    const timer = setTimeout(() => setSuccessMessage(""), 3200);
    setSuccessClearTimer(timer);
  }

  function handleClose() {
    setIsOpen(false);
  }

  function handleSaved() {
    const label = typeLabels[captureType];
    setIsOpen(false);
    showSuccess(`${label} saved on this device.`);
  }

  function handleTypeChange(type: CaptureType) {
    setCaptureType(type);
  }

  return (
    <>
      <button
        aria-label="Quick capture"
        className="capture-trigger"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Icon name="plus" />
        <span>Capture</span>
        <kbd>⌘ J</kbd>
      </button>

      <ModalDialog
        description={typeDescriptions[captureType]}
        onClose={handleClose}
        open={isOpen}
        title="Quick capture"
      >
        {/* Type selector */}
        <div
          aria-label="Capture type"
          className="capture-type-selector"
          role="group"
        >
          {captureTypes.map((type) => (
            <button
              aria-pressed={captureType === type}
              className={`capture-type${captureType === type ? " is-selected" : ""}`}
              key={type}
              onClick={() => handleTypeChange(type)}
              type="button"
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>

        {/* Type-specific form */}
        {captureType === "task" && (
          <TaskForm
            onCancel={handleClose}
            onSave={handleSaved}
            projects={projects}
          />
        )}
        {captureType === "note" && (
          <NoteForm onCancel={handleClose} onSave={handleSaved} />
        )}
        {captureType === "expense" && (
          <ExpenseForm
            currency={preferences.currency}
            onCancel={handleClose}
            onSave={handleSaved}
          />
        )}
        {captureType === "journal" && (
          <JournalForm onCancel={handleClose} onSave={handleSaved} />
        )}
        {captureType === "goal" && (
          <GoalForm onCancel={handleClose} onSave={handleSaved} />
        )}
        {captureType === "person" && (
          <PersonForm onCancel={handleClose} onSave={handleSaved} />
        )}
        {captureType === "wishlist" && (
          <WishlistForm
            currency={preferences.currency}
            onCancel={handleClose}
            onSave={handleSaved}
          />
        )}
        {captureType === "project" && (
          <ProjectForm onCancel={handleClose} onSave={handleSaved} />
        )}
      </ModalDialog>

      {successMessage && (
        <p aria-live="polite" className="save-confirmation" role="status">
          {successMessage}
        </p>
      )}
    </>
  );
}
