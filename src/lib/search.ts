import {
  listExpenses,
  listGoals,
  listJournalEntries,
  listNotes,
  listPeople,
  listProjects,
  listTasks,
  listWishlistItems,
  calculateGoalProgress,
  formatGoalValue,
  type ExpenseRecord,
  type GoalRecord,
  type JournalEntryRecord,
  type NoteRecord,
  type PersonRecord,
  type ProjectRecord,
  type TaskRecord,
  type WishlistItemRecord,
} from "@/lib/local-data";
import { formatCurrency, formatLocalDate } from "@/lib/formatters";
import { formatDateKey } from "@/lib/local-date";
import type { CurrencyPreference } from "@/lib/preferences";
import type { IconName } from "@/components/icon";

export type SearchModule =
  | "tasks"
  | "projects"
  | "journal"
  | "notes"
  | "finance"
  | "goals"
  | "people"
  | "wishlist";

export type SearchResultMetadata = {
  label: string;
  type?: "status" | "priority" | "category" | "date" | "amount" | "info";
};

export type SearchResultItem = {
  id: string;
  module: SearchModule;
  moduleLabel: string;
  icon: IconName;
  title: string;
  excerpt: string;
  matchedField: string;
  metadata: SearchResultMetadata[];
  url: string;
  score: number;
  raw:
    | TaskRecord
    | ProjectRecord
    | JournalEntryRecord
    | NoteRecord
    | ExpenseRecord
    | GoalRecord
    | PersonRecord
    | WishlistItemRecord;
};

export type SearchGroup = {
  module: SearchModule;
  label: string;
  icon: IconName;
  items: SearchResultItem[];
  totalCount: number;
};

export type SearchResults = {
  query: string;
  totalCount: number;
  groups: SearchGroup[];
  flattenedItems: SearchResultItem[];
};

export const searchModules: {
  id: SearchModule;
  label: string;
  icon: IconName;
}[] = [
  { id: "tasks", label: "Tasks", icon: "task" },
  { id: "projects", label: "Projects", icon: "project" },
  { id: "journal", label: "Journal", icon: "journal" },
  { id: "notes", label: "Notes", icon: "journal" },
  { id: "finance", label: "Finance", icon: "finance" },
  { id: "goals", label: "Goals", icon: "goal" },
  { id: "people", label: "People", icon: "people" },
  { id: "wishlist", label: "Wishlist", icon: "wishlist" },
];

export type AllSearchRecords = {
  tasks: TaskRecord[];
  projects: ProjectRecord[];
  journalEntries: JournalEntryRecord[];
  notes: NoteRecord[];
  expenses: ExpenseRecord[];
  goals: GoalRecord[];
  people: PersonRecord[];
  wishlistItems: WishlistItemRecord[];
};

export async function loadAllSearchRecords(): Promise<AllSearchRecords> {
  const [
    tasks,
    projects,
    journalEntries,
    notes,
    expenses,
    goals,
    people,
    wishlistItems,
  ] = await Promise.all([
    listTasks(),
    listProjects(),
    listJournalEntries(),
    listNotes(),
    listExpenses(),
    listGoals(),
    listPeople(),
    listWishlistItems(),
  ]);

  return {
    tasks,
    projects,
    journalEntries,
    notes,
    expenses,
    goals,
    people,
    wishlistItems,
  };
}

export function sliceAround(
  text: string,
  matchIndex: number,
  matchLength: number,
  maxLength = 100,
): string {
  const contextLength = Math.max(0, Math.floor((maxLength - matchLength) / 2));
  let start = Math.max(0, matchIndex - contextLength);
  let end = Math.min(text.length, matchIndex + matchLength + contextLength);

  if (start > 0) {
    const spaceBefore = text.indexOf(" ", start);
    if (spaceBefore !== -1 && spaceBefore < matchIndex) {
      start = spaceBefore + 1;
    }
  }
  if (end < text.length) {
    const spaceAfter = text.lastIndexOf(" ", end);
    if (spaceAfter > matchIndex + matchLength) {
      end = spaceAfter;
    }
  }

  let excerpt = text.slice(start, end).trim();
  if (start > 0) excerpt = `…${excerpt}`;
  if (end < text.length) excerpt = `${excerpt}…`;
  return excerpt;
}

