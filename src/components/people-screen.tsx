"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EmptyState,
  ErrorNotice,
  LoadingState,
  ScreenHeader,
} from "@/components/local-data-ui";
import { ModalDialog } from "@/components/modal-dialog";
import { PersonContactEditor, PersonEditor } from "@/components/person-editor";
import { useLocalRecords } from "@/hooks/use-local-records";
import {
  createPerson,
  deletePerson,
  formatContactAge,
  getNextBirthdayDate,
  getPersonReminders,
  getUpcomingBirthdays,
  isPersonRelationshipType,
  listPeople,
  personRelationshipTypes,
  recordPersonContact,
  updatePerson,
  type PersonInput,
  type PersonRecord,
  type PersonRelationshipType,
} from "@/lib/local-data";
import { formatDateKey, getLocalDateKey } from "@/lib/local-date";

type PersonStatusFilter = "active" | "archived";
type ContactFilter = "all" | "due" | "recent" | "none";
type DialogMode = "closed" | "form" | "detail";

const contactFilters: { value: ContactFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "due", label: "Due to reconnect" },
  { value: "recent", label: "Recently contacted" },
  { value: "none", label: "No contact date" },
];

function PersonSummary({
  person,
  today,
  onOpen,
  onTalkedToday,
}: {
  person: PersonRecord;
  today: string;
  onOpen: () => void;
  onTalkedToday: () => void;
}) {
  return (
    <li className="person-row">
      <button
        aria-label={`Open ${person.name} details`}
        className="person-summary"
        onClick={onOpen}
        type="button"
      >
        <span className="person-summary-heading">
          <span className="person-summary-name">{person.name}</span>
          <span className="person-summary-relationship">
            {person.relationshipType}
          </span>
        </span>
        <span className="person-summary-meta">
          <span>{formatContactAge(person.lastContactedDate, today)}</span>
          {person.reminderIntervalDays && person.lastContactedDate && (
            <span>Every {person.reminderIntervalDays} days</span>
          )}
        </span>
      </button>
      {!person.archived && (
        <button
          aria-label={`Mark ${person.name} as contacted today`}
          className="person-quick-contact"
          onClick={onTalkedToday}
          type="button"
        >
          Talked today
        </button>
      )}
      <span aria-hidden="true" className="person-row-affordance">
        Details
      </span>
    </li>
  );
}

function birthdayLabel(daysAway: number) {
  if (daysAway === 0) return "Today";
  if (daysAway === 1) return "Tomorrow";
  return `In ${daysAway} days`;
}

