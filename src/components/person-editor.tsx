"use client";

import { useState, type FormEvent } from "react";
import { ErrorNotice } from "@/components/local-data-ui";
import {
  isPersonRelationshipType,
  personRelationshipTypes,
  type PersonInput,
  type PersonRecord,
} from "@/lib/local-data";

export function PersonEditor({
  person,
  onSave,
}: {
  person: PersonRecord | null;
  onSave: (input: PersonInput) => Promise<void>;
}) {
  const [name, setName] = useState(person?.name ?? "");
  const [relationshipType, setRelationshipType] = useState(
    person?.relationshipType ?? "Friend",
  );
  const [birthday, setBirthday] = useState(person?.birthday ?? "");
  const [phoneNumber, setPhoneNumber] = useState(person?.phoneNumber ?? "");
  const [email, setEmail] = useState(person?.email ?? "");
  const [notes, setNotes] = useState(person?.notes ?? "");
  const [reminderIntervalDays, setReminderIntervalDays] = useState(
    person?.reminderIntervalDays?.toString() ?? "",
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const interval = reminderIntervalDays.trim()
      ? Number(reminderIntervalDays)
      : undefined;

    if (!trimmedName) {
      setError("Add a name before saving.");
      return;
    }
    if (
      interval !== undefined &&
      (!Number.isSafeInteger(interval) || interval <= 0)
    ) {
      setError("Contact reminder interval must be a positive whole number of days.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      await onSave({
        name: trimmedName,
        relationshipType,
        birthday: birthday || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        reminderIntervalDays: interval,
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The person could not be saved on this device.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Name</span>
        <input
          autoFocus
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </label>

      <label className="capture-field">
        <span>Relationship</span>
        <select
          onChange={(event) => {
            if (isPersonRelationshipType(event.target.value)) {
              setRelationshipType(event.target.value);
            }
          }}
          value={relationshipType}
        >
          {personRelationshipTypes.map((relationship) => (
            <option key={relationship} value={relationship}>
              {relationship}
            </option>
          ))}
        </select>
      </label>

      <label className="capture-field">
        <span>
          Birthday <span className="optional-label">Optional</span>
        </span>
        <input
          onChange={(event) => setBirthday(event.target.value)}
          type="date"
          value={birthday}
        />
      </label>

      <div className="person-contact-fields">
        <label className="capture-field">
          <span>
            Phone <span className="optional-label">Optional</span>
          </span>
          <input
            autoComplete="tel"
            onChange={(event) => setPhoneNumber(event.target.value)}
            type="tel"
            value={phoneNumber}
          />
        </label>
        <label className="capture-field">
          <span>
            Email <span className="optional-label">Optional</span>
          </span>
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </label>
      </div>

      <label className="capture-field">
        <span>
          Contact reminder{" "}
          <span className="optional-label">Optional · days</span>
        </span>
        <input
          min="1"
          onChange={(event) => setReminderIntervalDays(event.target.value)}
          step="1"
          type="number"
          value={reminderIntervalDays}
        />
      </label>

      <label className="capture-field">
        <span>
          Notes <span className="optional-label">Optional</span>
        </span>
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
          {isSaving ? "Saving..." : person ? "Save changes" : "Add person"}
        </button>
      </div>
    </form>
  );
}

export function PersonContactEditor({
  today,
  onSave,
}: {
  today: string;
  onSave: (date: string) => Promise<void>;
}) {
  const [date, setDate] = useState(today);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date) {
      setError("Choose a contact date.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      await onSave(date);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The contact date could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="person-contact-editor" onSubmit={handleSubmit}>
      <label className="capture-field">
        <span>Contact date</span>
        <input
          max={today}
          onChange={(event) => setDate(event.target.value)}
          required
          type="date"
          value={date}
        />
      </label>
      {error && <ErrorNotice message={error} />}
      <button className="text-button" disabled={isSaving} type="submit">
        {isSaving ? "Saving..." : "Record date"}
      </button>
    </form>
  );
}