export function extractExcerpt(
  text: string | undefined,
  query: string,
  maxLength = 100,
): string {
  if (!text) return "";
  const singleLine = text.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
  if (!singleLine) return "";
  if (!query) {
    return singleLine.length > maxLength
      ? `${singleLine.slice(0, maxLength - 1)}…`
      : singleLine;
  }

  const lowerText = singleLine.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index !== -1) {
    return sliceAround(singleLine, index, query.length, maxLength);
  }

  const tokens = lowerQuery.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    const tokenIndex = lowerText.indexOf(token);
    if (tokenIndex !== -1) {
      return sliceAround(singleLine, tokenIndex, token.length, maxLength);
    }
  }

  return singleLine.length > maxLength
    ? `${singleLine.slice(0, maxLength - 1)}…`
    : singleLine;
}

type SearchField = {
  name: string;
  value: string | undefined;
  weight?: number;
};

type MatchResult = {
  matchedFieldName: string;
  matchedFieldValue: string;
  score: number;
};

function matchRecordFields(
  fields: SearchField[],
  query: string,
  tokens: string[],
): MatchResult | null {
  const validFields = fields.filter(
    (f): f is { name: string; value: string; weight?: number } =>
      Boolean(f.value && f.value.trim()),
  );

  if (!validFields.length) return null;

  // Every token must appear in at least one field
  const allTokensMatch = tokens.every((token) =>
    validFields.some((f) => f.value.toLowerCase().includes(token)),
  );

  if (!allTokensMatch) return null;

  let bestMatch: MatchResult | null = null;
  let highestScore = 0;

  for (const field of validFields) {
    const lower = field.value.toLowerCase();
    const weight = field.weight ?? 1;
    let score = 0;

    if (lower === query) {
      score = 100 * weight;
    } else if (lower.startsWith(query)) {
      score = 80 * weight;
    } else if (lower.includes(query)) {
      score = 60 * weight;
    } else {
      const matchingTokens = tokens.filter((t) => lower.includes(t));
      score = (matchingTokens.length / tokens.length) * 40 * weight;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        matchedFieldName: field.name,
        matchedFieldValue: field.value,
        score,
      };
    }
  }

  return bestMatch;
}

