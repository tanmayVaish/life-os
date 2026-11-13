import { DetailPanel } from "@/components/detail-panel";

type SummaryMetricProps = {
  label: string;
  value: string;
  note: string;
  detail: string;
  highlighted?: boolean;
};

export function SummaryMetric({
  label,
  value,
  note,
  detail,
  highlighted = false,
}: SummaryMetricProps) {
  return (
    <DetailPanel
      className="summary-item summary-disclosure"
      label={label}
      summary={
        <span className="summary-trigger-content">
          <span className="summary-label">{label}</span>
          <span className="summary-bottom">
            <span className="summary-value">{value}</span>
            <span className="summary-note">{note}</span>
            {highlighted && <span className="summary-indicator" />}
          </span>
        </span>
      }
    >
      <p>{detail}</p>
    </DetailPanel>
  );
}
