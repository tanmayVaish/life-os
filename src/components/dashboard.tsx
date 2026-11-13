"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ActivityOverview } from "@/components/activity-overview";
import { EmptyState, ErrorNotice, LoadingState } from "@/components/local-data-ui";
import { SectionHeading } from "@/components/section-heading";
import { SummaryMetric } from "@/components/summary-metric";
import { TaskRow } from "@/components/task-row";
import { useLocalRecords } from "@/hooks/use-local-records";
import { usePreferences } from "@/hooks/use-preferences";
import {
  listExpenses,
  calculateGoalProgress,
  formatGoalValue,
  listGoals,
  listJournalEntries,
  listNotes,
  getPersonReminders,
  getUpcomingBirthdays,
  listPeople,
  listProjects,
  listTasks,
  listWishlistItems,
  summarizeWishlist,
  type GoalRecord,
  type LocalRecord,
  getProjectProgress,
  updateTask,
} from "@/lib/local-data";
import { formatCompactCurrency, formatLocalDate } from "@/lib/formatters";
import { getLocalDateKey } from "@/lib/local-date";
import {
  filterExpensesByDateRange,
  getExpenseDateRange,
  summarizeExpenses,
} from "@/lib/expense-insights";

type ActivityDay = { day: string; height: string; date: Date; count: number };

