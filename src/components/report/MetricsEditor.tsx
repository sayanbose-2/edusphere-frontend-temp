import { BsPlus, BsDashCircle } from "react-icons/bs";

interface TMetricRow {
  key: string;
  value: string;
}

interface Props {
  rows: TMetricRow[];
  onChange: (rows: TMetricRow[]) => void;
}

export const MetricsEditor = ({ rows, onChange }: Props) => {
  const updRow = (i: number, field: keyof TMetricRow, v: string) =>
    onChange(rows.map((x, idx) => (idx === i ? { ...x, [field]: v } : x)));

  return (
    <div className="border border-border rounded-lg p-4 mb-4 bg-bg">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold">Metrics</span>
        <span className="text-xs text-secondary">
          {rows.filter((r) => r.key.trim()).length} entries
        </span>
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_1fr_32px] gap-2 mb-2 items-center"
        >
          <input
            className="form-control"
            placeholder="Metric name"
            value={row.key}
            onChange={(e) => updRow(i, "key", e.target.value)}
          />
          <input
            className="form-control"
            placeholder="Value"
            value={row.value}
            onChange={(e) => updRow(i, "value", e.target.value)}
          />
          <button
            className="icon-btn icon-btn-danger"
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            disabled={rows.length === 1}
          >
            <BsDashCircle size={13} />
          </button>
        </div>
      ))}
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onChange([...rows, { key: "", value: "" }])}
      >
        <BsPlus className="me-1" />
        Add Metric
      </button>
    </div>
  );
};
