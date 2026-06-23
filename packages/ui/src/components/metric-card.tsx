import { Card } from "./card";

type MetricCardProps = {
  label: string;
  value: string;
  supportingLabel: string;
  supportingValue: string;
  valueTone?: "default" | "profit" | "loss";
};

export function MetricCard({
  label,
  value,
  supportingLabel,
  supportingValue,
  valueTone = "default",
}: MetricCardProps) {
  return (
    <Card className="qf-metric-card">
      <p className="qf-eyebrow">{label}</p>
      <strong className={`qf-metric qf-metric--${valueTone}`}>{value}</strong>
      <div className="qf-metric-support">
        <span>{supportingLabel}</span>
        <strong>{supportingValue}</strong>
      </div>
    </Card>
  );
}