function getActivityDays(records: LocalRecord[], currentDate: Date): ActivityDay[] {
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return { date, count: 0 };
  });
  const counts = new Map<string, number>(
    days.map(({ date }) => [date.toDateString(), 0]),
  );

  for (const record of records) {
    const date = new Date(record.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    date.setHours(0, 0, 0, 0);
    const key = date.toDateString();
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const maxCount = Math.max(0, ...counts.values());
  return days.map(({ date }) => {
    const count = counts.get(date.toDateString()) ?? 0;
    const height =
      maxCount === 0
        ? "0%"
        : `${count === 0 ? 0 : Math.max(14, Math.round((count / maxCount) * 100))}%`;
    return {
      date,
      count,
      day: new Intl.DateTimeFormat("en", { weekday: "narrow" }).format(date),
      height,
    };
  });
}

function countLabel(value: number) {
  return String(value).padStart(2, "0");
}

export function Dashboard() {
  const { preferences } = usePreferences();
  const tasks = useLocalRecords("tasks", listTasks);
  const projects = useLocalRecords("projects", listProjects);
  const goals = useLocalRecords("goals", listGoals);
  const people = useLocalRecords("people", listPeople);
  const notes = useLocalRecords("notes", listNotes);
  const journal = useLocalRecords("journalEntries", listJournalEntries);
  const expenses = useLocalRecords("expenses", listExpenses);
  const wishlist = useLocalRecords("wishlistItems", listWishlistItems);
  const [operationError, setOperationError] = useState("");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCurrentDate(new Date()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const isLoading =
    tasks.isLoading ||
    projects.isLoading ||
    goals.isLoading ||
    people.isLoading ||
    notes.isLoading ||
    journal.isLoading ||
    expenses.isLoading;
  const allDataLoading = isLoading || wishlist.isLoading;
  const errors = [
    tasks.error,
    projects.error,
    goals.error,
    people.error,
    notes.error,
    journal.error,
    expenses.error,
    wishlist.error,
  ].filter(
    (message): message is string => message !== null,
  );
  const recentTasks = [...tasks.records]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);
  const recentNotes = [...notes.records]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 2);
  const todayKey = currentDate ? getLocalDateKey(currentDate) : null;
  const peopleReminders = todayKey
    ? getPersonReminders(people.records, todayKey)
    : null;
  const upcomingBirthdays = todayKey
    ? getUpcomingBirthdays(people.records, todayKey).slice(0, 2)
    : [];
  const todayEntry = todayKey
    ? journal.records.find((entry) => entry.date === todayKey)
    : undefined;
  const recentJournalEntry = [...journal.records].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      b.updatedAt.localeCompare(a.updatedAt),
  )[0];
  const projectNames = new Map(
    projects.records.map((project) => [project.id, project.name]),
  );
  const activeProjects = projects.records
    .filter((project) => project.status === "active")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 2);
  const activeGoalCount = goals.records.filter(
    (goal) => goal.status === "active",
  ).length;
  const dashboardGoals = goals.records
    .filter((goal) => goal.status === "active")
    .sort((a, b) => {
      if (a.targetDate && b.targetDate) {
        return (
          a.targetDate.localeCompare(b.targetDate) ||
          b.updatedAt.localeCompare(a.updatedAt)
        );
      }
      if (a.targetDate) return -1;
      if (b.targetDate) return 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    })
    .slice(0, 2);
  const openTaskCount = tasks.records.filter((task) => !task.completed).length;
  const completedTaskCount = tasks.records.length - openTaskCount;

  const currentMonthSummary = summarizeExpenses(
    currentDate
      ? filterExpensesByDateRange(
          expenses.records,
          getExpenseDateRange("month", currentDate),
        )
      : [],
  );
  const wishlistSummary = summarizeWishlist(wishlist.records);

  const activityDays = useMemo(
    () =>
      currentDate
        ? getActivityDays(
            [
              ...tasks.records,
              ...notes.records,
              ...expenses.records,
              ...journal.records,
            ],
            currentDate,
          )
        : [],
    [currentDate, tasks.records, notes.records, expenses.records, journal.records],
  );
  const activityTotal = activityDays.reduce((sum, day) => sum + day.count, 0);
  const chartLabel = activityDays
    .map(
      (day) =>
        `${formatLocalDate(day.date.toISOString())}: ${day.count} ${day.count === 1 ? "entry" : "entries"}`,
    )
    .join("; ");

  async function toggleTask(taskId: string, completed: boolean) {
    setOperationError("");
    try {
      await updateTask(taskId, { completed });
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "The task status could not be updated.",
      );
    }
  }

  return (
    <div className="dashboard">
      <section aria-labelledby="welcome-heading" className="welcome">
        <div className="eyebrow">
          <span className="eyebrow-line" />
          YOUR DAY
        </div>
        <h1 id="welcome-heading">
          A little more <span>intentional.</span>
        </h1>
        <p>A calm place to see what matters, and make room for it.</p>
      </section>

      {errors.map((message, index) => (
        <ErrorNotice
          key={`${message}-${index}`}
          message={message}
          onRetry={() => {
            tasks.reload();
            projects.reload();
            goals.reload();
            people.reload();
            notes.reload();
            journal.reload();
            expenses.reload();
            wishlist.reload();
          }}
        />
      ))}
      {operationError && <ErrorNotice message={operationError} />}

      {allDataLoading ? (
        <LoadingState label="Gathering what you have saved on this device..." />
      ) : (
        <>
          <section aria-label="Your overview" className="summary-grid">
            <SummaryMetric
              detail={`${openTaskCount} tasks are not marked complete.`}
              highlighted={openTaskCount > 0}
              label="Open tasks"
              note="need your attention"
              value={countLabel(openTaskCount)}
            />
            <SummaryMetric
              detail={`${completedTaskCount} ${completedTaskCount === 1 ? "task has" : "tasks have"} been completed across all records.`}
              label="Completed"
              note="across your space"
              value={countLabel(completedTaskCount)}
            />
            <SummaryMetric
              detail={`The total of ${currentMonthSummary.count} saved ${currentMonthSummary.count === 1 ? "expense" : "expenses"} from this calendar month.`}
              label="Spent this month"
              note={
                currentMonthSummary.count
                  ? `${currentMonthSummary.count} saved ${currentMonthSummary.count === 1 ? "expense" : "expenses"}`
                  : "no saved expenses"
              }
              value={formatCompactCurrency(
                currentMonthSummary.total,
                preferences.currency,
              )}
            />
          </section>

          <div className="dashboard-columns">
            <div className="dashboard-records">
              <section aria-labelledby="journal-heading">
                <SectionHeading
                  headingId="journal-heading"
                  kicker="Your day, in words"
                  meta={
                    <Link className="section-link" href="/journal">
                      Open journal
                    </Link>
                  }
                  title="Journal"
                />
                <div className="dashboard-journal">
                  {todayKey && (
                    <Link
                      className="dashboard-journal-row"
                      href={`/journal?date=${todayKey}`}
                    >
                      <span className="dashboard-journal-label">Today</span>
                      <span className="dashboard-journal-copy">
                        {todayEntry
                          ? todayEntry.title?.trim() ||
                            todayEntry.content.split(/\r?\n/, 1)[0]?.trim() ||
                            "Entry saved"
                          : "No entry yet"}
                      </span>
                      <span className="dashboard-journal-action">
                        {todayEntry ? "Read" : "Write"}
                      </span>
                    </Link>
                  )}
                  {recentJournalEntry &&
                    recentJournalEntry.id !== todayEntry?.id && (
                      <Link
                        className="dashboard-journal-row"
                        href={`/journal?date=${recentJournalEntry.date}`}
                      >
                        <span className="dashboard-journal-label">
                          Most recent
                        </span>
                        <span className="dashboard-journal-copy">
                          {recentJournalEntry.title?.trim() ||
                            recentJournalEntry.content
                              .split(/\r?\n/, 1)[0]
                              ?.trim() ||
                            "Journal entry"}
                        </span>
                        <span className="dashboard-journal-action">
                          {formatLocalDate(
                            `${recentJournalEntry.date}T12:00:00`,
                          )}
                        </span>
                      </Link>
                    )}
                  {!recentJournalEntry && (
                    <p className="dashboard-journal-empty">
                      Your daily entries stay private on this device.
                    </p>
                  )}
                </div>
              </section>

              <section aria-labelledby="recent-tasks-heading">
                <SectionHeading
                  headingId="recent-tasks-heading"
                  kicker="Your next steps"
                  meta={
                    <Link className="section-link" href="/tasks">
                      All tasks
                    </Link>
                  }
                  title="Recent tasks"
                />
                {recentTasks.length ? (
                  <ul className="today-list">
                    {recentTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        onToggle={(completed) =>
                          void toggleTask(task.id, completed)
                        }
                        projectName={
                          task.projectId
                            ? projectNames.get(task.projectId)
                            : undefined
                        }
                        task={task}
                      />
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    action={
                      <Link className="text-button" href="/tasks">
                        Add a task
                      </Link>
                    }
                    description="Tasks you save will appear here."
                    title="Nothing in motion yet."
                  />
                )}
              </section>

              <section aria-labelledby="active-projects-heading">
                <SectionHeading
                  headingId="active-projects-heading"
                  kicker="Longer arcs"
                  meta={
                    <Link className="section-link" href="/projects">
                      All projects
                    </Link>
                  }
                  title="Active projects"
                />
                {activeProjects.length ? (
                  <ul className="project-dashboard-list">
                    {activeProjects.map((project) => {
                      const progress = getProjectProgress(
                        project.id,
                        tasks.records,
                      );
                      return (
                        <li key={project.id}>
                          <Link
                            className="project-dashboard-item"
                            href="/projects"
                          >
                            <span className="project-dashboard-title">
                              {project.name}
                            </span>
                            <span className="project-dashboard-count">
                              {tasks.error
                                ? "Progress unavailable"
                                : `${progress.completedTasks} of ${progress.totalTasks} tasks`}
                            </span>
                            {!tasks.error && (
                              <span
                                aria-label={`${progress.percentage}% complete`}
                                className="project-progress-track"
                                role="progressbar"
                                aria-valuemax={100}
                                aria-valuemin={0}
                                aria-valuenow={progress.percentage}
                              >
                                <span
                                  style={{
                                    width: `${progress.percentage}%`,
                                  }}
                                />
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyState
                    action={
                      <Link className="text-button" href="/projects">
                        Create a project
                      </Link>
                    }
                    description="A small space to keep related work together."
                    title="No active projects yet."
                  />
                )}
              </section>

              <section aria-labelledby="active-goals-heading">
                <SectionHeading
                  headingId="active-goals-heading"
                  kicker="What matters next"
                  meta={
                    <Link className="section-link" href="/goals">
                      All goals
                    </Link>
                  }
                  title="Active goals"
                />
                {goals.error ? (
                  <p className="goal-dashboard-unavailable">
                    Goal progress is unavailable.
                  </p>
                ) : activeGoalCount ? (
                  <>
                    <p className="goal-dashboard-count">
                      {activeGoalCount} active{" "}
                      {activeGoalCount === 1 ? "goal" : "goals"}
                    </p>
                    <ul className="goal-dashboard-list">
                      {dashboardGoals.map((goal: GoalRecord) => {
                        const percentage = calculateGoalProgress(
                          goal.currentValue,
                          goal.targetValue,
                        );
                        return (
                          <li key={goal.id}>
                            <Link
                              className="goal-dashboard-item"
                              href="/goals"
                            >
                              <span className="goal-dashboard-title">
                                {goal.title}
                              </span>
                              <span className="goal-dashboard-progress-copy">
                                <span>
                                  {formatGoalValue(
                                    goal.currentValue,
                                    goal.unit,
                                  )}{" "}
                                  /{" "}
                                  {formatGoalValue(
                                    goal.targetValue,
                                    goal.unit,
                                  )}
                                </span>
                                <span>{percentage}%</span>
                              </span>
                              <span
                                aria-label={`${percentage}% complete`}
                                aria-valuemax={100}
                                aria-valuemin={0}
                                aria-valuenow={percentage}
                                className="goal-progress-track"
                                role="progressbar"
                              >
                                <span
                                  style={{ width: `${percentage}%` }}
                                />
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <EmptyState
                    action={
                      <Link className="text-button" href="/goals">
                        Set a goal
                      </Link>
                    }
                    description="A quiet place to keep your longer-term aims in view."
                    title="Nothing to track yet."
                  />
                )}
              </section>

              <section aria-labelledby="people-heading">
                <SectionHeading
                  headingId="people-heading"
                  kicker="Stay connected"
                  meta={
                    <Link className="section-link" href="/people">
                      All people
                    </Link>
                  }
                  title="People"
                />
                {people.error ? (
                  <p className="people-dashboard-unavailable">
                    People reminders are unavailable.
                  </p>
                ) : (
                  <div className="people-dashboard">
                    <p className="people-dashboard-reconnect">
                      {peopleReminders?.dueToReconnect.length
                        ? `${peopleReminders.dueToReconnect.length} ${
                            peopleReminders.dueToReconnect.length === 1
                              ? "person may"
                              : "people may"
                          } be due for a reconnect`
                        : "No reconnects are due"}
                    </p>
                    {peopleReminders?.dueToReconnect.slice(0, 2).map((person) => (
                      <Link
                        className="people-dashboard-row"
                        href="/people"
                        key={person.id}
                      >
                        <span>{person.name}</span>
                        <span>
                          Last talked{" "}
                          {person.lastContactedDate
                            ? formatLocalDate(
                                `${person.lastContactedDate}T12:00:00`,
                              )
                            : "date unavailable"}
                        </span>
                      </Link>
                    ))}
                    {upcomingBirthdays.length ? (
                      <div className="people-dashboard-birthdays">
                        {upcomingBirthdays.map(({ person, date, daysAway }) => (
                          <Link
                            className="people-dashboard-row"
                            href="/people"
                            key={`${person.id}-${date}`}
                          >
                            <span>{person.name}</span>
                            <span>
                              {daysAway === 0
                                ? "Birthday today"
                                : daysAway === 1
                                  ? "Birthday tomorrow"
                                  : `Birthday in ${daysAway} days`}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="people-dashboard-empty">
                        Add a birthday only if it helps you remember.
                      </p>
                    )}
                  </div>
                )}
              </section>

              <section aria-labelledby="wishlist-heading">
                <SectionHeading
                  headingId="wishlist-heading"
                  kicker="For another day"
                  meta={
                    <Link className="section-link" href="/wishlist">
                      Open Wishlist
                    </Link>
                  }
                  title="Wishlist"
                />
                {wishlist.error ? (
                  <p className="wishlist-dashboard-unavailable">
                    Wishlist summary is unavailable.
                  </p>
                ) : (
                  <Link className="wishlist-dashboard-summary" href="/wishlist">
                    <span>
                      {wishlistSummary.wantedCount}{" "}
                      {wishlistSummary.wantedCount === 1 ? "item" : "items"}{" "}
                      wanted
                    </span>
                    <strong>
                      {formatCompactCurrency(
                        wishlistSummary.estimatedTotal,
                        preferences.currency,
                      )}
                    </strong>
                    <span>estimated value</span>
                  </Link>
                )}
              </section>

              <section aria-labelledby="recent-notes-heading">
                <SectionHeading
                  headingId="recent-notes-heading"
                  kicker="Things to remember"
                  meta={
                    <Link className="section-link" href="/journal">
                      Journal
                    </Link>
                  }
                  title="Recent notes"
                />
                {recentNotes.length ? (
                  <ul className="recent-notes-list">
                    {recentNotes.map((note) => {
                      const title =
                        note.title?.trim() ||
                        note.content.split(/\r?\n/, 1)[0]?.trim() ||
                        "Untitled note";
                      const preview = note.content.trim().replace(/\s+/g, " ");
                      return (
                        <li className="recent-note-row" key={note.id}>
                          <Link className="recent-note-link" href="/journal">
                            <span>{title}</span>
                            <time dateTime={note.createdAt}>
                              {formatLocalDate(note.createdAt)}
                            </time>
                          </Link>
                          <p>
                            {preview.length > 120
                              ? `${preview.slice(0, 117)}…`
                              : preview}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyState
                    action={
                      <Link className="text-button" href="/journal">
                        Write a note
                      </Link>
                    }
                    description="Your saved notes will be gathered here."
                    title="Nothing to revisit yet."
                  />
                )}
              </section>
            </div>

            <ActivityOverview
              chartLabel={`Saved records by day over the last seven days: ${chartLabel}`}
              days={activityDays}
              total={activityTotal}
            />
          </div>

          <footer className="dashboard-footer">
            <span>Small steps count.</span>
            <span>Take it at your own pace.</span>
          </footer>
        </>
      )}
    </div>
  );
}
