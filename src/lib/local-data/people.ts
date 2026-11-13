import {
  createLocalRepository,
  runLocalTransaction,
} from "@/lib/local-data/repository";
import {
  isPersonRelationshipType,
  type PersonInput,
  type PersonRecord,
} from "@/lib/local-data/models/person";
import { getLocalDateKey, isDateKey } from "@/lib/local-date";
import { requireNonBlank } from "@/lib/local-data/validation";

const recentContactDays = 7;
const dayMilliseconds = 24 * 60 * 60 * 1000;

function validatePerson(person: PersonRecord) {
  requireNonBlank(person.name, "Name");
  if (!isPersonRelationshipType(person.relationshipType)) {
    throw new Error("Choose a valid relationship type.");
  }
  for (const field of ["phoneNumber", "email", "notes"] as const) {
    if (person[field] !== undefined && typeof person[field] !== "string") {
      throw new Error("Person details must be text.");
    }
  }
  if (
    person.email?.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email.trim())
  ) {
    throw new Error("Enter a valid email address.");
  }
  for (const field of ["birthday", "lastContactedDate"] as const) {
    const date = person[field];
    if (date !== undefined && !isDateKey(date)) {
      throw new Error(`Choose a valid ${field === "birthday" ? "birthday" : "contact date"}.`);
    }
  }
  if (
    person.reminderIntervalDays !== undefined &&
    (!Number.isSafeInteger(person.reminderIntervalDays) ||
      person.reminderIntervalDays <= 0)
  ) {
    throw new Error("Contact reminder interval must be a positive whole number of days.");
  }
  if (typeof person.archived !== "boolean") {
    throw new Error("Person archive status is invalid.");
  }
  if (
    person.contactHistory !== undefined &&
    (!Array.isArray(person.contactHistory) ||
      person.contactHistory.some((date) => !isDateKey(date)))
  ) {
    throw new Error("Contact history contains an invalid date.");
  }
}

const peopleRepository = createLocalRepository<PersonRecord>(
  "people",
  validatePerson,
);

export function createPerson(input: PersonInput): Promise<PersonRecord> {
  return peopleRepository.create({ ...input, archived: false });
}

export const getPerson = peopleRepository.get;
export const listPeople = peopleRepository.list;
export const deletePerson = peopleRepository.delete;

export function updatePerson(
  id: string,
  changes: Partial<PersonInput> & { archived?: boolean },
): Promise<PersonRecord> {
  return peopleRepository.update(id, changes);
}

export function recordPersonContact(
  id: string,
  date: string,
): Promise<PersonRecord> {
  if (!isDateKey(date)) {
    return Promise.reject(new Error("Choose a valid contact date."));
  }
  if (date > getLocalDateKey(new Date())) {
    return Promise.reject(new Error("Contact dates cannot be in the future."));
  }

  return runLocalTransaction<PersonRecord>(
    "people",
    "readwrite",
    (store, setResult, fail) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existing = getRequest.result as PersonRecord | undefined;
        if (!existing) {
          fail(new Error("No person found with that ID."));
          return;
        }

        const contactHistory = [
          ...new Set([
            ...(existing.contactHistory ??
              (existing.lastContactedDate
                ? [existing.lastContactedDate]
                : [])),
            date,
          ]),
        ].sort((a, b) => a.localeCompare(b));
        const updated: PersonRecord = {
          ...existing,
          lastContactedDate: contactHistory[contactHistory.length - 1],
          contactHistory,
          updatedAt: new Date().toISOString(),
        };

        try {
          validatePerson(updated);
        } catch (error) {
          fail(
            error instanceof Error
              ? error
              : new Error("The contact date could not be saved."),
          );
          return;
        }

        const putRequest = store.put(updated);
        putRequest.onsuccess = () => setResult(updated);
      };
    },
  );
}

export type PersonReminders = {
  dueToReconnect: PersonRecord[];
  recentlyContacted: PersonRecord[];
  noContactDate: PersonRecord[];
};

export function getPersonReminders(
  people: PersonRecord[],
  today: string,
): PersonReminders {
  if (!isDateKey(today)) {
    return { dueToReconnect: [], recentlyContacted: [], noContactDate: [] };
  }
  const recentFrom = getDateKeyOffset(today, -(recentContactDays - 1));
  const activePeople = people.filter((person) => !person.archived);
  const dueToReconnect = activePeople
    .filter(
      (person) =>
        person.lastContactedDate &&
        person.reminderIntervalDays !== undefined &&
        getDateKeyOffset(
          person.lastContactedDate,
          person.reminderIntervalDays,
        ) <= today,
    )
    .sort((a, b) =>
      (a.lastContactedDate ?? "").localeCompare(b.lastContactedDate ?? ""),
    );
  const dueIds = new Set(dueToReconnect.map((person) => person.id));
  const recentlyContacted = activePeople
    .filter(
      (person) =>
        person.lastContactedDate &&
        !dueIds.has(person.id) &&
        person.lastContactedDate >= recentFrom &&
        person.lastContactedDate <= today,
    )
    .sort((a, b) =>
      (b.lastContactedDate ?? "").localeCompare(a.lastContactedDate ?? ""),
    );

  return {
    dueToReconnect,
    recentlyContacted,
    noContactDate: activePeople
      .filter((person) => !person.lastContactedDate)
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export type UpcomingBirthday = {
  person: PersonRecord;
  date: string;
  daysAway: number;
};

export function getNextBirthdayDate(
  birthday: string,
  today: string,
): string | null {
  if (!isDateKey(birthday) || !isDateKey(today)) return null;

  const monthDay = birthday.slice(5);
  const year = Number(today.slice(0, 4));
  let date = birthdayInYear(monthDay, year);
  if (date < today) date = birthdayInYear(monthDay, year + 1);
  return date;
}

export function getUpcomingBirthdays(
  people: PersonRecord[],
  today: string,
): UpcomingBirthday[] {
  if (!isDateKey(today)) return [];
  const todayTime = dateKeyToUtcTime(today);

  return people
    .filter((person) => !person.archived)
    .flatMap((person) => {
      if (!person.birthday) return [];
      const date = getNextBirthdayDate(person.birthday, today);
      if (!date) return [];
      return [
        {
          person,
          date,
          daysAway: Math.round(
            (dateKeyToUtcTime(date) - todayTime) / dayMilliseconds,
          ),
        },
      ];
    })
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.person.name.localeCompare(b.person.name),
    );
}

export function formatContactAge(date: string | undefined, today: string) {
  if (!date || !isDateKey(date) || !isDateKey(today)) {
    return "No contact date";
  }
  const daysAgo = Math.round(
    (dateKeyToUtcTime(today) - dateKeyToUtcTime(date)) / dayMilliseconds,
  );
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo > 1) return `${daysAgo} days ago`;
  return `On ${date}`;
}

function getDateKeyOffset(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(year, month - 1, day, 12);
  shifted.setDate(shifted.getDate() + days);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-${String(shifted.getDate()).padStart(2, "0")}`;
}

function birthdayInYear(monthDay: string, year: number) {
  if (monthDay === "02-29" && !isLeapYear(year)) {
    return `${year}-03-01`;
  }
  return `${year}-${monthDay}`;
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function dateKeyToUtcTime(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}
