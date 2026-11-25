import { AlertCircle } from 'lucide-react';

export function Field({ label, children, hint, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-[11px] text-charcoal/50">{hint}</span>}
    </label>
  );
}

export function TextInput(props) {
  return <input {...props} className={`input ${props.className || ''}`} />;
}

export function TextArea(props) {
  return <textarea {...props} className={`textarea ${props.className || ''}`} />;
}

export function Select({ options, children, ...props }) {
  return (
    <select {...props} className={`select ${props.className || ''}`}>
      {children ||
        options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
    </select>
  );
}

export function ErrorBanner({ message, className = '' }) {
  if (!message) return null;
  return (
    <div className={`flex items-start gap-2 rounded-xl border border-[#b0655f]/30 bg-[#b0655f]/8 px-3.5 py-3 text-sm text-[#9d5650] ${className}`}>
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
