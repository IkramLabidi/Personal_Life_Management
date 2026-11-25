export default function ProgressBar({ value = 0, color = '#344B64', className = '', height = 'h-2' }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full overflow-hidden rounded-full bg-charcoal/[0.08] ${height} ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
