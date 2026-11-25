import { useMemo, useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  ClipboardList,
  Layers,
  Plus,
  Pencil,
  Trash2,
  Check,
  Clock,
  CalendarClock,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useFetch } from '../hooks/useFetch.js';
import { useCollection } from '../hooks/useCollection.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { Card, CardHeader } from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Field, TextInput, TextArea, Select } from '../components/ui/FormControls.jsx';
import { formatDate, formatDateShort, toInputDate, capitalize, relativeDays } from '../utils/format.js';

const TABS = [
  { value: 'overview', label: 'Overview', icon: GraduationCap },
  { value: 'subjects', label: 'Subjects', icon: Layers },
  { value: 'tasks', label: 'Academic tasks', icon: ClipboardList },
  { value: 'sessions', label: 'Study sessions', icon: BookOpen },
];

const TASK_TYPES = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'project', label: 'Project' },
  { value: 'exam', label: 'Exam' },
];

const SUBJECT_COLORS = ['#9BB2C9', '#344B64', '#7FA88A', '#C2A878', '#B98A8A', '#8C93A0'];

const emptySubject = () => ({ _id: null, name: '', code: '', instructor: '', color: '#9BB2C9' });
const emptyTask = () => ({ _id: null, title: '', subject: '', type: 'assignment', deadline: toInputDate(), priority: 'medium', description: '', status: 'pending' });
const emptySession = () => ({ _id: null, subject: '', date: toInputDate(), startTime: '', duration: 60, objectives: '' });

