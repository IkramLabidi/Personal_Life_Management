import {
  LayoutDashboard,
  Wallet,
  CalendarRange,
  HeartPulse,
  GraduationCap,
  CalendarDays,
  Target,
  NotebookPen,
} from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/finance', label: 'Finance', icon: Wallet },
  { to: '/planner', label: 'Weekly Planner', icon: CalendarRange },
  { to: '/health', label: 'Health & Fitness', icon: HeartPulse },
  { to: '/study', label: 'Study', icon: GraduationCap },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/journal', label: 'Journal', icon: NotebookPen },
];
