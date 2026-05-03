type Props = {
  value: number;        // 0-100
  className?: string;
  tone?: "default" | "success";
};

export default function ProgressBar({ value, className = "", tone = "default" }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const fill = tone === "success" || pct === 100 ? "bg-emerald-500" : "bg-mocha-700";
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-cream-200 ${className}`}>
      <div className={`h-full rounded-full transition-all ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
