import type { LocalRecord } from "@/lib/local-data/models/common";

export const personRelationshipTypes = [
  "Family",
  "Friend",
  "Colleague",
  "Other",
] as const;

export type PersonRelationshipType =
  (typeof personRelationshipTypes)[number];

export function isPersonRelationshipType(
  value: string,
): value is PersonRelationshipType {
  return personRelationshipTypes.some((relationship) => relationship === value);
}

export type PersonRecord = LocalRecord & {
  name: string;
  relationshipType: PersonRelationshipType;
  birthday?: string;
  phoneNumber?: string;
  email?: string;
  notes?: string;
  lastContactedDate?: string;
  reminderIntervalDays?: number;
  archived: boolean;
  contactHistory?: string[];
};

export type PersonInput = Pick<
  PersonRecord,
  | "name"
  | "relationshipType"
  | "birthday"
  | "phoneNumber"
  | "email"
  | "notes"
  | "reminderIntervalDays"
>;
