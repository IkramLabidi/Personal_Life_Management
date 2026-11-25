import { useState } from 'react';
import {
  Wallet,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Droplets,
  GraduationCap,
  Dumbbell,
  CalendarClock,
  Target,
  ListChecks,
  Plus,
  RefreshCw,
  CalendarHeart,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Card, CardHeader } from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import ProgressRing from '../components/ui/ProgressRing.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { ErrorBanner } from '../components/ui/FormControls.jsx';
import QuickAddModal from '../components/QuickAddModal.jsx';
import { currency, formatDateShort, relativeDays } from '../utils/format.js';
import { EVENT_COLORS } from '../utils/constants.js';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const QUICK = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'task', label: 'Task' },
  { value: 'study', label: 'Study' },
  { value: 'water', label: 'Water' },
  { value: 'event', label: 'Event' },
];

function PriorityDot({ priority }) {
  const color = priority === 'high' ? '#b0655f' : priority === 'medium' ? '#C2A878' : '#9BB2C9';
  return <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/dashboard');
  const [quick, setQuick] = useState(null);

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner label="Loading your dashboard…" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <ErrorBanner message={`Could not load your dashboard: ${error}`} />
        <button type="button" className="btn-primary" onClick={reload}>
          <RefreshCw size={15} /> Try again
        </button>
      </div>
    );
  }

  const cur = data.finance.currency || 'TND';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-deep sm:text-[28px]">
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-charcoal/60">Here is everything happening across your life today.</p>
        </div>
        <button type="button" className="btn-outline" onClick={reload}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button key={q.value} type="button" className="btn-outline btn-sm" onClick={() => setQuick(q.value)}>
            <Plus size={13} /> {q.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Bank balance" value={currency(data.finance.balance, cur)} />
        <StatCard icon={PiggyBank} label="Piggy bank" value={currency(data.finance.savingsBalance, cur)} />
        <StatCard icon={TrendingUp} label="Income this month" value={currency(data.finance.monthlyIncome, cur)} />
        <StatCard icon={TrendingDown} label="Expenses this month" value={currency(data.finance.monthlyExpense, cur)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            icon={ListChecks}
            title="Today's tasks & priorities"
            subtitle={`${data.tasks.weeklyDone}/${data.tasks.weeklyTotal} completed this week`}
            action={
              <Link to="/planner" className="btn-ghost btn-sm">
                Open planner
              </Link>
            }
          />
          {data.tasks.today.length === 0 ? (
            <EmptyState icon={ListChecks} title="No tasks for today" message="Add a task to plan your day." />
          ) : (
            <ul className="divide-soft">
              {data.tasks.today.map((t) => (
                <li key={t._id} className="flex items-start gap-3 py-2.5">
                  <PriorityDot priority={t.priority} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${t.completed ? 'text-charcoal/45 line-through' : 'text-charcoal'}`}>
                      {t.title}
                    </p>
                    <p className="text-[11px] text-charcoal/50">
                      {t.time || 'Anytime'} · {t.lifeRole} · {t.quadrant}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="grid gap-4">
          <Card className="flex flex-col items-center">
            <p className="label mb-2 self-start">Weekly completion</p>
            <ProgressRing value={data.tasks.weeklyPercent} color="#344B64">
              <span className="font-display text-xl text-deep">{data.tasks.weeklyPercent}%</span>
              <span className="text-[10px] text-charcoal/50">done</span>
            </ProgressRing>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={GraduationCap} label="Study (week)" value={`${data.study.weeklyHours}h`} />
            <StatCard
              icon={Dumbbell}
              label="Exercise (week)"
              value={`${data.exercise.done}/${data.exercise.total}`}
              hint={`${data.exercise.percent}% completed`}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader icon={CalendarClock} title="Upcoming deadlines" />
          {data.deadlines.length === 0 ? (
            <p className="py-4 text-center text-sm text-charcoal/50">No upcoming academic deadlines.</p>
          ) : (
            <ul className="space-y-3">
              {data.deadlines.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-charcoal">{d.title}</p>
                    <p className="text-[11px] text-charcoal/50">
                      {d.subject?.name ? `${d.subject.name} · ` : ''}
                      {d.type}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-deep">{relativeDays(d.deadline)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col items-center">
          <p className="label mb-2 self-start">Today's hydration</p>
          <ProgressRing value={data.water.percent} color="#7FA6C8">
            <span className="font-display text-xl text-deep">{data.water.percent}%</span>
            <span className="text-[10px] text-charcoal/50">of goal</span>
          </ProgressRing>
          <p className="mt-3 text-sm text-charcoal/65">
            {data.water.consumed} ml of {data.water.goal} ml
          </p>
          <button type="button" className="btn-outline btn-sm mt-3" onClick={() => setQuick('water')}>
            <Droplets size={13} /> Log water
          </button>
        </Card>

        <Card>
          <CardHeader icon={CalendarHeart} title="Upcoming events" />
          {data.events.length === 0 ? (
            <p className="py-4 text-center text-sm text-charcoal/50">Your calendar is clear.</p>
          ) : (
            <ul className="space-y-3">
              {data.events.map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: EVENT_COLORS[e.category] || '#8C93A0' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-charcoal">{e.title}</p>
                    <p className="text-[11px] text-charcoal/50">
                      {formatDateShort(e.date)} {e.startTime ? `· ${e.startTime}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            icon={Target}
            title="Monthly goals progress"
            subtitle={`${data.goals.monthlyCount} goal(s) · ${data.goals.averageProgress}% average`}
            action={
              <Link to="/goals" className="btn-ghost btn-sm">
                Manage goals
              </Link>
            }
          />
          {data.goals.active.length === 0 ? (
            <p className="py-4 text-center text-sm text-charcoal/50">No active goals yet.</p>
          ) : (
            <ul className="space-y-3.5">
              {data.goals.active.map((g) => (
                <li key={g.id}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-charcoal">{g.title}</span>
                    <span className="shrink-0 text-xs font-semibold text-deep">{g.progress}%</span>
                  </div>
                  <ProgressBar value={g.progress} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {data.cycle?.enabled ? (
          <Card>
            <CardHeader icon={CalendarHeart} title="Cycle phase" subtitle="Approximate estimate only" />
            <p className="font-display text-xl text-deep capitalize">{data.cycle.phase}</p>
            <p className="mt-1 text-sm text-charcoal/60">
              Day {data.cycle.cycleDay} · next period {relativeDays(data.cycle.nextPeriodDate)}
            </p>
            {data.cycle.energy && (
              <p className="mt-3 rounded-xl bg-pale/50 px-3 py-2 text-xs text-charcoal/70">
                Energy: <span className="font-semibold capitalize">{data.cycle.energy.level}</span>.{' '}
                {data.cycle.energy.message}
              </p>
            )}
            <Link to="/planner" className="btn-ghost btn-sm mt-3">
              Open planner
            </Link>
          </Card>
        ) : (
          <Card>
            <CardHeader icon={CalendarHeart} title="Cycle tracking" subtitle="Private & optional" />
            <p className="text-sm text-charcoal/60">
              Enable cycle tracking in the weekly planner to see energy-aware suggestions. It stays private to you.
            </p>
            <Link to="/planner" className="btn-outline btn-sm mt-3">
              Set up in planner
            </Link>
          </Card>
        )}
      </div>

      <QuickAddModal
        open={Boolean(quick)}
        initialAction={quick || 'expense'}
        onClose={() => setQuick(null)}
        onSaved={reload}
      />
    </div>
  );
}