export function searchAllRecords(
  query: string,
  records: AllSearchRecords,
  currency: CurrencyPreference = "INR",
  activeModuleFilter: "all" | SearchModule = "all",
  maxPerGroup = 6,
): SearchResults {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      query: "",
      totalCount: 0,
      groups: [],
      flattenedItems: [],
    };
  }

  const lowerQuery = trimmed.toLowerCase();
  const tokens = lowerQuery.split(/\s+/).filter(Boolean);

  const groups: SearchGroup[] = [];
  let totalCount = 0;

  // 1. Tasks: title, notes
  if (activeModuleFilter === "all" || activeModuleFilter === "tasks") {
    const items: SearchResultItem[] = [];
    for (const task of records.tasks) {
      const match = matchRecordFields(
        [
          { name: "title", value: task.title, weight: 1.5 },
          { name: "notes", value: task.notes, weight: 1.0 },
        ],
        lowerQuery,
        tokens,
      );

      if (!match) continue;

      const excerpt =
        match.matchedFieldName === "notes"
          ? extractExcerpt(task.notes, trimmed)
          : extractExcerpt(task.notes, "", 90) || "No additional notes";

      const metadata: SearchResultMetadata[] = [];
      if (task.completed) {
        metadata.push({ label: "Completed", type: "status" });
      } else {
        metadata.push({ label: "Open", type: "status" });
      }
      if (task.priority) {
        metadata.push({
          label: `${task.priority.toUpperCase()}`,
          type: "priority",
        });
      }
      if (task.dueAt) {
        metadata.push({
          label: `Due ${formatLocalDate(task.dueAt)}`,
          type: "date",
        });
      }

      items.push({
        id: task.id,
        module: "tasks",
        moduleLabel: "Tasks",
        icon: "task",
        title: task.title,
        excerpt,
        matchedField: match.matchedFieldName,
        metadata,
        url: `/tasks?taskId=${task.id}`,
        score: match.score,
        raw: task,
      });
    }

    if (items.length) {
      items.sort((a, b) => b.score - a.score || b.raw.updatedAt.localeCompare(a.raw.updatedAt));
      totalCount += items.length;
      groups.push({
        module: "tasks",
        label: "Tasks",
        icon: "task",
        items: activeModuleFilter === "all" ? items.slice(0, maxPerGroup) : items,
        totalCount: items.length,
      });
    }
  }

  // 2. Projects: name, description
  if (activeModuleFilter === "all" || activeModuleFilter === "projects") {
    const items: SearchResultItem[] = [];
    for (const project of records.projects) {
      const match = matchRecordFields(
        [
          { name: "name", value: project.name, weight: 1.5 },
          { name: "description", value: project.description, weight: 1.0 },
        ],
        lowerQuery,
        tokens,
      );

      if (!match) continue;

      const excerpt =
        match.matchedFieldName === "description"
          ? extractExcerpt(project.description, trimmed)
          : extractExcerpt(project.description, "", 90) || "No description";

      const metadata: SearchResultMetadata[] = [
        {
          label: project.status.charAt(0).toUpperCase() + project.status.slice(1),
          type: "status",
        },
      ];
      if (project.dueAt) {
        metadata.push({
          label: `Due ${formatLocalDate(project.dueAt)}`,
          type: "date",
        });
      }

      items.push({
        id: project.id,
        module: "projects",
        moduleLabel: "Projects",
        icon: "project",
        title: project.name,
        excerpt,
        matchedField: match.matchedFieldName,
        metadata,
        url: `/projects?projectId=${project.id}`,
        score: match.score,
        raw: project,
      });
    }

    if (items.length) {
      items.sort((a, b) => b.score - a.score || b.raw.updatedAt.localeCompare(a.raw.updatedAt));
      totalCount += items.length;
      groups.push({
        module: "projects",
        label: "Projects",
        icon: "project",
        items: activeModuleFilter === "all" ? items.slice(0, maxPerGroup) : items,
        totalCount: items.length,
      });
    }
  }

  // 3. Journal entries: title, content, highlights, gratitude, reflection
  if (activeModuleFilter === "all" || activeModuleFilter === "journal") {
    const items: SearchResultItem[] = [];
    for (const entry of records.journalEntries) {
      const match = matchRecordFields(
        [
          { name: "title", value: entry.title, weight: 1.5 },
          { name: "content", value: entry.content, weight: 1.2 },
          { name: "highlights", value: entry.highlights, weight: 1.0 },
          { name: "gratitude", value: entry.gratitude, weight: 1.0 },
          { name: "reflection", value: entry.reflection, weight: 1.0 },
        ],
        lowerQuery,
        tokens,
      );

      if (!match) continue;

      let excerpt = "";
      if (match.matchedFieldName === "highlights") {
        excerpt = `Highlights: ${extractExcerpt(entry.highlights, trimmed)}`;
      } else if (match.matchedFieldName === "gratitude") {
        excerpt = `Gratitude: ${extractExcerpt(entry.gratitude, trimmed)}`;
      } else if (match.matchedFieldName === "reflection") {
        excerpt = `Reflection: ${extractExcerpt(entry.reflection, trimmed)}`;
      } else if (match.matchedFieldName === "content") {
        excerpt = extractExcerpt(entry.content, trimmed);
      } else {
        excerpt = extractExcerpt(entry.content, "", 90);
      }

      const metadata: SearchResultMetadata[] = [
        { label: formatDateKey(entry.date), type: "date" },
      ];
      if (entry.mood) {
        metadata.push({
          label: entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1),
          type: "info",
        });
      }

      const title =
        entry.title?.trim() ||
        entry.content.split(/\r?\n/, 1)[0]?.trim() ||
        `Entry for ${formatDateKey(entry.date)}`;

      items.push({
        id: entry.id,
        module: "journal",
        moduleLabel: "Journal",
        icon: "journal",
        title,
        excerpt,
        matchedField: match.matchedFieldName,
        metadata,
        url: `/journal?date=${entry.date}`,
        score: match.score,
        raw: entry,
      });
    }

    if (items.length) {
      items.sort((a, b) => b.score - a.score || b.raw.updatedAt.localeCompare(a.raw.updatedAt));
      totalCount += items.length;
      groups.push({
        module: "journal",
        label: "Journal",
        icon: "journal",
        items: activeModuleFilter === "all" ? items.slice(0, maxPerGroup) : items,
        totalCount: items.length,
      });
    }
  }

  // 4. Notes: title, content
  if (activeModuleFilter === "all" || activeModuleFilter === "notes") {
    const items: SearchResultItem[] = [];
    for (const note of records.notes) {
      const match = matchRecordFields(
        [
          { name: "title", value: note.title, weight: 1.5 },
          { name: "content", value: note.content, weight: 1.0 },
        ],
        lowerQuery,
        tokens,
      );

      if (!match) continue;

      const excerpt = extractExcerpt(note.content, trimmed);
      const title =
        note.title?.trim() ||
        note.content.split(/\r?\n/, 1)[0]?.trim() ||
        "Untitled note";

      const metadata: SearchResultMetadata[] = [
        { label: formatLocalDate(note.createdAt), type: "date" },
      ];

      items.push({
        id: note.id,
        module: "notes",
        moduleLabel: "Notes",
        icon: "journal",
        title,
        excerpt,
        matchedField: match.matchedFieldName,
        metadata,
        url: `/journal?noteId=${note.id}`,
        score: match.score,
        raw: note,
      });
    }

    if (items.length) {
      items.sort((a, b) => b.score - a.score || b.raw.updatedAt.localeCompare(a.raw.updatedAt));
      totalCount += items.length;
      groups.push({
        module: "notes",
        label: "Notes",
        icon: "journal",
        items: activeModuleFilter === "all" ? items.slice(0, maxPerGroup) : items,
        totalCount: items.length,
      });
    }
  }

  // 5. Finance: description, notes, category
  if (activeModuleFilter === "all" || activeModuleFilter === "finance") {
    const items: SearchResultItem[] = [];
    for (const expense of records.expenses) {
      const match = matchRecordFields(
        [
          { name: "description", value: expense.description, weight: 1.5 },
          { name: "notes", value: expense.notes, weight: 1.0 },
          { name: "category", value: expense.category, weight: 1.1 },
        ],
        lowerQuery,
        tokens,
      );

      if (!match) continue;

      const excerpt =
        match.matchedFieldName === "notes"
          ? extractExcerpt(expense.notes, trimmed)
          : match.matchedFieldName === "category"
            ? `Category: ${expense.category}`
            : extractExcerpt(expense.notes, "", 90) || `Category: ${expense.category ?? "Other"}`;

      const amountNum = Number(expense.amount);
      const metadata: SearchResultMetadata[] = [];
      if (Number.isFinite(amountNum)) {
        metadata.push({
          label: formatCurrency(amountNum, currency),
          type: "amount",
        });
      }
      if (expense.category) {
        metadata.push({ label: expense.category, type: "category" });
      }
      metadata.push({
        label: formatLocalDate(expense.createdAt),
        type: "date",
      });

      items.push({
        id: expense.id,
        module: "finance",
        moduleLabel: "Finance",
        icon: "finance",
        title: expense.description,
        excerpt,
        matchedField: match.matchedFieldName,
        metadata,
        url: `/finance?expenseId=${expense.id}`,
        score: match.score,
        raw: expense,
      });
    }

    if (items.length) {
      items.sort((a, b) => b.score - a.score || b.raw.updatedAt.localeCompare(a.raw.updatedAt));
      totalCount += items.length;
      groups.push({
        module: "finance",
        label: "Finance",
        icon: "finance",
        items: activeModuleFilter === "all" ? items.slice(0, maxPerGroup) : items,
        totalCount: items.length,
      });
    }
  }

  // 6. Goals: title, description, lifeArea
  if (activeModuleFilter === "all" || activeModuleFilter === "goals") {
    const items: SearchResultItem[] = [];
    for (const goal of records.goals) {
      const match = matchRecordFields(
        [
          { name: "title", value: goal.title, weight: 1.5 },
          { name: "description", value: goal.description, weight: 1.0 },
          { name: "lifeArea", value: goal.lifeArea, weight: 1.1 },
        ],
        lowerQuery,
        tokens,
      );

      if (!match) continue;

      const progress = calculateGoalProgress(goal.currentValue, goal.targetValue);
      const excerpt =
        match.matchedFieldName === "description"
          ? extractExcerpt(goal.description, trimmed)
          : extractExcerpt(goal.description, "", 90) ||
            `${formatGoalValue(goal.currentValue, goal.unit)} of ${formatGoalValue(goal.targetValue, goal.unit)}`;

      const metadata: SearchResultMetadata[] = [
        { label: goal.lifeArea, type: "category" },
        { label: `${progress}%`, type: "status" },
      ];
      if (goal.targetDate) {
        metadata.push({
          label: `Target ${formatDateKey(goal.targetDate)}`,
          type: "date",
        });
      }

      items.push({
        id: goal.id,
        module: "goals",
        moduleLabel: "Goals",
        icon: "goal",
        title: goal.title,
        excerpt,
        matchedField: match.matchedFieldName,
        metadata,
        url: `/goals?goalId=${goal.id}`,
        score: match.score,
        raw: goal,
      });
    }

    if (items.length) {
      items.sort((a, b) => b.score - a.score || b.raw.updatedAt.localeCompare(a.raw.updatedAt));
      totalCount += items.length;
      groups.push({
        module: "goals",
        label: "Goals",
        icon: "goal",
        items: activeModuleFilter === "all" ? items.slice(0, maxPerGroup) : items,
        totalCount: items.length,
      });
    }
  }

  // 7. People: name, notes, relationship
  if (activeModuleFilter === "all" || activeModuleFilter === "people") {
    const items: SearchResultItem[] = [];
    for (const person of records.people) {
      const match = matchRecordFields(
        [
          { name: "name", value: person.name, weight: 1.5 },
          { name: "notes", value: person.notes, weight: 1.0 },
          { name: "relationshipType", value: person.relationshipType, weight: 1.1 },
        ],
        lowerQuery,
        tokens,
      );

      if (!match) continue;

      const excerpt =
        match.matchedFieldName === "notes"
          ? extractExcerpt(person.notes, trimmed)
          : extractExcerpt(person.notes, "", 90) ||
            (person.lastContactedDate
              ? `Last talked: ${formatDateKey(person.lastContactedDate)}`
              : "No contact date recorded");

      const metadata: SearchResultMetadata[] = [
        { label: person.relationshipType, type: "info" },
      ];
      if (person.archived) {
        metadata.push({ label: "Archived", type: "status" });
      }
      if (person.birthday) {
        metadata.push({
          label: `Birthday ${formatDateKey(person.birthday)}`,
          type: "date",
        });
      }

      items.push({
        id: person.id,
        module: "people",
        moduleLabel: "People",
        icon: "people",
        title: person.name,
        excerpt,
        matchedField: match.matchedFieldName,
        metadata,
        url: `/people?personId=${person.id}`,
        score: match.score,
        raw: person,
      });
    }

    if (items.length) {
      items.sort((a, b) => b.score - a.score || b.raw.updatedAt.localeCompare(a.raw.updatedAt));
      totalCount += items.length;
      groups.push({
        module: "people",
        label: "People",
        icon: "people",
        items: activeModuleFilter === "all" ? items.slice(0, maxPerGroup) : items,
        totalCount: items.length,
      });
    }
  }

  // 8. Wishlist: name, description, category
  if (activeModuleFilter === "all" || activeModuleFilter === "wishlist") {
    const items: SearchResultItem[] = [];
    for (const item of records.wishlistItems) {
      const match = matchRecordFields(
        [
          { name: "name", value: item.name, weight: 1.5 },
          { name: "description", value: item.description, weight: 1.0 },
          { name: "category", value: item.category, weight: 1.1 },
        ],
        lowerQuery,
        tokens,
      );

      if (!match) continue;

      const excerpt =
        match.matchedFieldName === "description"
          ? extractExcerpt(item.description, trimmed)
          : extractExcerpt(item.description, "", 90) || `Category: ${item.category}`;

      const metadata: SearchResultMetadata[] = [
        {
          label: item.status === "purchased" ? "Purchased" : "Wanted",
          type: "status",
        },
        { label: `${item.priority} priority`, type: "priority" },
        { label: item.category, type: "category" },
      ];

      const price =
        item.status === "purchased" && item.purchasePrice !== undefined
          ? item.purchasePrice
          : item.estimatedPrice;
      if (price !== undefined) {
        metadata.push({
          label: formatCurrency(price, currency),
          type: "amount",
        });
      }

      items.push({
        id: item.id,
        module: "wishlist",
        moduleLabel: "Wishlist",
        icon: "wishlist",
        title: item.name,
        excerpt,
        matchedField: match.matchedFieldName,
        metadata,
        url: `/wishlist?itemId=${item.id}`,
        score: match.score,
        raw: item,
      });
    }

    if (items.length) {
      items.sort((a, b) => b.score - a.score || b.raw.updatedAt.localeCompare(a.raw.updatedAt));
      totalCount += items.length;
      groups.push({
        module: "wishlist",
        label: "Wishlist",
        icon: "wishlist",
        items: activeModuleFilter === "all" ? items.slice(0, maxPerGroup) : items,
        totalCount: items.length,
      });
    }
  }

  const flattenedItems = groups.flatMap((group) => group.items);

  return {
    query: trimmed,
    totalCount,
    groups,
    flattenedItems,
  };
}
