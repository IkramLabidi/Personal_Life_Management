export default function StatCard({ icon: Icon, label, value, hint, accent = 'bg-pale/70 text-deep', className = '' }) {
  return (
    <div className={`card card-flat ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-charcoal/50">
          {label}
        </span>
        {Icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
            <Icon size={15} />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-[26px] leading-none text-deep">{value}</p>
      {hint && <p className="mt-2 text-xs text-charcoal/55">{hint}</p>}
    </div>
  );
}
