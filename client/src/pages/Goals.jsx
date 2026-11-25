import { useMemo, useState } from 'react';
import { Target, Plus, Pencil, Trash2, Flag, CheckCircle2, TrendingUp } from 'lucide-react';
import { useCollection } from '../hooks/useCollection.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { Card, CardHeader } from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Badge from '../components/ui/Badge.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import { Field, TextInput, TextArea, Select } from '../components/ui/FormControls.jsx';
import { GOAL_CATEGORIES, GOAL_TYPES } from '../utils/constants.js';
import { formatDate, toInputDate } from '../utils/format.js';

const emptyGoal = () => ({
  _id: null,
  title: '',
  description: '',
  category: 'Other',
  type: 'short',
  progress: 0,
  deadline: '',
  status: 'active',
});

const typeLabel = (t) => GOAL_TYPES.find((x) => x.value === t)?.label || t;
const completed = (g) => g.status === 'completed' || g.progress >= 100;

export default function Goals() {
  const toast = useToast();
  const goals = useCollection('/goals');
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState({ category: '', type: '', status: '' });

  const filtered = useMemo(
    () =>
      goals.items.filter(
        (g) =>
          (!filters.category || g.category === filters.category) &&
          (!filters.type || g.type === filters.type) &&
          (!filters.status || (filters.status === 'completed' ? completed(g) : !completed(g)))
      ),
    [goals.items, filters]
  );

  const activeCount = goals.items.filter((g) => !completed(g)).length;
  const doneCount = goals.items.filter(completed).length;
  const avgProgress = goals.items.length
    ? Math.round(goals.items.reduce((s, g) => s + g.progress, 0) / goals.items.length)
    : 0;

  const save = async (e) => {
    e.preventDefault();
    const f = form;
    if (!f.title.trim()) return toast.error('Goal title is required');
    setBusy(true);
    try {
      const payload = {
        title: f.title,
        description: f.description,
        category: f.category,
        type: f.type,
        progress: Number(f.progress) || 0,
        deadline: f.deadline || null,
        status: Number(f.progress) >= 100 ? 'completed' : f.status,
      };
      if (f._id) await goals.update(f._id, payload);
      else await goals.create(payload);
      toast.success('Goal saved');
      setForm(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save goal');
    } finally {
      setBusy(false);
    }
  };

  const adjustProgress = async (g, delta) => {
    const progress = Math.max(0, Math.min(100, (g.progress || 0) + delta));
    try {
      await goals.update(g._id, { progress, status: progress >= 100 ? 'completed' : 'active' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update progress');
    }
  };

  const runConfirm = async () => {
    try {
      await goals.remove(confirm.id);
      toast.success('Goal deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete goal');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-deep sm:text-[28px]">Goals</h1>
          <p className="mt-1 text-sm text-charcoal/60">Monthly, yearly and long-term goals across every area of your life.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setForm(emptyGoal())}>
          <Plus size={15} /> New goal
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Target} label="Total goals" value={String(goals.items.length)} />
        <StatCard icon={Flag} label="Active" value={String(activeCount)} />
        <StatCard icon={CheckCircle2} label="Completed" value={String(doneCount)} accent="bg-[#7FA88A]/18 text-[#4f7a5c]" />
        <StatCard icon={TrendingUp} label="Avg. progress" value={`${avgProgress}%`} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} className="w-44">
          <option value="">All categories</option>
          {GOAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))} className="w-40">
          <option value="">All types</option>
          {GOAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="w-40">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </Select>
      </div>

      {goals.loading && goals.items.length === 0 ? (
        <Spinner label="Loading your goals…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Target}
          title={goals.items.length === 0 ? 'No goals yet' : 'No goals match your filters'}
          message={goals.items.length === 0 ? 'Create a goal to start tracking your progress.' : 'Try adjusting the filters above.'}
          action={goals.items.length === 0 ? <button type="button" className="btn-primary btn-sm" onClick={() => setForm(emptyGoal())}><Plus size={13} /> New goal</button> : null}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => {
            const done = completed(g);
            return (
              <Card key={g._id} className="flex flex-col">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={done ? 'green' : 'blue'}>{g.category}</Badge>
                    <Badge variant="gray">{typeLabel(g.type)}</Badge>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" className="icon-btn h-8 w-8" onClick={() => setForm({ ...g, deadline: g.deadline ? toInputDate(g.deadline) : '' })} aria-label="Edit"><Pencil size={14} /></button>
                    <button type="button" className="icon-btn h-8 w-8" onClick={() => setConfirm({ id: g._id })} aria-label="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className={`font-display text-lg leading-snug ${done ? 'text-charcoal/50 line-through' : 'text-deep'}`}>{g.title}</p>
                {g.description && <p className="mt-1 line-clamp-2 text-xs text-charcoal/55">{g.description}</p>}
                <div className="mt-auto pt-4">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-charcoal/55">{g.deadline ? `Due ${formatDate(g.deadline)}` : 'No deadline'}</span>
                    <span className="font-semibold text-deep">{g.progress}%</span>
                  </div>
                  <ProgressBar value={g.progress} color={done ? '#7FA88A' : '#344B64'} />
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="btn-outline btn-sm flex-1" onClick={() => adjustProgress(g, -10)} disabled={g.progress <= 0}>−10%</button>
                    <button type="button" className="btn-outline btn-sm flex-1" onClick={() => adjustProgress(g, 10)} disabled={g.progress >= 100}>+10%</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={Boolean(form)} onClose={() => setForm(null)} title={form?._id ? 'Edit goal' : 'New goal'} size="md">
        {form && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Goal title">
              <TextInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Save 2000 TND" />
            </Field>
            <Field label="Description">
              <TextArea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional details" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Category">
                <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} options={GOAL_CATEGORIES} />
              </Field>
              <Field label="Type">
                <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} options={GOAL_TYPES} />
              </Field>
              <Field label="Deadline">
                <TextInput type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
              </Field>
            </div>
            <Field label={`Progress — ${form.progress}%`}>
              <input
                type="range"
                min="0"
                max="100"
                value={form.progress}
                onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
                className="w-full accent-[#344B64]"
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} options={[{ value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }]} />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setForm(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save goal'}</button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete this goal?"
        message="This permanently removes the goal from your database."
        onConfirm={runConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
