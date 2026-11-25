import { useEffect, useState } from 'react';
import { Receipt, TrendingUp, CheckSquare, BookOpen, Droplets, CalendarPlus } from 'lucide-react';
import Modal from './ui/Modal.jsx';
import { Field, TextInput, Select, TextArea } from './ui/FormControls.jsx';
import api, { apiErrorMessage } from '../services/api';
import { useToast } from '../contexts/ToastContext.jsx';
import { EXPENSE_CATEGORIES, LIFE_ROLES, QUADRANTS, EVENT_CATEGORIES } from '../utils/constants.js';
import { toInputDate } from '../utils/format.js';

const ACTIONS = [
  { value: 'expense', label: 'Expense', icon: Receipt },
  { value: 'income', label: 'Income', icon: TrendingUp },
  { value: 'task', label: 'Task', icon: CheckSquare },
  { value: 'study', label: 'Study', icon: BookOpen },
  { value: 'water', label: 'Water', icon: Droplets },
  { value: 'event', label: 'Event', icon: CalendarPlus },
];

const emptyForm = () => ({
  amount: '',
  date: toInputDate(),
  category: 'food',
  source: '',
  description: '',
  title: '',
  time: '',
  priority: 'medium',
  lifeRole: 'Other',
  quadrant: 'Q2',
  startTime: '',
  endTime: '',
  duration: 60,
  objectives: '',
  eventCategory: 'Personal',
});

export default function QuickAddModal({ open, onClose, onSaved, initialAction = 'expense' }) {
  const toast = useToast();
  const [action, setAction] = useState(initialAction);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setAction(initialAction);
      setForm(emptyForm());
    }
  }, [open, initialAction]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const close = () => {
    setForm(emptyForm());
    setAction(initialAction);
    onClose();
  };

  const buildRequest = () => {
    const num = (v) => Number(v);
    switch (action) {
      case 'expense':
      case 'income': {
        if (!form.amount || num(form.amount) <= 0) throw new Error('Enter a valid amount');
        return {
          path: '/finance/transactions',
          payload: {
            type: action,
            amount: num(form.amount),
            date: form.date,
            category: action === 'expense' ? form.category : undefined,
            source: action === 'income' ? form.source : undefined,
            description: form.description,
          },
          success: `${action === 'income' ? 'Income' : 'Expense'} saved`,
        };
      }
      case 'task': {
        if (!form.title.trim()) throw new Error('Task title is required');
        return {
          path: '/planner/tasks',
          payload: {
            title: form.title,
            date: form.date,
            time: form.time,
            priority: form.priority,
            lifeRole: form.lifeRole,
            quadrant: form.quadrant,
          },
          success: 'Task added to your plan',
        };
      }
      case 'study': {
        if (!form.duration || num(form.duration) <= 0) throw new Error('Enter a valid duration');
        return {
          path: '/study/sessions',
          payload: {
            date: form.date,
            startTime: form.startTime,
            duration: num(form.duration),
            objectives: form.objectives,
          },
          success: 'Study session logged',
        };
      }
      case 'water': {
        if (!form.amount || num(form.amount) <= 0) throw new Error('Enter a valid amount');
        return {
          path: '/health/water',
          payload: { date: form.date, amount: num(form.amount) },
          success: 'Water intake recorded',
        };
      }
      case 'event': {
        if (!form.title.trim()) throw new Error('Event title is required');
        return {
          path: '/calendar/events',
          payload: {
            title: form.title,
            date: form.date,
            startTime: form.startTime,
            endTime: form.endTime,
            category: form.eventCategory,
            description: form.description,
          },
          success: 'Event added to calendar',
        };
      }
      default:
        throw new Error('Unknown action');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    let req;
    try {
      req = buildRequest();
    } catch (err) {
      toast.error(err.message);
      return;
    }
    setBusy(true);
    try {
      await api.post(req.path, req.payload);
      toast.success(req.success);
      onSaved?.();
      close();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Quick add" subtitle="Saved straight to your database" size="lg">
      <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ACTIONS.map((a) => (
          <button
            key={a.value}
            type="button"
            onClick={() => setAction(a.value)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[11px] font-semibold transition ${
              action === a.value
                ? 'border-deep bg-deep text-white shadow-soft'
                : 'border-charcoal/12 bg-white text-charcoal/65 hover:bg-pale/50'
            }`}
          >
            <a.icon size={17} />
            {a.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {(action === 'expense' || action === 'income') && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount">
              <TextInput type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} placeholder="0.00" />
            </Field>
            <Field label="Date">
              <TextInput type="date" value={form.date} onChange={set('date')} />
            </Field>
            {action === 'expense' ? (
              <Field label="Category">
                <Select value={form.category} onChange={set('category')} options={EXPENSE_CATEGORIES} />
              </Field>
            ) : (
              <Field label="Source">
                <TextInput value={form.source} onChange={set('source')} placeholder="Salary, gift…" />
              </Field>
            )}
            <Field label="Description" className="sm:col-span-1">
              <TextInput value={form.description} onChange={set('description')} placeholder="Optional note" />
            </Field>
          </div>
        )}

        {(action === 'task' || action === 'event') && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={action === 'task' ? 'Task title' : 'Event title'} className="sm:col-span-2">
              <TextInput value={form.title} onChange={set('title')} placeholder="What is it?" />
            </Field>
            <Field label="Date">
              <TextInput type="date" value={form.date} onChange={set('date')} />
            </Field>
            <Field label="Start time">
              <TextInput type="time" value={form.startTime} onChange={set('startTime')} />
            </Field>
            {action === 'task' ? (
              <>
                <Field label="Time">
                  <TextInput type="time" value={form.time} onChange={set('time')} />
                </Field>
                <Field label="Priority">
                  <Select value={form.priority} onChange={set('priority')} options={['low', 'medium', 'high']} />
                </Field>
                <Field label="Life role">
                  <Select value={form.lifeRole} onChange={set('lifeRole')} options={LIFE_ROLES} />
                </Field>
                <Field label="Covey quadrant">
                  <Select
                    value={form.quadrant}
                    onChange={set('quadrant')}
                    options={QUADRANTS.map((q) => ({ value: q.value, label: q.label }))}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="End time">
                  <TextInput type="time" value={form.endTime} onChange={set('endTime')} />
                </Field>
                <Field label="Category">
                  <Select value={form.eventCategory} onChange={set('eventCategory')} options={EVENT_CATEGORIES} />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  <TextArea value={form.description} onChange={set('description')} placeholder="Optional details" />
                </Field>
              </>
            )}
          </div>
        )}

        {action === 'study' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date">
              <TextInput type="date" value={form.date} onChange={set('date')} />
            </Field>
            <Field label="Start time">
              <TextInput type="time" value={form.startTime} onChange={set('startTime')} />
            </Field>
            <Field label="Duration (minutes)">
              <TextInput type="number" min="1" value={form.duration} onChange={set('duration')} />
            </Field>
            <Field label="Objectives" className="sm:col-span-2">
              <TextArea value={form.objectives} onChange={set('objectives')} placeholder="What do you plan to cover?" />
            </Field>
          </div>
        )}

        {action === 'water' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (ml)">
              <TextInput type="number" min="1" value={form.amount} onChange={set('amount')} placeholder="250" />
            </Field>
            <Field label="Date">
              <TextInput type="date" value={form.date} onChange={set('date')} />
            </Field>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-outline" onClick={close} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