export function PeopleScreen() {
  const people = useLocalRecords("people", listPeople);
  const [today, setToday] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<PersonStatusFilter>("active");
  const [contactFilter, setContactFilter] =
    useState<ContactFilter>("all");
  const [relationshipFilter, setRelationshipFilter] = useState<
    PersonRelationshipType | "all"
  >("all");
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>("closed");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [operationError, setOperationError] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setToday(getLocalDateKey(new Date()));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const selectedPerson =
    people.records.find((person) => person.id === selectedPersonId) ?? null;
  const reminders = useMemo(
    () => getPersonReminders(people.records, today),
    [people.records, today],
  );
  const upcomingBirthdays = useMemo(
    () => getUpcomingBirthdays(people.records, today),
    [people.records, today],
  );
  const activeCount = people.records.filter((person) => !person.archived).length;
  const archivedCount = people.records.length - activeCount;

  const contactIds = new Set(
    contactFilter === "due"
      ? reminders.dueToReconnect.map((person) => person.id)
      : contactFilter === "recent"
        ? reminders.recentlyContacted.map((person) => person.id)
        : contactFilter === "none"
          ? reminders.noContactDate.map((person) => person.id)
          : [],
  );
  const visiblePeople = [...people.records]
    .filter((person) =>
      statusFilter === "archived" ? person.archived : !person.archived,
    )
    .filter(
      (person) =>
        relationshipFilter === "all" ||
        person.relationshipType === relationshipFilter,
    )
    .filter((person) =>
      person.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
    )
    .filter(
      (person) =>
        statusFilter === "archived" ||
        contactFilter === "all" ||
        contactIds.has(person.id),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  function closeDialog() {
    setDialogMode("closed");
    setSelectedPersonId(null);
    setOperationError("");
  }

  function openPersonDetails(personId: string) {
    setSelectedPersonId(personId);
    setOperationError("");
    setDialogMode("detail");
  }

  function openPersonEditor(person: PersonRecord | null = null) {
    setSelectedPersonId(person?.id ?? null);
    setOperationError("");
    setDialogMode("form");
  }

  async function savePerson(input: PersonInput) {
    if (selectedPersonId) {
      await updatePerson(selectedPersonId, input);
      setDialogMode("detail");
      return;
    }
    await createPerson(input);
    closeDialog();
  }

  async function markContacted(personId: string, date = getLocalDateKey(new Date())) {
    setOperationError("");
    try {
      await recordPersonContact(personId, date);
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "The contact date could not be saved.",
      );
    }
  }

  async function toggleArchived() {
    if (!selectedPerson) return;
    setOperationError("");
    try {
      await updatePerson(selectedPerson.id, {
        archived: !selectedPerson.archived,
      });
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "The archive status could not be updated.",
      );
    }
  }

  async function removePerson() {
    if (!selectedPerson) return;
    if (
      !window.confirm(
        `Delete “${selectedPerson.name}”? This cannot be undone.`,
      )
    ) {
      return;
    }
    setOperationError("");
    try {
      await deletePerson(selectedPerson.id);
      closeDialog();
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "The person could not be deleted.",
      );
    }
  }

  function changeRelationshipFilter(value: string) {
    setRelationshipFilter(
      value === "all" || isPersonRelationshipType(value) ? value : "all",
    );
  }

  const isLoading = people.isLoading;
  const dialogTitle =
    dialogMode === "form"
      ? selectedPerson
        ? "Edit person"
        : "Add a person"
      : selectedPerson?.name ?? "Person details";
  const dialogDescription =
    dialogMode === "form"
      ? "Keep only the details that are useful to remember."
      : "A private, focused view of your relationship notes.";

  return (
    <div className="data-screen people-screen">
      <ScreenHeader
        action={
          <button
            className="capture-submit"
            onClick={() => openPersonEditor()}
            type="button"
          >
            + Add person
          </button>
        }
        description="A quiet place to remember the people in your life."
        kicker="YOUR SPACE"
        title="People"
      />

      {people.error && (
        <ErrorNotice message={people.error} onRetry={people.reload} />
      )}
      {operationError && dialogMode === "closed" && (
        <ErrorNotice message={operationError} />
      )}

      <div aria-label="Filter people by status" className="record-filters" role="group">
        {([
          ["active", "Active", activeCount],
          ["archived", "Archived", archivedCount],
        ] as const).map(([value, label, count]) => (
          <button
            aria-pressed={statusFilter === value}
            className={
              statusFilter === value ? "record-filter is-active" : "record-filter"
            }
            key={value}
            onClick={() => {
              setStatusFilter(value);
              if (value === "archived") setContactFilter("all");
            }}
            type="button"
          >
            {label} <span>{count}</span>
          </button>
        ))}
      </div>

      {statusFilter === "active" && (
        <section aria-labelledby="people-reconnect-heading" className="people-reconnect">
          <div className="people-section-heading">
            <h2 id="people-reconnect-heading">Reconnect</h2>
            <span>Gentle reminders, only when you want them.</span>
          </div>
          <div aria-label="Filter by contact status" className="record-filters" role="group">
            {contactFilters.map(({ value, label }) => {
              const count =
                value === "due"
                  ? reminders.dueToReconnect.length
                  : value === "recent"
                    ? reminders.recentlyContacted.length
                    : value === "none"
                      ? reminders.noContactDate.length
                      : activeCount;
              return (
                <button
                  aria-pressed={contactFilter === value}
                  className={
                    contactFilter === value
                      ? "record-filter is-active"
                      : "record-filter"
                  }
                  key={value}
                  onClick={() => setContactFilter(value)}
                  type="button"
                >
                  {label} <span>{count}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section aria-labelledby="people-birthdays-heading" className="people-birthdays">
        <div className="people-section-heading">
          <h2 id="people-birthdays-heading">Upcoming birthdays</h2>
          <span>Next in your circle</span>
        </div>
        {upcomingBirthdays.length ? (
          <ul className="people-birthday-list">
            {upcomingBirthdays.slice(0, 3).map(({ person, date, daysAway }) => (
              <li key={`${person.id}-${date}`}>
                <button
                  className="people-birthday-item"
                  onClick={() => openPersonDetails(person.id)}
                  type="button"
                >
                  <span>{person.name}</span>
                  <span>{birthdayLabel(daysAway)}</span>
                  <time dateTime={date}>{formatDateKey(date, { day: "numeric", month: "short" })}</time>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="people-subtle-copy">
            Birthdays appear here when you choose to add them.
          </p>
        )}
      </section>

      <div className="people-list-controls">
        <label className="people-search-field">
          <span>Search by name</span>
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find someone"
            type="search"
            value={search}
          />
        </label>
        <label className="people-relationship-filter">
          <span>Relationship</span>
          <select
            aria-label="Filter by relationship type"
            onChange={(event) => changeRelationshipFilter(event.target.value)}
            value={relationshipFilter}
          >
            <option value="all">All relationships</option>
            {personRelationshipTypes.map((relationship) => (
              <option key={relationship} value={relationship}>
                {relationship}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <LoadingState label="Loading people from this device..." />
      ) : people.error ? null : visiblePeople.length ? (
        <>
          <div className="people-section-heading people-list-heading">
            <h2>{statusFilter === "active" ? "Your people" : "Archived"}</h2>
            <span>{visiblePeople.length} shown</span>
          </div>
          <ul className="people-list">
            {visiblePeople.map((person) => (
              <PersonSummary
                key={person.id}
                onOpen={() => openPersonDetails(person.id)}
                onTalkedToday={() => void markContacted(person.id)}
                person={person}
                today={today}
              />
            ))}
          </ul>
        </>
      ) : (
        <EmptyState
          action={
            statusFilter === "active" && !search ? (
              <button
                className="text-button"
                onClick={() => openPersonEditor()}
                type="button"
              >
                Add a person
              </button>
            ) : undefined
          }
          description={
            statusFilter === "archived"
              ? "People you archive will stay here until you restore them."
              : search || relationshipFilter !== "all" || contactFilter !== "all"
                ? "No people match the current filters."
                : "People you add stay private on this device. Contact details are optional."
          }
          title={
            statusFilter === "archived"
              ? "Nothing archived."
              : search || relationshipFilter !== "all" || contactFilter !== "all"
                ? "No matches."
                : "A little space for your circle."
          }
        />
      )}

      <p className="local-data-footnote">
        Contact reminders are private, informational, and stored only on this device.
      </p>

      <ModalDialog
        description={dialogDescription}
        onClose={closeDialog}
        open={dialogMode !== "closed"}
        title={dialogTitle}
      >
        {dialogMode === "form" && (
          <PersonEditor
            key={selectedPerson?.id ?? "new-person"}
            onSave={savePerson}
            person={selectedPerson}
          />
        )}
        {dialogMode === "detail" &&
          (selectedPerson ? (
            <div className="person-detail">
              <div className="person-detail-meta">
                <span>{selectedPerson.relationshipType}</span>
                <span>
                  {selectedPerson.archived ? "Archived" : "Active"}
                </span>
              </div>
              {selectedPerson.notes?.trim() && (
                <p className="person-detail-notes">{selectedPerson.notes}</p>
              )}

              <div className="person-detail-contact">
                {selectedPerson.phoneNumber && (
                  <a href={`tel:${selectedPerson.phoneNumber}`}>
                    {selectedPerson.phoneNumber}
                  </a>
                )}
                {selectedPerson.email && (
                  <a href={`mailto:${selectedPerson.email}`}>
                    {selectedPerson.email}
                  </a>
                )}
                {selectedPerson.birthday && (
                  <span>
                    Birthday ·{" "}
                    {formatDateKey(selectedPerson.birthday, {
                      day: "numeric",
                      month: "long",
                    })}
                    {today && (
                      <>
                        {" "}· Next{" "}
                        {formatDateKey(
                          getNextBirthdayDate(selectedPerson.birthday, today) ??
                            selectedPerson.birthday,
                          { day: "numeric", month: "short" },
                        )}
                      </>
                    )}
                  </span>
                )}
                {selectedPerson.reminderIntervalDays && (
                  <span>
                    Reconnect reminder · every{" "}
                    {selectedPerson.reminderIntervalDays} days
                  </span>
                )}
              </div>

              <div className="person-contact-status">
                <span>Last contacted</span>
                <strong>
                  {formatContactAge(selectedPerson.lastContactedDate, today)}
                </strong>
                {selectedPerson.lastContactedDate && (
                  <time dateTime={selectedPerson.lastContactedDate}>
                    {formatDateKey(selectedPerson.lastContactedDate)}
                  </time>
                )}
              </div>

              {!selectedPerson.archived && (
                <div className="person-contact-actions">
                  <button
                    className="capture-submit"
                    onClick={() => void markContacted(selectedPerson.id)}
                    type="button"
                  >
                    Talked today
                  </button>
                  <details className="person-contact-disclosure">
                    <summary>Record a specific date</summary>
                    <PersonContactEditor
                      key={selectedPerson.id}
                      onSave={(date) => markContacted(selectedPerson.id, date)}
                      today={today || getLocalDateKey(new Date())}
                    />
                  </details>
                </div>
              )}

              {selectedPerson.contactHistory?.length ? (
                <div className="person-history">
                  <h3>Recent contacts</h3>
                  <ul>
                    {[...selectedPerson.contactHistory]
                      .reverse()
                      .slice(0, 5)
                      .map((date) => (
                        <li key={date}>
                          <time dateTime={date}>{formatDateKey(date)}</time>
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}

              <div className="person-detail-actions">
                <button
                  className="text-button"
                  onClick={() => openPersonEditor(selectedPerson)}
                  type="button"
                >
                  Edit
                </button>
                <button className="text-button" onClick={() => void toggleArchived()} type="button">
                  {selectedPerson.archived ? "Restore" : "Archive"}
                </button>
                <button
                  className="text-button destructive-text"
                  onClick={() => void removePerson()}
                  type="button"
                >
                  Delete
                </button>
              </div>
              {operationError && <ErrorNotice message={operationError} />}
            </div>
          ) : (
            <ErrorNotice message="This person is no longer available." />
          ))}
      </ModalDialog>
    </div>
  );
}
