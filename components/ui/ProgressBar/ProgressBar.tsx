// TODO: Implement ProgressBar component
export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}
