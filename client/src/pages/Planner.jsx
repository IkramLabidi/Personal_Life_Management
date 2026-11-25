import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Target,
  NotebookPen,
  CalendarHeart,
  Info,
  RefreshCw,
} from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { useCollection } from '../hooks/useCollection.js';
import { useToast } from '../contexts/ToastContext.jsx';
import api, { apiErrorMessage } from '../services/api';
import { Card, CardHeader } from '../components/ui/Card.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Field, TextInput, TextArea, Select, ErrorBanner } from '../components/ui/FormControls.jsx';
import { LIFE_ROLES, QUADRANTS } from '../utils/constants.js';
import { formatDate, toInputDate } from '../utils/format.js';
import { startOfWeek, addDays, iso, DAY_NAMES } from '../utils/dates.js';

const TABS = [
  { value: 'week', label: 'Week', icon: CalendarRange },
  { value: 'goals', label: 'Weekly goals', icon: Target },
  { value: 'review', label: 'Review', icon: NotebookPen },
  { value: 'cycle', label: 'Cycle', icon: CalendarHeart },
];

const PHASE_META = {
  menstrual: { color: '#B98A8A', label: 'Menstrual' },
  follicular: { color: '#9BB2C9', label: 'Follicular' },
  ovulatory: { color: '#7FA88A', label: 'Ovulatory' },
  luteal: { color: '#C2A878', label: 'Luteal' },
};

const phaseFor = (day, cycleLength, periodDuration) => {
  const ovulationDay = cycleLength - 14;
  if (day <= periodDuration) return 'menstrual';
  if (day < ovulationDay - 1) return 'follicular';
  if (day <= ovulationDay + 1) return 'ovulatory';
  return 'luteal';
};

const emptyTask = (date) => ({
  _id: null,
  title: '',
  description: '',
  date: date || toInputDate(),
  time: '',
  priority: 'medium',
  status: 'todo',
  lifeRole: 'Other',
  quadrant: 'Q2',
  completed: false,
});

const quadrantBadge = (q) => (q === 'Q1' ? 'red' : q === 'Q2' ? 'blue' : q === 'Q3' ? 'amber' : 'gray');