export default function Study() {
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const stats = useFetch('/study/stats');
  const subjects = useCollection('/study/subjects');
  const tasks = useCollection('/study/tasks');
  const sessions = useCollection('/study/sessions');

  const [subjectForm, setSubjectForm] = useState(null);
  const [taskForm, setTaskForm] = useState(null);
  const [sessionForm, setSessionForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const reloadAll = async () => {
    await Promise.all([stats.reload(), subjects.reload(), tasks.reload(), sessions.reload()]);
  };

  const saveSubject = async (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) return toast.error('Subject name is required');
    setBusy(true);
    try {
      const payload = { name: subjectForm.name, code: subjectForm.code, instructor: subjectForm.instructor, color: subjectForm.color };
      if (subjectForm._id) await subjects.update(subjectForm._id, payload);
      else await subjects.create(payload);
      toast.success('Subject saved');
      setSubjectForm(null);
      await reloadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save subject');
    } finally {
      setBusy(false);
    }
  };

  const saveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Task title is required');
    if (!taskForm.deadline) return toast.error('A deadline is required');
    setBusy(true);
    try {
      const payload = {
        title: taskForm.title,
        subject: taskForm.subject || null,
        type: taskForm.type,
        deadline: taskForm.deadline,
        priority: taskForm.priority,
        description: taskForm.description,
        status: taskForm.status,
      };
      if (taskForm._id) await tasks.update(taskForm._id, payload);
      else await tasks.create(payload);
      toast.success('Academic task saved');
      setTaskForm(null);
      await reloadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save task');
    } finally {
      setBusy(false);
    }
  };

  const toggleTask = async (t) => {
    try {
      await tasks.update(t._id, { status: t.status === 'done' ? 'pending' : 'done' });
      await reloadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update task');
    }
  };

  const saveSession = async (e) => {
    e.preventDefault();
    if (!sessionForm.duration || Number(sessionForm.duration) < 1) return toast.error('Enter a valid duration');
    setBusy(true);
    try {
      const payload = {
        subject: sessionForm.subject || null,
        date: sessionForm.date,
        startTime: sessionForm.startTime,
        duration: Number(sessionForm.duration),
        objectives: sessionForm.objectives,
      };
      if (sessionForm._id) await sessions.update(sessionForm._id, payload);
      else await sessions.create(payload);
      toast.success('Study session logged');
      setSessionForm(null);
      await reloadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save session');
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = async () => {
    try {
      if (confirm.kind === 'subject') await subjects.remove(confirm.id);
      else if (confirm.kind === 'task') await tasks.remove(confirm.id);
      else if (confirm.kind === 'session') await sessions.remove(confirm.id);
      toast.success('Deleted');
      await reloadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete');
    }
  };

  const st = stats.data;
  const weeklyData = useMemo(
    () => (st?.weekly || []).map((d) => ({ day: formatDateShort(d.date), Hours: d.hours })),
    [st]
  );

  const priorityVariant = (p) => (p === 'high' ? 'red' : p === 'medium' ? 'amber' : 'blue');
  const typeVariant = (t) => (t === 'exam' ? 'red' : t === 'project' ? 'amber' : 'blue');

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-deep sm:text-[28px]">Study Tracker</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            Subjects, deadlines and study sessions — deadlines also appear in your calendar automatically.
          </p>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="space-y-5">
          {stats.loading && !st ? (
            <Spinner label="Loading study stats…" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard icon={Clock} label="Total study time" value={`${st?.totalHours || 0}h`} />
                <StatCard icon={BookOpen} label="This week" value={`${st?.weeklyHours || 0}h`} />
                <StatCard icon={Check} label="Completed tasks" value={String(st?.tasks?.completed || 0)} accent="bg-[#7FA88A]/18 text-[#4f7a5c]" />
                <StatCard icon={CalendarClock} label="Upcoming" value={String(st?.tasks?.upcoming || 0)} />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader icon={BookOpen} title="Weekly study hours" subtitle="Hours per day this week" />
                  {weeklyData.every((d) => d.Hours === 0) ? (
                    <EmptyState icon={BookOpen} title="No study time this week" message="Log a study session to see your hours." />
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(69,75,82,0.1)" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v) => `${v} h`} />
                          <Bar dataKey="Hours" fill="#344B64" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>

                <div className="space-y-4">
                  <Card>
                    <CardHeader icon={ClipboardList} title="Task status" />
                    <ul className="space-y-2.5 text-sm">
                      <li className="flex items-center justify-between"><span className="text-charcoal/70">Completed</span><span className="font-semibold text-deep">{st?.tasks?.completed || 0}</span></li>
                      <li className="flex items-center justify-between"><span className="text-charcoal/70">Upcoming</span><span className="font-semibold text-deep">{st?.tasks?.upcoming || 0}</span></li>
                      <li className="flex items-center justify-between"><span className="text-charcoal/70">Overdue</span><span className="font-semibold text-[#9d5650]">{st?.tasks?.overdue || 0}</span></li>
                      <li className="flex items-center justify-between border-t border-charcoal/[0.07] pt-2.5"><span className="text-charcoal/70">Total</span><span className="font-semibold text-deep">{st?.tasks?.total || 0}</span></li>
                    </ul>
                  </Card>
                  {st?.tasks?.overdue > 0 && (
                    <div className="flex items-start gap-2 rounded-2xl border border-[#b0655f]/30 bg-[#b0655f]/8 px-3.5 py-3 text-sm text-[#9d5650]">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                      <span>You have {st.tasks.overdue} overdue task(s). Review your deadlines.</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'subjects' && (
        <Card>
          <CardHeader
            icon={Layers}
            title="Subjects"
            subtitle={`${subjects.items.length} subject(s)`}
            action={<button type="button" className="btn-primary btn-sm" onClick={() => setSubjectForm(emptySubject())}><Plus size={13} /> Add subject</button>}
          />
          {subjects.loading && subjects.items.length === 0 ? (
            <Spinner />
          ) : subjects.items.length === 0 ? (
            <EmptyState icon={Layers} title="No subjects yet" message="Add the subjects you are studying." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.items.map((s) => (
                <div key={s._id} className="rounded-2xl border border-black/[0.06] bg-white p-4">
                  <div className="flex items-start justify-between">
                    <span className="h-8 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <div className="flex gap-1">
                      <button type="button" className="icon-btn h-8 w-8" onClick={() => setSubjectForm({ ...s })} aria-label="Edit subject"><Pencil size={14} /></button>
                      <button type="button" className="icon-btn h-8 w-8" onClick={() => setConfirm({ kind: 'subject', id: s._id })} aria-label="Delete subject"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <p className="mt-2 font-display text-lg text-deep">{s.name}</p>
                  <p className="text-xs text-charcoal/55">
                    {s.code ? `${s.code}` : ''}{s.code && s.instructor ? ' · ' : ''}{s.instructor || ''}
                  </p>
                  <p className="mt-2 text-[11px] text-charcoal/45">
                    {tasks.items.filter((t) => t.subject?._id === s._id || t.subject === s._id).length} task(s) ·
                    {' '}
                    {sessions.items.filter((x) => x.subject?._id === s._id || x.subject === s._id).length} session(s)
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'tasks' && (
        <Card>
          <CardHeader
            icon={ClipboardList}
            title="Academic tasks"
            subtitle="Assignments, projects and exams — synced to your calendar"
            action={<button type="button" className="btn-primary btn-sm" onClick={() => setTaskForm(emptyTask())}><Plus size={13} /> Add task</button>}
          />
          {tasks.loading && tasks.items.length === 0 ? (
            <Spinner />
          ) : tasks.items.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No academic tasks" message="Add an assignment, project or exam with a deadline." />
          ) : (
            <ul className="divide-soft">
              {tasks.items.map((t) => {
                const done = t.status === 'done';
                const overdue = !done && new Date(t.deadline) < new Date();
                return (
                  <li key={t._id} className="flex items-start gap-3 py-3">
                    <button
                      type="button"
                      onClick={() => toggleTask(t)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${done ? 'border-deep bg-deep text-white' : 'border-charcoal/30'}`}
                      aria-label="Toggle done"
                    >
                      {done && <Check size={13} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${done ? 'text-charcoal/45 line-through' : 'text-charcoal'}`}>{t.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant={typeVariant(t.type)}>{capitalize(t.type)}</Badge>
                        <Badge variant={priorityVariant(t.priority)}>{capitalize(t.priority)}</Badge>
                        {t.subject?.name && <Badge variant="neutral">{t.subject.name}</Badge>}
                        <span className={`text-[11px] ${overdue ? 'font-semibold text-[#9d5650]' : 'text-charcoal/50'}`}>
                          {formatDate(t.deadline)} · {relativeDays(t.deadline)}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" className="icon-btn h-8 w-8" onClick={() => setTaskForm({ ...t, subject: t.subject?._id || t.subject || '', deadline: toInputDate(t.deadline) })} aria-label="Edit">
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="icon-btn h-8 w-8" onClick={() => setConfirm({ kind: 'task', id: t._id })} aria-label="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {tab === 'sessions' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard icon={Clock} label="Total hours" value={`${st?.totalHours || 0}h`} />
            <StatCard icon={BookOpen} label="This week" value={`${st?.weeklyHours || 0}h`} />
            <StatCard icon={BookOpen} label="Sessions" value={String(sessions.items.length)} />
          </div>
          <Card>
            <CardHeader
              icon={BookOpen}
              title="Study sessions"
              subtitle="Your study history"
              action={<button type="button" className="btn-primary btn-sm" onClick={() => setSessionForm(emptySession())}><Plus size={13} /> Add session</button>}
            />
            {sessions.loading && sessions.items.length === 0 ? (
              <Spinner />
            ) : sessions.items.length === 0 ? (
              <EmptyState icon={BookOpen} title="No study sessions" message="Log a session to build your study history." />
            ) : (
              <ul className="divide-soft">
                {sessions.items.map((s) => (
                  <li key={s._id} className="flex items-start gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pale/60 text-deep">
                      <Clock size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-charcoal">
                        {s.subject?.name || 'General study'} · {s.duration} min
                      </p>
                      <p className="text-[11px] text-charcoal/50">
                        {formatDate(s.date)}{s.startTime ? ` · ${s.startTime}` : ''}{s.objectives ? ` · ${s.objectives}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" className="icon-btn h-8 w-8" onClick={() => setSessionForm({ ...s, subject: s.subject?._id || s.subject || '', date: toInputDate(s.date) })} aria-label="Edit">
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="icon-btn h-8 w-8" onClick={() => setConfirm({ kind: 'session', id: s._id })} aria-label="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* Subject modal */}
      <Modal open={Boolean(subjectForm)} onClose={() => setSubjectForm(null)} title={subjectForm?._id ? 'Edit subject' : 'Add subject'} size="md">
        {subjectForm && (
          <form onSubmit={saveSubject} className="space-y-4">
            <Field label="Subject name">
              <TextInput value={subjectForm.name} onChange={(e) => setSubjectForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Linear Algebra" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code (optional)">
                <TextInput value={subjectForm.code} onChange={(e) => setSubjectForm((f) => ({ ...f, code: e.target.value }))} placeholder="MATH201" />
              </Field>
              <Field label="Instructor (optional)">
                <TextInput value={subjectForm.instructor} onChange={(e) => setSubjectForm((f) => ({ ...f, instructor: e.target.value }))} />
              </Field>
            </div>
            <Field label="Colour">
              <div className="flex gap-2">
                {SUBJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSubjectForm((f) => ({ ...f, color: c }))}
                    className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ${subjectForm.color === c ? 'ring-deep' : 'ring-transparent'}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Colour ${c}`}
                  />
                ))}
              </div>
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setSubjectForm(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save subject'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Task modal */}
      <Modal open={Boolean(taskForm)} onClose={() => setTaskForm(null)} title={taskForm?._id ? 'Edit academic task' : 'Add academic task'} size="lg">
        {taskForm && (
          <form onSubmit={saveTask} className="space-y-4">
            <Field label="Title">
              <TextInput value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Chapter 4 report" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Subject">
                <Select value={taskForm.subject || ''} onChange={(e) => setTaskForm((f) => ({ ...f, subject: e.target.value }))}>
                  <option value="">— None —</option>
                  {subjects.items.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label="Type">
                <Select value={taskForm.type} onChange={(e) => setTaskForm((f) => ({ ...f, type: e.target.value }))} options={TASK_TYPES} />
              </Field>
              <Field label="Deadline">
                <TextInput type="date" value={taskForm.deadline} onChange={(e) => setTaskForm((f) => ({ ...f, deadline: e.target.value }))} />
              </Field>
              <Field label="Priority">
                <Select value={taskForm.priority} onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))} options={['low', 'medium', 'high']} />
              </Field>
            </div>
            <Field label="Description">
              <TextArea value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional details" />
            </Field>
            <Field label="Status">
              <Select value={taskForm.status} onChange={(e) => setTaskForm((f) => ({ ...f, status: e.target.value }))} options={[{ value: 'pending', label: 'Pending' }, { value: 'done', label: 'Done' }]} />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setTaskForm(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save task'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Session modal */}
      <Modal open={Boolean(sessionForm)} onClose={() => setSessionForm(null)} title={sessionForm?._id ? 'Edit study session' : 'Log study session'} size="md">
        {sessionForm && (
          <form onSubmit={saveSession} className="space-y-4">
            <Field label="Subject">
              <Select value={sessionForm.subject || ''} onChange={(e) => setSessionForm((f) => ({ ...f, subject: e.target.value }))}>
                <option value="">— General study —</option>
                {subjects.items.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Date">
                <TextInput type="date" value={sessionForm.date} onChange={(e) => setSessionForm((f) => ({ ...f, date: e.target.value }))} />
              </Field>
              <Field label="Start time">
                <TextInput type="time" value={sessionForm.startTime} onChange={(e) => setSessionForm((f) => ({ ...f, startTime: e.target.value }))} />
              </Field>
              <Field label="Duration (min)">
                <TextInput type="number" min="1" value={sessionForm.duration} onChange={(e) => setSessionForm((f) => ({ ...f, duration: e.target.value }))} />
              </Field>
            </div>
            <Field label="Objectives">
              <TextArea value={sessionForm.objectives} onChange={(e) => setSessionForm((f) => ({ ...f, objectives: e.target.value }))} placeholder="What did you plan to cover?" />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setSessionForm(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save session'}</button>
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
