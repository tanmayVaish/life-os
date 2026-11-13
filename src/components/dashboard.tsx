import { ActivityOverview } from "@/components/activity-overview";
import { Icon } from "@/components/icon";
import { SectionHeading } from "@/components/section-heading";
import { SummaryMetric } from "@/components/summary-metric";
import { TaskRow } from "@/components/task-row";

const summaryItems = [
  {
    label: "Open loops",
    value: "08",
    note: "across your space",
    detail: "A few things are still open. Take a look when you have room.",
    highlighted: true,
  },
  {
    label: "In motion",
    value: "03",
    note: "things moving forward",
    detail: "Three priorities have had some attention this week.",
  },
  {
    label: "Room to focus",
    value: "2.5h",
    note: "set aside today",
    detail: "Protected focus time on your calendar today.",
  },
];

const todayItems = [
  {
    time: "09:30",
    title: "Plan the week with a clear head",
    checked: true,
    detail: "A few minutes to choose what deserves your attention this week.",
  },
  {
    time: "11:00",
    title: "Share the first draft with Maya",
    checked: false,
    detail: "Send the current draft and ask for one round of feedback.",
  },
  {
    time: "15:30",
    title: "Take a walk, no phone",
    checked: false,
    detail: "A short reset between work and the rest of the day.",
  },
];

const activityDays = [
  { day: "M", height: "36%" },
  { day: "T", height: "62%" },
  { day: "W", height: "46%" },
  { day: "T", height: "82%" },
  { day: "F", height: "58%" },
  { day: "S", height: "24%" },
  { day: "S", height: "14%" },
];

export function Dashboard() {
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

      <section aria-label="Your overview" className="summary-grid">
        {summaryItems.map((item) => (
          <SummaryMetric key={item.label} {...item} />
        ))}
      </section>

      <div className="dashboard-columns">
        <section aria-labelledby="today-heading" className="today-section">
          <SectionHeading
            headingId="today-heading"
            kicker="A gentle plan"
            meta="3 moments"
            title="Today"
          />

          <ul className="today-list">
            {todayItems.map((item) => (
              <TaskRow key={item.title} {...item} />
            ))}
          </ul>

          <div className="today-footer">
            <Icon name="calendar" />
            <span>Leave a little space between things.</span>
          </div>
        </section>

        <ActivityOverview change="+12%" days={activityDays} total="6.4" />
      </div>

      <footer className="dashboard-footer">
        <span>Small steps count.</span>
        <span>Take it at your own pace.</span>
      </footer>
    </div>
  );
}
