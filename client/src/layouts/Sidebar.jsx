import { NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { NAV_ITEMS } from './navItems.js';

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2 py-1">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-deep font-display text-lg text-white">
        L
      </span>
      <div className="leading-tight">
        <p className="font-display text-lg text-deep">LifeOS</p>
        <p className="text-[11px] text-charcoal/50">Personal Life Dashboard</p>
      </div>
    </div>
  );
}

function NavList({ onNavigate }) {
  return (
    <nav className="mt-6 flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-deep text-white shadow-soft'
                : 'text-charcoal/70 hover:bg-pale/60 hover:text-deep'
            }`
          }
        >
          <Icon size={17} className="shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function UserFooter() {
  const { user, logout } = useAuth();
  return (
    <div className="mt-4 rounded-xl border border-charcoal/10 bg-ivory/60 p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-dusty/40 font-display text-sm text-deep">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-deep">{user?.name}</p>
          <p className="truncate text-[11px] text-charcoal/50">{user?.email}</p>
        </div>
        <button type="button" className="icon-btn" onClick={logout} title="Log out" aria-label="Log out">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-charcoal/10 bg-white/80 px-3 py-5 backdrop-blur lg:flex">
        <Brand />
        <NavList />
        <UserFooter />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-deep/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative z-10 flex h-full w-72 max-w-[80%] flex-col bg-white px-3 py-5 shadow-card animate-fade-in">
            <div className="flex items-center justify-between">
              <Brand />
              <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <NavList onNavigate={onClose} />
            <UserFooter />
          </div>
        </div>
      )}
    </>
  );
}
