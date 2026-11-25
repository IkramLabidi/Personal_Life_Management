import { useMemo, useState } from 'react';
import { NotebookPen, Plus, Pencil, Trash2, Lock, Sparkles } from 'lucide-react';
import { useCollection } from '../hooks/useCollection.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { Field, TextInput, TextArea } from '../components/ui/FormControls.jsx';
import { MOODS } from '../utils/constants.js';
import { formatDate, toInputDate } from '../utils/format.js';

const emptyEntry = () => ({ _id: null, date: toInputDate(), mood: 'neutral', reflection: '', achievements: '', notes: '' });
const moodMeta = (value) => MOODS.find((m) => m.value === value) || { label: 'Neutral', emoji: '😐' };

export default function Journal() {
  const toast = useToast();
  const journal = useCollection('/journal');
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const sorted = useMemo(
    () => [...journal.items].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [journal.items]
  );

  const save = async (e) => {
    e.preventDefault();
    const f = form;
    if (!f.reflection.trim() && !f.achievements.trim() && !f.notes.trim()) {
      return toast.error('Write something before saving');
    }
    setBusy(true);
    try {
      const payload = {
        date: f.date,
        mood: f.mood,
        reflection: f.reflection,
        achievements: f.achievements,
        notes: f.notes,
      };
      if (f._id) await journal.update(f._id, payload);
      else await journal.create(payload);
      toast.success('Journal entry saved');
      setForm(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save entry');
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = async () => {
    try {
      await journal.remove(confirm.id);
      toast.success('Entry deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete entry');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-deep sm:text-[28px]">Daily Journal</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-charcoal/60">
            <Lock size={13} /> Private to your account — reflections, achievements and mood.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setForm(emptyEntry())}>
          <Plus size={15} /> New entry
        </button>
      </div>

      {journal.loading && journal.items.length === 0 ? (
        <Spinner label="Loading your journal…" />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="Your journal is empty"
          message="Capture a reflection, an achievement and how you felt today."
          action={<button type="button" className="btn-primary btn-sm" onClick={() => setForm(emptyEntry())}><Plus size={13} /> New entry</button>}
        />
      ) : (
        <div className="space-y-4">
          {sorted.map((entry) => (
            <Card key={entry._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pale/60 text-xl" aria-hidden>
                    {moodMeta(entry.mood).emoji}
                  </span>
                  <div>
                    <p className="font-display text-lg text-deep">{formatDate(entry.date, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p className="text-xs text-charcoal/55">Mood: {moodMeta(entry.mood).label}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" className="icon-btn h-8 w-8" onClick={() => setForm({ ...entry, date: toInputDate(entry.date) })} aria-label="Edit entry">
                    <Pencil size={14} />
                  </button>
                  <button type="button" className="icon-btn h-8 w-8" onClick={() => setConfirm({ id: entry._id })} aria-label="Delete entry">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {entry.reflection && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">Reflection</p>
                    <p className="mt-0.5 whitespace-pre-line text-sm text-charcoal/80">{entry.reflection}</p>
                  </div>
                )}
                {entry.achievements && (
                  <div className="rounded-xl bg-[#7FA88A]/10 px-3.5 py-2.5">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#4f7a5c]">
                      <Sparkles size={12} /> Achievements
                    </p>
                    <p className="mt-0.5 whitespace-pre-line text-sm text-charcoal/80">{entry.achievements}</p>
                  </div>
                )}
                {entry.notes && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">Notes</p>
                    <p className="mt-0.5 whitespace-pre-line text-sm text-charcoal/70">{entry.notes}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={Boolean(form)} onClose={() => setForm(null)} title={form?._id ? 'Edit journal entry' : 'New journal entry'} size="lg">
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <TextInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </Field>
              <Field label="Mood">
                <div className="flex flex-wrap gap-1.5">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, mood: m.value }))}
                      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                        form.mood === m.value ? 'border-deep bg-deep text-white' : 'border-charcoal/12 text-charcoal/65 hover:bg-pale/50'
                      }`}
                    >
                      <span aria-hidden>{m.emoji}</span> {m.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Reflection">
              <TextArea value={form.reflection} onChange={(e) => setForm((f) => ({ ...f, reflection: e.target.value }))} placeholder="How did today go? What did you learn?" />
            </Field>
            <Field label="Achievements">
              <TextArea value={form.achievements} onChange={(e) => setForm((f) => ({ ...f, achievements: e.target.value }))} placeholder="What are you proud of today?" />
            </Field>
            <Field label="Notes">
              <TextArea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Anything else on your mind." />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setForm(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save entry'}</button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete this entry?"
        message="This permanently removes the journal entry from your database."
        onConfirm={runConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
