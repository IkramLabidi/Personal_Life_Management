export default function EmptyState({ icon: Icon, title, message, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-charcoal/15 bg-white/50 px-6 py-10 text-center ${className}`}>
      {Icon && (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-pale/60 text-deep">
          <Icon size={22} />
        </span>
      )}
      <p className="font-display text-lg text-deep">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-charcoal/55">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
