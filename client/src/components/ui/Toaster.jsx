import { CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';

const styles = {
  success: { ring: 'border-[#7FA88A]/40', icon: 'text-[#5f8a6b]', Icon: CheckCircle2 },
  error: { ring: 'border-[#b0655f]/40', icon: 'text-[#b0655f]', Icon: XCircle },
  info: { ring: 'border-dusty/50', icon: 'text-deep', Icon: Info },
};

export default function Toaster() {
  const { toasts, remove } = useToast();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
      {toasts.map((t) => {
        const s = styles[t.type] || styles.info;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-card animate-fade-up ${s.ring}`}
          >
            <s.Icon size={18} className={`mt-0.5 shrink-0 ${s.icon}`} />
            <p className="flex-1 text-sm text-charcoal">{t.message}</p>
            <button type="button" className="icon-btn h-6 w-6" onClick={() => remove(t.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
