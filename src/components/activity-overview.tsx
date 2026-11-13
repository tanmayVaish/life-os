import { SectionHeading } from "@/components/section-heading";

type ActivityDay = {
  day: string;
  height: string;
};

type ActivityOverviewProps = {
  total: number;
  days: ActivityDay[];
  chartLabel: string;
};

export function ActivityOverview({
  total,
  days,
  chartLabel,
}: ActivityOverviewProps) {
  return (
    <section aria-labelledby="activity-heading" className="activity-section">
      <SectionHeading
        headingId="activity-heading"
        kicker="Your rhythm"
        meta="LAST 7 DAYS"
        metaClassName="activity-period"
        title="Activity"
      />

      <div className="activity-total">
        <span className="activity-value">{total}</span>
        <span className="activity-unit">saved entries in 7 days</span>
      </div>

      <div
        aria-label={chartLabel}
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
          {total === 0 ? "A fresh start" : "Based on saved records"}
        </span>
      </div>
      <details className="activity-detail">
        <summary>About this overview</summary>
        <p>Each mark represents a task, note or expense created on that day.</p>
      </details>
    </section>
  );
}
