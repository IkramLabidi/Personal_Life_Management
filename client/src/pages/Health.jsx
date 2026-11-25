import { useEffect, useMemo, useState } from 'react';
import {
  Apple,
  Droplets,
  Ruler,
  Dumbbell,
  Plus,
  Pencil,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Scale,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { useFetch } from '../hooks/useFetch.js';
import { useCollection } from '../hooks/useCollection.js';
import { useToast } from '../contexts/ToastContext.jsx';
import api, { apiErrorMessage } from '../services/api';
import { Card, CardHeader } from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ProgressRing from '../components/ui/ProgressRing.jsx';
import { Field, TextInput, TextArea, Select, ErrorBanner } from '../components/ui/FormControls.jsx';
import { MEAL_TYPES } from '../utils/constants.js';
import { formatDate, formatDateShort, toInputDate, capitalize } from '../utils/format.js';
import { startOfWeek, addDays, iso, DAY_NAMES, isSameDay } from '../utils/dates.js';

const TABS = [
  { value: 'diet', label: 'Diet planner', icon: Apple },
  { value: 'water', label: 'Water', icon: Droplets },
  { value: 'body', label: 'Measurements', icon: Ruler },
  { value: 'exercise', label: 'Exercise', icon: Dumbbell },
];

const QUICK_WATER = [150, 250, 500, 750];

const bmiCategory = (bmi) => {
  if (!bmi) return { label: '—', variant: 'gray' };
  if (bmi < 18.5) return { label: 'Underweight', variant: 'amber' };
  if (bmi < 25) return { label: 'Normal range', variant: 'green' };
  if (bmi < 30) return { label: 'Overweight', variant: 'amber' };
  return { label: 'Obese', variant: 'red' };
};

const emptyMeal = (date) => ({ _id: null, date: date || toInputDate(), type: 'breakfast', name: '', ingredients: '', notes: '', status: 'planned' });
const emptyExercise = (date) => ({ _id: null, date: date || toInputDate(), type: '', duration: 30, notes: '', completed: false });
const emptyMeasurement = () => ({ _id: null, date: toInputDate(), weightKg: '', heightM: '', note: '' });

export default function Health() {
  const toast = useToast();
  const [tab, setTab] = useState('diet');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const from = iso(weekStart);
  const to = iso(addDays(weekStart, 6));

  const meals = useCollection('/health/meals', useMemo(() => ({ from, to }), [from, to]));
  const exercises = useCollection('/health/exercises', useMemo(() => ({ from, to }), [from, to]));
  const measurements = useCollection('/health/measurements');
  const waterSummary = useFetch('/health/water/summary');
  const waterSettings = useFetch('/health/water/settings');
  const todayWater = useCollection('/health/water', useMemo(() => ({ from: toInputDate(), to: toInputDate() }), []));

  const [mealForm, setMealForm] = useState(null);
  const [exerciseForm, setExerciseForm] = useState(null);
  const [measureForm, setMeasureForm] = useState(null);
  const [goalEdit, setGoalEdit] = useState(null);
  const [customWater, setCustomWater] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

  useEffect(() => {
    if (waterSettings.data) setGoalEdit(String(waterSettings.data.waterGoalMl));
  }, [waterSettings.data]);

  const refreshWater = async () => {
    await Promise.all([waterSummary.reload(), todayWater.reload()]);
  };

  const saveMeal = async (e) => {
    e.preventDefault();
    const f = mealForm;
    if (!f.name.trim()) return toast.error('Meal name is required');
    setBusy(true);
    try {
      const d = new Date(f.date);
      const dayOfWeek = DAY_NAMES[(d.getDay() + 6) % 7];
      const payload = { date: f.date, dayOfWeek, type: f.type, name: f.name, ingredients: f.ingredients, notes: f.notes, status: f.status };
      if (f._id) await meals.update(f._id, payload);
      else await meals.create(payload);
      toast.success('Meal saved');
      setMealForm(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleMeal = async (m) => {
    try {
      await meals.update(m._id, { status: m.status === 'consumed' ? 'planned' : 'consumed' });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const saveExercise = async (e) => {
    e.preventDefault();
    const f = exerciseForm;
    if (!f.type.trim()) return toast.error('Exercise type is required');
    if (!f.duration || Number(f.duration) < 1) return toast.error('Enter a duration');
    setBusy(true);
    try {
      const payload = { date: f.date, type: f.type, duration: Number(f.duration), notes: f.notes, completed: f.completed };
      if (f._id) await exercises.update(f._id, payload);
      else await exercises.create(payload);
      toast.success('Exercise saved');
      setExerciseForm(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleExercise = async (x) => {
    try {
      await exercises.update(x._id, { completed: !x.completed });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const saveMeasurement = async (e) => {
    e.preventDefault();
    const f = measureForm;
    if (!f.weightKg || !f.heightM) return toast.error('Enter weight and height');
    setBusy(true);
    try {
      const payload = { date: f.date, weightKg: Number(f.weightKg), heightM: Number(f.heightM), note: f.note };
      if (f._id) await measurements.update(f._id, payload);
      else await measurements.create(payload);
      toast.success('Measurement saved');
      setMeasureForm(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const saveGoal = async () => {
    const val = Number(goalEdit);
    if (!val || val < 100) return toast.error('Enter a realistic goal in ml');
    try {
      await api.put('/health/water/settings', { waterGoalMl: val });
      toast.success('Hydration goal updated');
      waterSettings.reload();
      refreshWater();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const addWater = async (amount) => {
    if (!amount || Number(amount) <= 0) return toast.error('Enter an amount');
    try {
      await api.post('/health/water', { date: toInputDate(), amount: Number(amount) });
      toast.success(`Logged ${amount} ml`);
      setCustomWater('');
      refreshWater();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const runConfirm = async () => {
    try {
      if (confirm.kind === 'meal') await meals.remove(confirm.id);
      else if (confirm.kind === 'exercise') await exercises.remove(confirm.id);
      else if (confirm.kind === 'measure') await measurements.remove(confirm.id);
      else if (confirm.kind === 'water') {
        await api.delete(`/health/water/${confirm.id}`);
        refreshWater();
      }
      toast.success('Deleted');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const weekLabel = `${formatDate(weekStart)} – ${formatDate(addDays(weekStart, 6))}`;

  const measureSeries = useMemo(
    () =>
      [...measurements.items]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((m) => ({ date: formatDateShort(m.date), Weight: m.weightKg, BMI: m.bmi })),
    [measurements.items]
  );

  const latestMeasure = measureSeries[measureSeries.length - 1];
  const exerciseDone = exercises.items.filter((x) => x.completed);
  const exerciseMinutes = exercises.items.reduce((s, x) => s + (x.completed ? x.duration : 0), 0);

  const ws = waterSummary.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-deep sm:text-[28px]">Health &amp; Fitness</h1>
          <p className="mt-1 text-sm text-charcoal/60">Diet, hydration, body measurements and exercise — all in one place.</p>
        </div>
        {(tab === 'diet' || tab === 'exercise') && (
          <div className="flex items-center gap-2">
            <button type="button" className="icon-btn" onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label="Previous week">
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="btn-outline btn-sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>This week</button>
            <button type="button" className="icon-btn" onClick={() => setWeekStart((w) => addDays(w, 7))} aria-label="Next week">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        {(tab === 'diet' || tab === 'exercise') && <span className="text-sm text-charcoal/55">{weekLabel}</span>}
      </div>

      {tab === 'diet' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button type="button" className="btn-primary btn-sm" onClick={() => setMealForm(emptyMeal())}>
              <Plus size={13} /> Add meal
            </button>
          </div>
          {meals.loading && meals.items.length === 0 ? (
            <Spinner label="Loading your meal plan…" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
              {days.map((day, idx) => {
                const dayISO = iso(day);
                const dayMeals = meals.items.filter((m) => iso(m.date) === dayISO);
                const isToday = isSameDay(day, new Date());
                return (
                  <div key={dayISO} className={`rounded-2xl border p-3 ${isToday ? 'border-dusty bg-pale/25' : 'border-black/[0.06] bg-white'}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">{DAY_NAMES[idx]}</p>
                        <p className="font-display text-lg text-deep">{day.getDate()}</p>
                      </div>
                      <button type="button" className="icon-btn h-7 w-7" onClick={() => setMealForm(emptyMeal(dayISO))} aria-label="Add meal">
                        <Plus size={15} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {MEAL_TYPES.map((type) => {
                        const list = dayMeals.filter((m) => m.type === type);
                        return (
                          <div key={type}>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal/40">{type}</p>
                            {list.length === 0 ? (
                              <button
                                type="button"
                                onClick={() => setMealForm({ ...emptyMeal(dayISO), type })}
                                className="mt-1 w-full rounded-lg border border-dashed border-charcoal/15 py-1.5 text-[10px] text-charcoal/40 hover:bg-pale/40"
                              >
                                + add
                              </button>
                            ) : (
                              list.map((m) => (
                                <div key={m._id} className="mt-1 rounded-lg border border-black/[0.06] bg-white p-2">
                                  <div className="flex items-start gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => toggleMeal(m)}
                                      className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                                        m.status === 'consumed' ? 'border-deep bg-deep text-white' : 'border-charcoal/30'
                                      }`}
                                      aria-label="Toggle consumed"
                                    >
                                      {m.status === 'consumed' && <Check size={9} />}
                                    </button>
                                    <span className={`min-w-0 flex-1 text-[12px] leading-snug ${m.status === 'consumed' ? 'text-charcoal/50 line-through' : 'text-charcoal'}`}>
                                      {m.name}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex justify-end gap-1">
                                    <button type="button" className="icon-btn h-6 w-6" onClick={() => setMealForm({ ...m, date: iso(m.date) })} aria-label="Edit meal">
                                      <Pencil size={11} />
                                    </button>
                                    <button type="button" className="icon-btn h-6 w-6" onClick={() => setConfirm({ kind: 'meal', id: m._id })} aria-label="Delete meal">
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'water' && (
        <div className="space-y-5">
          {waterSummary.loading && !ws ? (
            <Spinner label="Loading hydration…" />
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="flex flex-col items-center">
                  <ProgressRing value={ws?.percent || 0} color="#7FA6C8">
                    <span className="font-display text-xl text-deep">{ws?.percent || 0}%</span>
                    <span className="text-[10px] text-charcoal/50">of goal</span>
                  </ProgressRing>
                  <p className="mt-3 text-center text-sm text-charcoal/70">
                    {ws?.consumed || 0} ml of {ws?.goal || 0} ml today
                  </p>
                  <p className="text-xs text-charcoal/50">{ws?.remaining || 0} ml remaining</p>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader icon={Droplets} title="Log water" subtitle="Tap a quick amount or enter a custom quantity" />
                  <div className="flex flex-wrap gap-2">
                    {QUICK_WATER.map((q) => (
                      <button key={q} type="button" className="btn-outline btn-sm" onClick={() => addWater(q)}>
                        <Plus size={13} /> {q} ml
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-end gap-2">
                    <Field label="Custom amount (ml)" className="w-40">
                      <TextInput type="number" min="1" value={customWater} onChange={(e) => setCustomWater(e.target.value)} placeholder="e.g. 300" />
                    </Field>
                    <button type="button" className="btn-primary" onClick={() => addWater(customWater)}>
                      <Droplets size={15} /> Add
                    </button>
                    <div className="ml-auto flex items-end gap-2">
                      <Field label="Daily goal (ml)" className="w-36">
                        <TextInput type="number" min="100" value={goalEdit || ''} onChange={(e) => setGoalEdit(e.target.value)} />
                      </Field>
                      <button type="button" className="btn-outline" onClick={saveGoal}>Save goal</button>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader icon={Droplets} title="Weekly hydration" subtitle="Total per day this week" />
                  {!ws?.weekly?.length ? (
                    <EmptyState icon={Droplets} title="No data yet" message="Log your first glass of water." />
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ws.weekly.map((d) => ({ day: formatDateShort(d.date), Water: d.amount, Goal: d.goal }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(69,75,82,0.1)" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v) => `${v} ml`} />
                          <Legend />
                          <Bar dataKey="Water" fill="#9BB2C9" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="Goal" fill="#DCE5ED" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>

                <Card>
                  <CardHeader icon={Droplets} title="Today's entries" subtitle={`${todayWater.items.length} record(s)`} />
                  {todayWater.items.length === 0 ? (
                    <EmptyState icon={Droplets} title="Nothing logged today" message="Use the quick buttons to record water." />
                  ) : (
                    <ul className="divide-soft">
                      {todayWater.items.map((w) => (
                        <li key={w._id} className="flex items-center justify-between py-2.5">
                          <span className="text-sm text-charcoal">{w.amount} ml</span>
                          <button type="button" className="icon-btn h-8 w-8" onClick={() => setConfirm({ kind: 'water', id: w._id })} aria-label="Delete entry">
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'body' && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <button type="button" className="btn-primary btn-sm" onClick={() => setMeasureForm(emptyMeasurement())}>
              <Plus size={13} /> Add measurement
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Scale} label="Latest weight" value={latestMeasure ? `${latestMeasure.Weight} kg` : '—'} />
            <StatCard icon={Ruler} label="Latest BMI" value={latestMeasure ? latestMeasure.BMI : '—'} hint={latestMeasure ? bmiCategory(latestMeasure.BMI).label : 'No data'} />
            <StatCard icon={Ruler} label="Records" value={String(measurements.items.length)} />
            <StatCard icon={Ruler} label="Height" value={measureForm?.heightM ? `${measureForm.heightM} m` : '—'} />
          </div>

          <Card>
            <CardHeader icon={Scale} title="Weight & BMI progress" subtitle="Saved measurements over time" />
            {measureSeries.length === 0 ? (
              <EmptyState icon={Ruler} title="No measurements yet" message="Record your weight and height to see progress." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={measureSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(69,75,82,0.1)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="Weight" stroke="#344B64" strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="BMI" stroke="#C2A878" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="mt-3 flex items-start gap-2 text-[11px] text-charcoal/50">
              <Info size={13} className="mt-0.5 shrink-0" /> BMI is an adult screening measure based on weight ÷ height². It is not a diagnosis.
            </p>
          </Card>

          <Card>
            <CardHeader icon={Ruler} title="Measurement history" />
            {measurements.loading && measurements.items.length === 0 ? (
              <Spinner />
            ) : measurements.items.length === 0 ? (
              <EmptyState icon={Ruler} title="Nothing recorded" message="Add your first measurement." />
            ) : (
              <ul className="divide-soft">
                {[...measurements.items].sort((a, b) => new Date(b.date) - new Date(a.date)).map((m) => (
                  <li key={m._id} className="flex items-center gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-charcoal">
                        {m.weightKg} kg · {m.heightM} m · BMI {m.bmi}
                      </p>
                      <p className="text-[11px] text-charcoal/50">{formatDate(m.date)}{m.note ? ` · ${m.note}` : ''}</p>
                    </div>
                    <button type="button" className="icon-btn h-8 w-8" onClick={() => setMeasureForm({ ...m, date: iso(m.date) })} aria-label="Edit">
                      <Pencil size={14} />
                    </button>
                    <button type="button" className="icon-btn h-8 w-8" onClick={() => setConfirm({ kind: 'measure', id: m._id })} aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === 'exercise' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={Dumbbell} label="Completed" value={`${exerciseDone.length}/${exercises.items.length}`} />
            <StatCard icon={Dumbbell} label="Active minutes" value={`${exerciseMinutes}`} hint="This week" />
            <StatCard icon={Dumbbell} label="Sessions" value={String(exercises.items.length)} />
            <StatCard icon={Dumbbell} label="Completion" value={exercises.items.length ? `${Math.round((exerciseDone.length / exercises.items.length) * 100)}%` : '—'} />
          </div>

          <div className="flex justify-end">
            <button type="button" className="btn-primary btn-sm" onClick={() => setExerciseForm(emptyExercise())}>
              <Plus size={13} /> Add exercise
            </button>
          </div>

          {exercises.loading && exercises.items.length === 0 ? (
            <Spinner label="Loading your workouts…" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
              {days.map((day, idx) => {
                const dayISO = iso(day);
                const list = exercises.items.filter((x) => iso(x.date) === dayISO);
                const isToday = isSameDay(day, new Date());
                return (
                  <div key={dayISO} className={`rounded-2xl border p-3 ${isToday ? 'border-dusty bg-pale/25' : 'border-black/[0.06] bg-white'}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">{DAY_NAMES[idx]}</p>
                        <p className="font-display text-lg text-deep">{day.getDate()}</p>
                      </div>
                      <button type="button" className="icon-btn h-7 w-7" onClick={() => setExerciseForm(emptyExercise(dayISO))} aria-label="Add exercise">
                        <Plus size={15} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {list.length === 0 && <p className="py-2 text-[11px] text-charcoal/35">Rest day</p>}
                      {list.map((x) => (
                        <div key={x._id} className={`rounded-xl border border-black/[0.06] bg-white p-2.5 ${x.completed ? '' : 'opacity-90'}`}>
                          <div className="flex items-start gap-2">
                            <button
                              type="button"
                              onClick={() => toggleExercise(x)}
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                x.completed ? 'border-deep bg-deep text-white' : 'border-charcoal/30'
                              }`}
                              aria-label="Toggle completed"
                            >
                              {x.completed && <Check size={11} />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className={`text-[13px] leading-snug ${x.completed ? 'text-charcoal/50 line-through' : 'text-charcoal'}`}>{x.type}</p>
                              <p className="text-[10px] text-charcoal/50">{x.duration} min</p>
                            </div>
                          </div>
                          <div className="mt-1.5 flex justify-end gap-1">
                            <button type="button" className="icon-btn h-6 w-6" onClick={() => setExerciseForm({ ...x, date: iso(x.date) })} aria-label="Edit">
                              <Pencil size={11} />
                            </button>
                            <button type="button" className="icon-btn h-6 w-6" onClick={() => setConfirm({ kind: 'exercise', id: x._id })} aria-label="Delete">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Meal modal */}
      <Modal open={Boolean(mealForm)} onClose={() => setMealForm(null)} title={mealForm?._id ? 'Edit meal' : 'Add meal'} size="md">
        {mealForm && (
          <form onSubmit={saveMeal} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <TextInput type="date" value={mealForm.date} onChange={(e) => setMealForm((f) => ({ ...f, date: e.target.value }))} />
              </Field>
              <Field label="Meal">
                <Select value={mealForm.type} onChange={(e) => setMealForm((f) => ({ ...f, type: e.target.value }))} options={MEAL_TYPES.map((t) => ({ value: t, label: capitalize(t) }))} />
              </Field>
            </div>
            <Field label="Meal name">
              <TextInput value={mealForm.name} onChange={(e) => setMealForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Oatmeal with fruit" />
            </Field>
            <Field label="Ingredients">
              <TextArea value={mealForm.ingredients} onChange={(e) => setMealForm((f) => ({ ...f, ingredients: e.target.value }))} placeholder="Oats, milk, banana…" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status">
                <Select value={mealForm.status} onChange={(e) => setMealForm((f) => ({ ...f, status: e.target.value }))} options={[{ value: 'planned', label: 'Planned' }, { value: 'consumed', label: 'Consumed' }]} />
              </Field>
              <Field label="Notes">
                <TextInput value={mealForm.notes} onChange={(e) => setMealForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setMealForm(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save meal'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Exercise modal */}
      <Modal open={Boolean(exerciseForm)} onClose={() => setExerciseForm(null)} title={exerciseForm?._id ? 'Edit exercise' : 'Add exercise'} size="md">
        {exerciseForm && (
          <form onSubmit={saveExercise} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <TextInput type="date" value={exerciseForm.date} onChange={(e) => setExerciseForm((f) => ({ ...f, date: e.target.value }))} />
              </Field>
              <Field label="Duration (minutes)">
                <TextInput type="number" min="1" value={exerciseForm.duration} onChange={(e) => setExerciseForm((f) => ({ ...f, duration: e.target.value }))} />
              </Field>
            </div>
            <Field label="Exercise type">
              <TextInput value={exerciseForm.type} onChange={(e) => setExerciseForm((f) => ({ ...f, type: e.target.value }))} placeholder="Running, yoga, cycling…" />
            </Field>
            <Field label="Notes">
              <TextArea value={exerciseForm.notes} onChange={(e) => setExerciseForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
            </Field>
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input type="checkbox" checked={exerciseForm.completed} onChange={(e) => setExerciseForm((f) => ({ ...f, completed: e.target.checked }))} className="h-4 w-4 accent-[#344B64]" />
              Mark as completed
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setExerciseForm(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save exercise'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Measurement modal */}
      <Modal open={Boolean(measureForm)} onClose={() => setMeasureForm(null)} title={measureForm?._id ? 'Edit measurement' : 'Add measurement'} size="md">
        {measureForm && (
          <form onSubmit={saveMeasurement} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Date">
                <TextInput type="date" value={measureForm.date} onChange={(e) => setMeasureForm((f) => ({ ...f, date: e.target.value }))} />
              </Field>
              <Field label="Weight (kg)">
                <TextInput type="number" step="0.1" value={measureForm.weightKg} onChange={(e) => setMeasureForm((f) => ({ ...f, weightKg: e.target.value }))} />
              </Field>
              <Field label="Height (m)">
                <TextInput type="number" step="0.01" value={measureForm.heightM} onChange={(e) => setMeasureForm((f) => ({ ...f, heightM: e.target.value }))} placeholder="1.70" />
              </Field>
            </div>
            {measureForm.weightKg && measureForm.heightM && (
              <p className="rounded-xl bg-pale/50 px-3.5 py-2.5 text-sm text-charcoal/70">
                BMI:{' '}
                <span className="font-semibold text-deep">
                  {(Number(measureForm.weightKg) / Number(measureForm.heightM) ** 2).toFixed(1)}
                </span>{' '}
                — an adult screening measure, not a diagnosis.
              </p>
            )}
            <Field label="Note">
              <TextInput value={measureForm.note} onChange={(e) => setMeasureForm((f) => ({ ...f, note: e.target.value }))} placeholder="Optional" />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setMeasureForm(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete this record?"
        message="This permanently removes it from your database."
        onConfirm={runConfirm}
        onClose={() => setConfirm(null)}
      />

      <ErrorBanner message={waterSummary.error} />
    </div>
  );
}
