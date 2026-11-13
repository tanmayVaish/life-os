import { SectionHeading } from "@/components/section-heading";

type ActivityDay = {
  day: string;
  height: string;
};

type ActivityOverviewProps = {
  total: string;
  change: string;
  days: ActivityDay[];
};

export function ActivityOverview({
  total,
  change,
  days,
}: ActivityOverviewProps) {
  return (
    <section aria-labelledby="activity-heading" className="activity-section">
      <SectionHeading
        headingId="activity-heading"
        kicker="Your rhythm"
        meta="THIS WEEK"
        metaClassName="activity-period"
        title="Activity"
      />

      <div className="activity-total">
        <span className="activity-value">{total}</span>
        <span className="activity-unit">hours in focus</span>
      </div>

      <div
        aria-label="Focus time by day this week"
        className="activity-chart"
        role="img"
      >
        {days.map((item, index) => (
          <div className="activity-day" key={`${item.day}-${index}`}>
            <div className="activity-track">
              <div className="activity-bar" style={{ height: item.height }} />
            </div>
            <span>{item.day}</span>
          </div>
        ))}
      </div>

      <div className="activity-footer">
        <span className="activity-footnote">
          <span className="status-dot" />
          A steady week so far
        </span>
        <span className="activity-change">
          {change} <span>vs. last week</span>
        </span>
      </div>
      <details className="activity-detail">
        <summary>About this overview</summary>
        <p>Focus time is a simple weekly snapshot of time set aside for deep work.</p>
      </details>
    </section>
  );
}
