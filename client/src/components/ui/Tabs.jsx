export default function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-soft ring-1 ring-black/[0.04] ${className}`}>
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
            active === t.value ? 'bg-deep text-white shadow-soft' : 'text-charcoal/65 hover:bg-pale/60'
          }`}
        >
          {t.icon && <t.icon size={15} />}
          {t.label}
        </button>
      ))}
    </div>
  );
}
