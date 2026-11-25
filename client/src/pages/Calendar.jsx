import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Bell,
  GraduationCap,
} from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { useCollection } from '../hooks/useCollection.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { Card, CardHeader } from '../components/ui/Card.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Field, TextInput, TextArea, Select, ErrorBanner } from '../components/ui/FormControls.jsx';
import { EVENT_CATEGORIES, EVENT_COLORS } from '../utils/constants.js';
import { formatDate, toInputDate } from '../utils/format.js';
import { startOfWeek, addDays, addMonths, iso, isSameDay, DAY_NAMES } from '../utils/dates.js';

const VIEWS = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
];

const emptyEvent = (date) => ({
  _id: null,
  title: '',
  description: '',
  date: date || toInputDate(),
  startTime: '',
  endTime: '',
  category: 'Personal',
  reminder: false,
});

export default function Calendar() {
  const toast = useToast();
  const [view, setView] = useState('month');
  const [cursor, setCursor] = useState(() => new Date());
  const agenda = useFetch('/calendar/agenda');
  const events = useCollection('/calendar/events');
  const [eventForm, setEventForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const items = agenda.data || [];

  const byDay = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const key = iso(it.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    });
    return map;
  }, [items]);

  const reload = async () => {
    await Promise.all([agenda.reload(), events.reload()]);
  };

  const saveEvent = async (e) => {
    e.preventDefault();
    const f = eventForm;
    if (!f.title.trim()) return toast.error('Event title is required');
    setBusy(true);
    try {
      const payload = {
        title: f.title,
        description: f.description,
        date: f.date,
        startTime: f.startTime,
        endTime: f.endTime,
        category: f.category,
        reminder: f.reminder,
      };
      if (f._id) await events.update(f._id, payload);
      else await events.create(payload);
      toast.success('Event saved');
      setEventForm(null);
      await reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save event');
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = async () => {
    try {
      await events.remove(confirm.id);
      toast.success('Event deleted');
      await reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete event');
    }
  };

  const step = (dir) => {
    if (view === 'month') setCursor((c) => addMonths(c, dir));
    else if (view === 'week') setCursor((c) => addDays(c, dir * 7));
    else setCursor((c) => addDays(c, dir));
  };

  const headerLabel = useMemo(() => {
    if (view === 'month') return cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (view === 'week') {
      const s = startOfWeek(cursor);
      return `${formatDate(s)} – ${formatDate(addDays(s, 6))}`;
    }
    return formatDate(cursor, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }, [view, cursor]);

  const monthCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startPad = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -startPad);
    return Array.from({ length: 42 }).map((_, i) => addDays(gridStart, i));
  }, [cursor]);

  const weekDays = useMemo(() => {
    const s = startOfWeek(cursor);
    return Array.from({ length: 7 }).map((_, i) => addDays(s, i));
  }, [cursor]);

  const ItemPill = ({ it, compact = false }) => {
    const color = EVENT_COLORS[it.category] || '#8C93A0';
    const isAcademic = it.source === 'academic';
    return (
      <div
        className={`group flex items-start gap-1.5 rounded-lg border border-black/[0.05] bg-white px-1.5 py-1 ${compact ? '' : 'p-2'}`}
        style={{ borderLeft: `3px solid ${color}` }}
      >
        {isAcademic && <GraduationCap size={11} className="mt-0.5 shrink-0 text-deep" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] leading-snug text-charcoal">{it.title}</p>
          {!compact && it.startTime && <p className="text-[10px] text-charcoal/50">{it.startTime}{it.endTime ? `–${it.endTime}` : ''}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-deep sm:text-[28px]">Personal Calendar</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            Events, academic deadlines and important tasks in one view.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setEventForm(emptyEvent())}>
          <Plus size={15} /> Add event
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="Previous"><ChevronLeft size={18} /></button>
          <button type="button" className="btn-outline btn-sm" onClick={() => setCursor(new Date())}>Today</button>
          <button type="button" className="icon-btn" onClick={() => step(1)} aria-label="Next"><ChevronRight size={18} /></button>
          <span className="ml-1 font-display text-lg text-deep">{headerLabel}</span>
        </div>
        <Tabs tabs={VIEWS} active={view} onChange={setView} />
      </div>

      <div className="flex flex-wrap gap-3">
        {EVENT_CATEGORIES.map((c) => (
          <span key={c} className="flex items-center gap-1.5 text-[11px] text-charcoal/60">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EVENT_COLORS[c] }} /> {c}
          </span>
        ))}
      </div>

      {agenda.loading && !agenda.data ? (
        <Spinner label="Loading your calendar…" />
      ) : agenda.error && !agenda.data ? (
        <ErrorBanner message={agenda.error} />
      ) : (
        <>
          {view === 'month' && (
            <Card className="overflow-x-auto p-3 sm:p-5">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-7 gap-1.5 pb-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <span key={d} className="text-center text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {monthCells.map((day) => {
                    const key = iso(day);
                    const list = byDay.get(key) || [];
                    const inMonth = day.getMonth() === cursor.getMonth();
                    const today = isSameDay(day, new Date());
                    return (
                      <div
                        key={key}
                        className={`min-h-[96px] rounded-xl border p-1.5 ${inMonth ? 'border-black/[0.06] bg-white' : 'border-transparent bg-transparent opacity-40'} ${today ? 'ring-1 ring-dusty' : ''}`}
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className={`text-[11px] ${today ? 'font-bold text-deep' : 'text-charcoal/60'}`}>{day.getDate()}</span>
                          <button type="button" className="text-charcoal/30 hover:text-deep" onClick={() => setEventForm(emptyEvent(key))} aria-label="Add event">
                            <Plus size={12} />
                          </button>
                        </div>
                        <div className="space-y-1">
                          {list.slice(0, 3).map((it) => <ItemPill key={it.id} it={it} compact />)}
                          {list.length > 3 && <p className="pl-1 text-[10px] text-charcoal/45">+{list.length - 3} more</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {view === 'week' && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
              {weekDays.map((day, idx) => {
                const key = iso(day);
                const list = byDay.get(key) || [];
                const today = isSameDay(day, new Date());
                return (
                  <div key={key} className={`rounded-2xl border p-3 ${today ? 'border-dusty bg-pale/25' : 'border-black/[0.06] bg-white'}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">{DAY_NAMES[idx]}</p>
                        <p className="font-display text-lg text-deep">{day.getDate()}</p>
                      </div>
                      <button type="button" className="icon-btn h-7 w-7" onClick={() => setEventForm(emptyEvent(key))} aria-label="Add event"><Plus size={15} /></button>
                    </div>
                    <div className="space-y-2">
                      {list.length === 0 && <p className="py-2 text-[11px] text-charcoal/35">No events</p>}
                      {list.map((it) => <ItemPill key={it.id} it={it} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'day' && (
            <Card>
              <CardHeader icon={CalendarDays} title={headerLabel} subtitle={`${(byDay.get(iso(cursor)) || []).length} item(s)`} />
              {(byDay.get(iso(cursor)) || []).length === 0 ? (
                <EmptyState icon={CalendarDays} title="Nothing scheduled" message="This day is clear." action={<button type="button" className="btn-primary btn-sm" onClick={() => setEventForm(emptyEvent(iso(cursor)))}><Plus size={13} /> Add event</button>} />
              ) : (
                <ul className="divide-soft">
                  {(byDay.get(iso(cursor)) || []).map((it) => (
                    <li key={it.id} className="flex items-start gap-3 py-3">
                      <span className="mt-1 h-8 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: EVENT_COLORS[it.category] || '#8C93A0' }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-charcoal">{it.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge variant="neutral">{it.category}</Badge>
                          {it.startTime && <span className="flex items-center gap-1 text-[11px] text-charcoal/50"><Clock size={11} /> {it.startTime}{it.endTime ? `–${it.endTime}` : ''}</span>}
                          {it.reminder && <Bell size={11} className="text-charcoal/40" />}
                        </div>
                        {it.description && <p className="mt-1 text-[11px] text-charcoal/50">{it.description}</p>}
                      </div>
                      {it.source === 'event' ? (
                        <div className="flex shrink-0 gap-1">
                          <button type="button" className="icon-btn h-8 w-8" onClick={() => setEventForm({ ...it, _id: it.recordId, date: iso(it.date) })} aria-label="Edit"><Pencil size={14} /></button>
                          <button type="button" className="icon-btn h-8 w-8" onClick={() => setConfirm({ id: it.recordId })} aria-label="Delete"><Trash2 size={14} /></button>
                        </div>
                      ) : (
                        <Badge variant="blue">From Study</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </>
      )}

      <Modal open={Boolean(eventForm)} onClose={() => setEventForm(null)} title={eventForm?._id ? 'Edit event' : 'Add event'} size="md">
        {eventForm && (
          <form onSubmit={saveEvent} className="space-y-4">
            <Field label="Title">
              <TextInput value={eventForm.title} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} placeholder="What is the event?" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <TextInput type="date" value={eventForm.date} onChange={(e) => setEventForm((f) => ({ ...f, date: e.target.value }))} />
              </Field>
              <Field label="Category">
                <Select value={eventForm.category} onChange={(e) => setEventForm((f) => ({ ...f, category: e.target.value }))} options={EVENT_CATEGORIES} />
              </Field>
              <Field label="Start time">
                <TextInput type="time" value={eventForm.startTime} onChange={(e) => setEventForm((f) => ({ ...f, startTime: e.target.value }))} />
              </Field>
              <Field label="End time">
                <TextInput type="time" value={eventForm.endTime} onChange={(e) => setEventForm((f) => ({ ...f, endTime: e.target.value }))} />
              </Field>
            </div>
            <Field label="Description">
              <TextArea value={eventForm.description} onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional details" />
            </Field>
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input type="checkbox" checked={eventForm.reminder} onChange={(e) => setEventForm((f) => ({ ...f, reminder: e.target.checked }))} className="h-4 w-4 accent-[#344B64]" />
              Set a reminder for this event
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setEventForm(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save event'}</button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete this event?"
        message="This permanently removes the event from your calendar."
        onConfirm={runConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
