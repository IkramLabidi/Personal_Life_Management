import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import Toaster from '../components/ui/Toaster.jsx';
import { NAV_ITEMS } from './navItems.js';

function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-charcoal/10 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-between px-2 py-1.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition ${
                isActive ? 'text-deep' : 'text-charcoal/45'
              }`
            }
          >
            <Icon size={18} />
            <span className="truncate">{label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function AppLayout() {
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen lg:pl-64">
      <Sidebar mobileOpen={mobileNav} onClose={() => setMobileNav(false)} />
      <Topbar onMenu={() => setMobileNav(true)} />
      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">
        <Outlet />
      </main>
      <MobileNav />
      <Toaster />
    </div>
  );
}
