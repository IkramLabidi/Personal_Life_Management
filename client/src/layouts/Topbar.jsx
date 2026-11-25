import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import { NAV_ITEMS } from './navItems.js';
import QuickAddModal from '../components/QuickAddModal.jsx';

const titleFor = (pathname) => {
  const match = NAV_ITEMS.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));
  return match?.label || 'LifeOS';
};

export default function Topbar({ onMenu }) {
  const { pathname } = useLocation();
  const [quickOpen, setQuickOpen] = useState(false);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <header className="sticky top-0 z-20 border-b border-charcoal/10 bg-ivory/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" className="icon-btn lg:hidden" onClick={onMenu} aria-label="Open navigation">
          <Menu size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg text-deep">{titleFor(pathname)}</p>
          <p className="hidden text-[11px] text-charcoal/50 sm:block">{today}</p>
        </div>

        <button type="button" className="btn-primary btn-sm" onClick={() => setQuickOpen(true)}>
          <Plus size={14} />
          <span className="hidden sm:inline">Quick add</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      <QuickAddModal open={quickOpen} onClose={() => setQuickOpen(false)} />
    </header>
  );
}
