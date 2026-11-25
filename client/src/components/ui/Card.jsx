export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ icon: Icon, title, subtitle, action, className = '' }) {
  return (
    <div className={`mb-4 flex items-start justify-between gap-3 ${className}`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pale/70 text-deep">
            <Icon size={17} />
          </span>
        )}
        <div>
          <h3 className="text-base font-semibold leading-tight">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-charcoal/55">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export default Card;