export default function Planner() {
  const toast = useToast();
  const [tab, setTab] = useState('week');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const weekISO = iso(weekStart);

  const from = iso(weekStart);
  const to = iso(addDays(weekStart, 6));
  const taskParams = useMemo(() => ({ from, to }), [from, to]);
  const tasks = useCollection('/planner/tasks', taskParams);
  const goals = useCollection('/planner/goals', useMemo(() => ({ week: weekISO }), [weekISO]));
  const review = useFetch('/planner/review', useMemo(() => ({ week: weekISO }), [weekISO]));

  const [taskForm, setTaskForm] = useState(null);
  const [goalText, setGoalText] = useState('');
  const [reviewForm, setReviewForm] = useState({ priorities: '', review: '' });
  const [savingReview, setSavingReview] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (review.data) setReviewForm({ priorities: review.data.priorities || '', review: review.data.review || '' });
  }, [review.data]);

  const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

  const saveTask = async (e) => {
    e.preventDefault();
    const f = taskForm;
    if (!f.title.trim()) return toast.error('Task title is required');
    setBusy(true);
    try {
      const payload = {
        title: f.title,
        description: f.description,
        date: f.date,
        time: f.time,
        priority: f.priority,
        status: f.status,
        lifeRole: f.lifeRole,
        quadrant: f.quadrant,
        completed: f.completed,
      };
      if (f._id) await tasks.update(f._id, payload);
      else await tasks.create(payload);
      toast.success('Task saved');
      setTaskForm(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleTask = async (t) => {
    const completed = !(t.completed || t.status === 'done');
    try {
      await tasks.update(t._id, { completed, status: completed ? 'done' : 'todo' });
      toast.success(completed ? 'Task completed' : 'Task reopened');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const moveTask = async (t, date) => {
    try {
      await tasks.update(t._id, { date });
      toast.success(`Moved to ${formatDate(date)}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const addGoal = async (e) => {
    e.preventDefault();
    if (!goalText.trim()) return;
    try {
      await goals.create({ title: goalText, week: weekISO });
      setGoalText('');
      toast.success('Weekly goal added');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const toggleGoal = async (g) => {
    try {
      await goals.update(g._id, { done: !g.done });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const saveReview = async () => {
    setSavingReview(true);
    try {
      await api.put('/planner/review', { week: weekISO, ...reviewForm });
      toast.success('Weekly review saved');
      review.reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSavingReview(false);
    }
  };

  const runConfirm = async () => {
    try {
      if (confirm.kind === 'task') await tasks.remove(confirm.id);
      else if (confirm.kind === 'goal') await goals.remove(confirm.id);
      else if (confirm.kind === 'period') {
        await api.delete(`/planner/cycle/periods/${confirm.id}`);
        cycle.reload();
      }
      toast.success('Deleted');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const cycle = useFetch('/planner/cycle');
  const [cycleForm, setCycleForm] = useState(null);
  const [periodDate, setPeriodDate] = useState(toInputDate());
  const [cycleBusy, setCycleBusy] = useState(false);

  useEffect(() => {
    if (cycle.data?.profile) {
      setCycleForm({
        enabled: cycle.data.profile.enabled,
        cycleLength: cycle.data.profile.cycleLength,
        periodDuration: cycle.data.profile.periodDuration,
        overridePhase: cycle.data.profile.overridePhase || 'auto',
        notes: cycle.data.profile.notes || '',
      });
    }
  }, [cycle.data]);

  const saveCycle = async (e) => {
    e?.preventDefault();
    setCycleBusy(true);
    try {
      await api.put('/planner/cycle', cycleForm);
      toast.success('Cycle settings saved');
      cycle.reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setCycleBusy(false);
    }
  };

  const addPeriod = async () => {
    try {
      await api.post('/planner/cycle/periods', { startDate: periodDate });
      toast.success('Period recorded');
      cycle.reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const weekLabel = `${formatDate(weekStart)} – ${formatDate(addDays(weekStart, 6))}`;
  const doneCount = tasks.items.filter((t) => t.completed || t.status === 'done').length;

  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const calCells = useMemo(() => {
    if (!cycle.data?.view?.hasData) return [];
    const view = cycle.data.view;
    const first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
    const startPad = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -startPad);
    return Array.from({ length: 42 }).map((_, i) => {
      const day = addDays(gridStart, i);
      const periods = cycle.data.view.periods.map((p) => new Date(p.startDate)).sort((a, b) => a - b);
      let cycleStart = null;
      periods.forEach((s) => {
        if (s <= day) cycleStart = s;
      });
      if (!cycleStart) cycleStart = periods[periods.length - 1];
      const dayIndex = Math.floor((day - cycleStart) / 86400000) + 1;
      const normalized = ((dayIndex - 1) % view.cycleLength) + 1;
      const phase = dayIndex < 1 ? null : phaseFor(normalized, view.cycleLength, view.periodDuration);
      const isPeriod = phase === 'menstrual';
      return { date: day, inMonth: day.getMonth() === calMonth.getMonth(), phase, isPeriod };
    });
  }, [calMonth, cycle.data]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-deep sm:text-[28px]">Weekly Planner</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            Built on Covey&apos;s 7 Habits — organise by quadrant and life role, and adapt to your energy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="icon-btn" onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label="Previous week">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="btn-outline btn-sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            This week
          </button>
          <button type="button" className="icon-btn" onClick={() => setWeekStart((w) => addDays(w, 7))} aria-label="Next week">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        <span className="text-sm text-charcoal/55">{weekLabel}</span>
      </div>

      {tab === 'week' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-charcoal/60">
              {doneCount}/{tasks.items.length} tasks done this week
            </p>
            <button type="button" className="btn-primary btn-sm" onClick={() => setTaskForm(emptyTask(toInputDate()))}>
              <Plus size={13} /> Add task
            </button>
          </div>

          {tasks.loading && tasks.items.length === 0 ? (
            <Spinner label="Loading your week…" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
              {days.map((day, idx) => {
                const dayISO = iso(day);
                const dayTasks = tasks.items.filter((t) => iso(t.date) === dayISO);
                const isToday = dayISO === toInputDate();
                return (
                  <div
                    key={dayISO}
                    className={`rounded-2xl border p-3 ${
                      isToday ? 'border-dusty bg-pale/25' : 'border-black/[0.06] bg-white'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">{DAY_NAMES[idx]}</p>
                        <p className="font-display text-lg text-deep">{day.getDate()}</p>
                      </div>
                      <button
                        type="button"
                        className="icon-btn h-7 w-7"
                        onClick={() => setTaskForm(emptyTask(dayISO))}
                        aria-label={`Add task on ${DAY_NAMES[idx]}`}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {dayTasks.length === 0 && <p className="py-2 text-[11px] text-charcoal/35">No tasks</p>}
                      {dayTasks.map((t) => {
                        const done = t.completed || t.status === 'done';
                        return (
                          <div
                            key={t._id}
                            className={`rounded-xl border border-black/[0.06] bg-white p-2.5 ${done ? 'opacity-60' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={() => toggleTask(t)}
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                  done ? 'border-deep bg-deep text-white' : 'border-charcoal/30'
                                }`}
                                aria-label="Toggle complete"
                              >
                                {done && <Check size={11} />}
                              </button>
                              <div className="min-w-0 flex-1">
                                <p className={`text-[13px] leading-snug ${done ? 'text-charcoal/50 line-through' : 'text-charcoal'}`}>
                                  {t.title}
                                </p>
                                {t.time && <p className="text-[10px] text-charcoal/50">{t.time}</p>}
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  <Badge variant={quadrantBadge(t.quadrant)}>{t.quadrant}</Badge>
                                  <Badge variant="gray">{t.lifeRole}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-1">
                              <input
                                type="date"
                                value={iso(t.date)}
                                onChange={(e) => moveTask(t, e.target.value)}
                                className="w-full rounded-md border border-charcoal/12 bg-pale/30 px-1.5 py-1 text-[10px] text-charcoal/70"
                                aria-label="Move task"
                              />
                              <button type="button" className="icon-btn h-6 w-6" onClick={() => setTaskForm({ ...t, date: iso(t.date) })} aria-label="Edit">
                                <Pencil size={12} />
                              </button>
                              <button type="button" className="icon-btn h-6 w-6" onClick={() => setConfirm({ kind: 'task', id: t._id })} aria-label="Delete">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Card>
            <CardHeader icon={CalendarRange} title="Covey quadrants" subtitle="A quick reminder of what belongs where" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {QUADRANTS.map((q) => (
                <div key={q.value} className="rounded-xl border border-black/[0.06] bg-white p-3">
                  <Badge variant={quadrantBadge(q.value)}>{q.label}</Badge>
                  <p className="mt-2 text-xs text-charcoal/60">{q.hint}</p>
                  <p className="mt-1 text-[11px] text-charcoal/40">
                    {tasks.items.filter((t) => t.quadrant === q.value).length} task(s) this week
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'goals' && (
        <Card>
          <CardHeader icon={Target} title="Weekly goals" subtitle={weekLabel} />
          <form onSubmit={addGoal} className="mb-4 flex gap-2">
            <TextInput value={goalText} onChange={(e) => setGoalText(e.target.value)} placeholder="Add a goal for this week" />
            <button type="submit" className="btn-primary">
              <Plus size={15} /> Add
            </button>
          </form>
          {goals.loading && goals.items.length === 0 ? (
            <Spinner />
          ) : goals.items.length === 0 ? (
            <EmptyState icon={Target} title="No weekly goals" message="Set 3–5 outcomes you want to achieve this week." />
          ) : (
            <ul className="divide-soft">
              {goals.items.map((g) => (
                <li key={g._id} className="flex items-center gap-3 py-3">
                  <button
                    type="button"
                    onClick={() => toggleGoal(g)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      g.done ? 'border-deep bg-deep text-white' : 'border-charcoal/30'
                    }`}
                    aria-label="Toggle goal"
                  >
                    {g.done && <Check size={13} />}
                  </button>
                  <span className={`flex-1 text-sm ${g.done ? 'text-charcoal/50 line-through' : 'text-charcoal'}`}>{g.title}</span>
                  <button type="button" className="icon-btn h-8 w-8" onClick={() => setConfirm({ kind: 'goal', id: g._id })} aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'review' && (
        <Card>
          <CardHeader icon={NotebookPen} title="Weekly review" subtitle={weekLabel} />
          {review.loading && !review.data ? (
            <Spinner />
          ) : (
            <div className="space-y-4">
              <Field label="Priorities — the most important things this week">
                <TextArea
                  value={reviewForm.priorities}
                  onChange={(e) => setReviewForm((f) => ({ ...f, priorities: e.target.value }))}
                  placeholder="What mattered most this week?"
                />
              </Field>
              <Field label="Review — what went well, what to improve">
                <TextArea
                  value={reviewForm.review}
                  onChange={(e) => setReviewForm((f) => ({ ...f, review: e.target.value }))}
                  placeholder="Reflect honestly. Sharpen the saw."
                />
              </Field>
              <div className="flex justify-end">
                <button type="button" className="btn-primary" onClick={saveReview} disabled={savingReview}>
                  {savingReview ? 'Saving…' : 'Save review'}
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === 'cycle' && (
        <div className="space-y-5">
          {cycle.loading && !cycle.data ? (
            <Spinner label="Loading cycle settings…" />
          ) : (
            <>
              <Card>
                <CardHeader
                  icon={CalendarHeart}
                  title="Menstrual cycle tracking"
                  subtitle="Private to your account · approximate estimates only"
                />
                {cycleForm && (
                  <form onSubmit={saveCycle} className="space-y-4">
                    <label className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-pale/20 px-3.5 py-3">
                      <input
                        type="checkbox"
                        checked={cycleForm.enabled}
                        onChange={(e) => setCycleForm((f) => ({ ...f, enabled: e.target.checked }))}
                        className="h-4 w-4 accent-[#344B64]"
                      />
                      <span className="text-sm text-charcoal">Enable cycle tracking &amp; energy suggestions</span>
                    </label>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Average cycle length (days)">
                        <TextInput type="number" min="15" max="60" value={cycleForm.cycleLength} onChange={(e) => setCycleForm((f) => ({ ...f, cycleLength: e.target.value }))} />
                      </Field>
                      <Field label="Period duration (days)">
                        <TextInput type="number" min="1" max="14" value={cycleForm.periodDuration} onChange={(e) => setCycleForm((f) => ({ ...f, periodDuration: e.target.value }))} />
                      </Field>
                      <Field label="Current phase" hint="Manual correction">
                        <Select
                          value={cycleForm.overridePhase}
                          onChange={(e) => setCycleForm((f) => ({ ...f, overridePhase: e.target.value }))}
                          options={[
                            { value: 'auto', label: 'Automatic' },
                            { value: 'menstrual', label: 'Menstrual' },
                            { value: 'follicular', label: 'Follicular' },
                            { value: 'ovulatory', label: 'Ovulatory' },
                            { value: 'luteal', label: 'Luteal' },
                          ]}
                        />
                      </Field>
                    </div>

                    <Field label="Notes">
                      <TextArea value={cycleForm.notes} onChange={(e) => setCycleForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Anything you want to remember (private)." />
                    </Field>

                    <div className="flex justify-end">
                      <button type="submit" className="btn-primary" disabled={cycleBusy}>
                        {cycleBusy ? 'Saving…' : 'Save settings'}
                      </button>
                    </div>
                  </form>
                )}
              </Card>

              {cycle.data?.view?.hasData && (
                <Card>
                  <CardHeader icon={CalendarHeart} title="Right now" subtitle="Approximate — never a medical fact" />
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="rounded-xl bg-pale/40 p-3">
                      <p className="label">Phase</p>
                      <p className="font-display text-lg capitalize text-deep">{cycle.data.view.phase}</p>
                    </div>
                    <div className="rounded-xl bg-pale/40 p-3">
                      <p className="label">Cycle day</p>
                      <p className="font-display text-lg text-deep">{cycle.data.view.cycleDay}</p>
                    </div>
                    <div className="rounded-xl bg-pale/40 p-3">
                      <p className="label">Next period</p>
                      <p className="font-display text-lg text-deep">{formatDate(cycle.data.view.nextPeriodDate)}</p>
                    </div>
                    <div className="rounded-xl bg-pale/40 p-3">
                      <p className="label">Days away</p>
                      <p className="font-display text-lg text-deep">{cycle.data.view.daysUntilNextPeriod}</p>
                    </div>
                  </div>
                  {cycle.data.view.energy && (
                    <p className="mt-4 rounded-xl bg-pale/50 px-3.5 py-3 text-sm text-charcoal/70">
                      <span className="font-semibold capitalize">{cycle.data.view.energy.level} energy.</span>{' '}
                      {cycle.data.view.energy.message}
                    </p>
                  )}
                  <p className="mt-3 flex items-start gap-2 text-[11px] text-charcoal/50">
                    <Info size={13} className="mt-0.5 shrink-0" /> {cycle.data.view.disclaimer}
                  </p>
                </Card>
              )}

              <Card>
                <CardHeader icon={CalendarRange} title="Cycle calendar" subtitle="Estimated phases for the month" />
                {!cycle.data?.view?.hasData ? (
                  <EmptyState icon={CalendarHeart} title="No period data yet" message="Record a period start date to see the calendar." />
                ) : (
                  <>
                    <div className="mb-3 flex items-center justify-between">
                      <button type="button" className="icon-btn" onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} aria-label="Previous month">
                        <ChevronLeft size={18} />
                      </button>
                      <span className="font-display text-deep">
                        {calMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </span>
                      <button type="button" className="icon-btn" onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} aria-label="Next month">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 text-center">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                        <span key={d} className="text-[10px] font-semibold uppercase tracking-wide text-charcoal/45">{d}</span>
                      ))}
                      {calCells.map((c) => (
                        <div
                          key={c.date.toISOString()}
                          className={`rounded-lg border p-1.5 text-center ${
                            c.inMonth ? 'border-black/[0.06] bg-white' : 'border-transparent bg-transparent opacity-40'
                          }`}
                        >
                          <span className="text-[11px] text-charcoal/70">{c.date.getDate()}</span>
                          {c.phase && (
                            <div
                              className="mx-auto mt-1 h-1.5 w-full rounded-full"
                              style={{ backgroundColor: PHASE_META[c.phase].color }}
                              title={PHASE_META[c.phase].label}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {Object.entries(PHASE_META).map(([key, meta]) => (
                        <span key={key} className="flex items-center gap-1.5 text-[11px] text-charcoal/60">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} /> {meta.label}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </Card>

              <Card>
                <CardHeader icon={CalendarHeart} title="Recorded periods" subtitle="Add or correct your period start dates" />
                <div className="mb-4 flex flex-wrap items-end gap-2">
                  <Field label="Period start date" className="w-44">
                    <TextInput type="date" value={periodDate} onChange={(e) => setPeriodDate(e.target.value)} />
                  </Field>
                  <button type="button" className="btn-primary" onClick={addPeriod}>
                    <Plus size={15} /> Add period
                  </button>
                </div>
                {cycle.data?.view?.periods?.length ? (
                  <ul className="divide-soft">
                    {cycle.data.view.periods.map((p) => (
                      <li key={p.id} className="flex items-center justify-between py-2.5">
                        <span className="text-sm text-charcoal">{formatDate(p.startDate)}</span>
                        <button type="button" className="icon-btn h-8 w-8" onClick={() => setConfirm({ kind: 'period', id: p.id })} aria-label="Delete period">
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-charcoal/50">No periods recorded yet.</p>
                )}
              </Card>

              <ErrorBanner message={cycle.error} />
            </>
          )}
        </div>
      )}

      {/* Task modal */}
      <Modal open={Boolean(taskForm)} onClose={() => setTaskForm(null)} title={taskForm?._id ? 'Edit task' : 'Add task'} size="lg">
        {taskForm && (
          <form onSubmit={saveTask} className="space-y-4">
            <Field label="Title">
              <TextInput value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" />
            </Field>
            <Field label="Description">
              <TextArea value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional details" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Date">
                <TextInput type="date" value={taskForm.date} onChange={(e) => setTaskForm((f) => ({ ...f, date: e.target.value }))} />
              </Field>
              <Field label="Time">
                <TextInput type="time" value={taskForm.time} onChange={(e) => setTaskForm((f) => ({ ...f, time: e.target.value }))} />
              </Field>
              <Field label="Priority">
                <Select value={taskForm.priority} onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))} options={['low', 'medium', 'high']} />
              </Field>
              <Field label="Status">
                <Select
                  value={taskForm.status}
                  onChange={(e) => setTaskForm((f) => ({ ...f, status: e.target.value }))}
                  options={[
                    { value: 'todo', label: 'To do' },
                    { value: 'in-progress', label: 'In progress' },
                    { value: 'done', label: 'Done' },
                  ]}
                />
              </Field>
              <Field label="Life role">
                <Select value={taskForm.lifeRole} onChange={(e) => setTaskForm((f) => ({ ...f, lifeRole: e.target.value }))} options={LIFE_ROLES} />
              </Field>
              <Field label="Covey quadrant">
                <Select
                  value={taskForm.quadrant}
                  onChange={(e) => setTaskForm((f) => ({ ...f, quadrant: e.target.value }))}
                  options={QUADRANTS.map((q) => ({ value: q.value, label: q.label }))}
                />
              </Field>
            </div>
            {taskForm.quadrant && (
              <p className="rounded-xl bg-pale/50 px-3.5 py-2.5 text-xs text-charcoal/65">
                {QUADRANTS.find((q) => q.value === taskForm.quadrant)?.hint}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setTaskForm(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save task'}</button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete this item?"
        message="This permanently removes it from your database."
        onConfirm={runConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
