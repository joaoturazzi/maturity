// TODO: Implement StatCard component
export function StatCard({ label, value, sublabel }: { label: string; value: string | number; sublabel?: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      {sublabel && <span>{sublabel}</span>}
    </div>
  );
}
