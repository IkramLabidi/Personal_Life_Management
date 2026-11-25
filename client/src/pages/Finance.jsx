import { useMemo, useState } from 'react';
import {
  Wallet,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Plus,
  Pencil,
  Trash2,
  Target,
  ArrowDownCircle,
  ArrowUpCircle,
  Settings2,
  RefreshCw,
  Receipt,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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
import ProgressBar from '../components/ui/ProgressBar.jsx';
import { Field, TextInput, TextArea, Select, ErrorBanner } from '../components/ui/FormControls.jsx';
import { EXPENSE_CATEGORIES, CATEGORY_COLORS } from '../utils/constants.js';
import { currency, formatDate, toInputDate, capitalize } from '../utils/format.js';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'savings', label: 'Piggy bank' },
];

const emptyTx = () => ({
  _id: null,
  type: 'expense',
  amount: '',
  date: toInputDate(),
  category: 'food',
  source: '',
  description: '',
});

const emptySav = () => ({ _id: null, type: 'deposit', amount: '', date: toInputDate(), note: '', goal: '' });
const emptyGoal = () => ({ _id: null, name: '', target: '', deadline: '', note: '' });

export default function Finance() {
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const summary = useFetch('/finance/summary');
  const profile = useFetch('/finance/profile');
  const tx = useCollection('/finance/transactions');
  const savings = useCollection('/finance/savings');
  const goals = useCollection('/finance/savings-goals');

  const [txForm, setTxForm] = useState(null);
  const [savForm, setSavForm] = useState(null);
  const [goalForm, setGoalForm] = useState(null);
  const [profileForm, setProfileForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const cur = summary.data?.currency || profile.data?.currency || 'TND';

  const refreshAll = async () => {
    await Promise.all([summary.reload(), tx.reload(), savings.reload(), goals.reload(), profile.reload()]);
  };

  const pieData = useMemo(
    () =>
      (summary.data?.categoryBreakdown || []).map((c) => ({
        name: capitalize(c.category),
        value: c.total,
        color: CATEGORY_COLORS[c.category] || '#9BB2C9',
      })),
    [summary.data]
  );

  const monthlyData = useMemo(
    () =>
      (summary.data?.monthly || []).map((m) => ({
        month: m.month,
        Income: m.income,
        Expenses: m.expense,
      })),
    [summary.data]
  );

  const saveTx = async (e) => {
    e.preventDefault();
    const f = txForm;
    if (!f.amount || Number(f.amount) <= 0) return toast.error('Enter a valid amount');
    setBusy(true);
    try {
      const payload = {
        type: f.type,
        amount: Number(f.amount),
        date: f.date,
        category: f.type === 'expense' ? f.category : 'other',
        source: f.type === 'income' ? f.source : '',
        description: f.description,
      };
      if (f._id) await tx.update(f._id, payload);
      else await tx.create(payload);
      toast.success(f._id ? 'Transaction updated' : 'Transaction saved');
      setTxForm(null);
      await refreshAll();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const saveSavings = async (e) => {
    e.preventDefault();
    const f = savForm;
    if (!f.amount || Number(f.amount) <= 0) return toast.error('Enter a valid amount');
    setBusy(true);
    try {
      const payload = {
        type: f.type,
        amount: Number(f.amount),
        date: f.date,
        note: f.note,
        goal: f.goal || null,
      };
      if (f._id) await savings.update(f._id, payload);
      else await savings.create(payload);
      toast.success(f.type === 'deposit' ? 'Deposit recorded' : 'Withdrawal recorded');
      setSavForm(null);
      await refreshAll();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const saveGoal = async (e) => {
    e.preventDefault();
    const f = goalForm;
    if (!f.name.trim()) return toast.error('Goal name is required');
    if (!f.target || Number(f.target) <= 0) return toast.error('Enter a target amount');
    setBusy(true);
    try {
      const payload = {
        name: f.name,
        target: Number(f.target),
        deadline: f.deadline || null,
        note: f.note,
      };
      if (f._id) await goals.update(f._id, payload);
      else await goals.create(payload);
      toast.success('Savings goal saved');
      setGoalForm(null);
      await refreshAll();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put('/finance/profile', {
        initialBalance: Number(profileForm.initialBalance) || 0,
        currency: profileForm.currency || 'TND',
      });
      toast.success('Starting balance updated');
      setProfileForm(null);
      await refreshAll();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = async () => {
    const { kind, id } = confirm;
    try {
      if (kind === 'tx') await tx.remove(id);
      else if (kind === 'sav') await savings.remove(id);
      else if (kind === 'goal') await goals.remove(id);
      toast.success('Deleted');
      await refreshAll();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  if (summary.loading && !summary.data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner label="Loading your finances…" />
      </div>
    );
  }
  if (summary.error && !summary.data) {
    return (
      <div className="space-y-4">
        <ErrorBanner message={`Could not load your finances: ${summary.error}`} />
        <button type="button" className="btn-primary" onClick={summary.reload}>
          <RefreshCw size={15} /> Try again
        </button>
      </div>
    );
  }

  const s = summary.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-deep sm:text-[28px]">Financial Tracker</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            Income, expenses and your piggy bank — calculated from every saved record.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-outline" onClick={() => setProfileForm({ ...(profile.data || { initialBalance: s.initialBalance, currency: cur }) })}>
            <Settings2 size={15} /> Starting balance
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setTxForm({ ...emptyTx(), type: 'expense' })}
          >
            <Plus size={15} /> Add transaction
          </button>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Wallet} label="Bank balance" value={currency(s.balance, cur)} hint={`Started at ${currency(s.initialBalance, cur)}`} />
            <StatCard icon={PiggyBank} label="Piggy bank" value={currency(s.savingsBalance, cur)} hint={`${currency(s.totalDeposits, cur)} saved`} />
            <StatCard icon={TrendingUp} label="Total income" value={currency(s.totalIncome, cur)} accent="bg-[#7FA88A]/18 text-[#4f7a5c]" />
            <StatCard icon={TrendingDown} label="Total expenses" value={currency(s.totalExpense, cur)} accent="bg-[#b0655f]/15 text-[#9d5650]" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader icon={Receipt} title="Spending by category" subtitle="All recorded expenses" />
              {pieData.length === 0 ? (
                <EmptyState icon={Receipt} title="No expenses yet" message="Add an expense to see the breakdown." />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={2}>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => currency(v, cur)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card>
              <CardHeader icon={TrendingUp} title="Monthly activity" subtitle="Income vs expenses by month" />
              {monthlyData.length === 0 ? (
                <EmptyState icon={TrendingUp} title="Nothing to chart yet" message="Your monthly activity will appear here." />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(69,75,82,0.1)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => currency(v, cur)} />
                      <Legend />
                      <Bar dataKey="Income" fill="#9BB2C9" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Expenses" fill="#344B64" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {goals.items.length > 0 && (
            <Card>
              <CardHeader icon={Target} title="Savings goals" subtitle="Progress toward each target" />
              <ul className="space-y-4">
                {goals.items.map((g) => {
                  const pct = g.target ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
                  return (
                    <li key={g._id}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="text-charcoal">{g.name}</span>
                        <span className="text-xs text-charcoal/60">
                          {currency(g.saved, cur)} / {currency(g.target, cur)}
                        </span>
                      </div>
                      <ProgressBar value={pct} />
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      )}

      {tab === 'transactions' && (
        <Card>
          <CardHeader
            icon={Receipt}
            title="Transactions"
            subtitle={`${tx.items.length} record(s)`}
            action={
              <button type="button" className="btn-primary btn-sm" onClick={() => setTxForm({ ...emptyTx(), type: 'expense' })}>
                <Plus size={13} /> Add
              </button>
            }
          />
          {tx.loading && tx.items.length === 0 ? (
            <Spinner label="Loading transactions…" />
          ) : tx.items.length === 0 ? (
            <EmptyState icon={Receipt} title="No transactions yet" message="Record your first income or expense." />
          ) : (
            <ul className="divide-soft">
              {tx.items.map((t) => (
                <li key={t._id} className="flex items-center gap-3 py-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      t.type === 'income' ? 'bg-[#7FA88A]/18 text-[#4f7a5c]' : 'bg-[#b0655f]/15 text-[#9d5650]'
                    }`}
                  >
                    {t.type === 'income' ? <ArrowDownCircle size={17} /> : <ArrowUpCircle size={17} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-charcoal">
                      {t.type === 'income' ? t.source || 'Income' : capitalize(t.category)}
                    </p>
                    <p className="text-[11px] text-charcoal/50">
                      {formatDate(t.date)}
                      {t.description ? ` · ${t.description}` : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold ${t.type === 'income' ? 'text-[#4f7a5c]' : 'text-[#9d5650]'}`}>
                    {t.type === 'income' ? '+' : '−'}
                    {currency(t.amount, cur)}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" className="icon-btn h-8 w-8" onClick={() => setTxForm({ ...t, date: toInputDate(t.date) })} aria-label="Edit">
                      <Pencil size={14} />
                    </button>
                    <button type="button" className="icon-btn h-8 w-8" onClick={() => setConfirm({ kind: 'tx', id: t._id })} aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'savings' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={PiggyBank} label="Piggy balance" value={currency(s.savingsBalance, cur)} />
            <StatCard icon={ArrowDownCircle} label="Total deposits" value={currency(s.totalDeposits, cur)} accent="bg-[#7FA88A]/18 text-[#4f7a5c]" />
            <StatCard icon={ArrowUpCircle} label="Total withdrawals" value={currency(s.totalWithdrawals, cur)} accent="bg-[#b0655f]/15 text-[#9d5650]" />
            <StatCard icon={Target} label="Active goals" value={String(goals.items.length)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                icon={PiggyBank}
                title="Deposits & withdrawals"
                subtitle="Transfers to the piggy bank are not expenses"
                action={
                  <button type="button" className="btn-primary btn-sm" onClick={() => setSavForm(emptySav())}>
                    <Plus size={13} /> Record
                  </button>
                }
              />
              {savings.loading && savings.items.length === 0 ? (
                <Spinner />
              ) : savings.items.length === 0 ? (
                <EmptyState icon={PiggyBank} title="No savings activity" message="Deposit money into your piggy bank to start saving." />
              ) : (
                <ul className="divide-soft">
                  {savings.items.map((t) => (
                    <li key={t._id} className="flex items-center gap-3 py-3">
                      <span className="flex-1 min-w-0">
                        <p className="text-sm text-charcoal">{capitalize(t.type)}</p>
                        <p className="text-[11px] text-charcoal/50">
                          {formatDate(t.date)}
                          {t.note ? ` · ${t.note}` : ''}
                        </p>
                      </span>
                      <span className={`text-sm font-semibold ${t.type === 'deposit' ? 'text-[#4f7a5c]' : 'text-[#9d5650]'}`}>
                        {t.type === 'deposit' ? '+' : '−'}
                        {currency(t.amount, cur)}
                      </span>
                      <div className="flex gap-1">
                        <button type="button" className="icon-btn h-8 w-8" onClick={() => setSavForm({ ...t, date: toInputDate(t.date), goal: t.goal || '' })} aria-label="Edit">
                          <Pencil size={14} />
                        </button>
                        <button type="button" className="icon-btn h-8 w-8" onClick={() => setConfirm({ kind: 'sav', id: t._id })} aria-label="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader
                icon={Target}
                title="Savings goals"
                action={
                  <button type="button" className="btn-outline btn-sm" onClick={() => setGoalForm(emptyGoal())}>
                    <Plus size={13} /> New goal
                  </button>
                }
              />
              {goals.items.length === 0 ? (
                <EmptyState icon={Target} title="No goals yet" message="Set a target to stay motivated." />
              ) : (
                <ul className="space-y-4">
                  {goals.items.map((g) => {
                    const pct = g.target ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
                    return (
                      <li key={g._id}>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="truncate text-sm text-charcoal">{g.name}</span>
                          <div className="flex shrink-0 items-center gap-1">
                            <button type="button" className="icon-btn h-7 w-7" onClick={() => setGoalForm({ ...g, deadline: g.deadline ? toInputDate(g.deadline) : '' })} aria-label="Edit">
                              <Pencil size={13} />
                            </button>
                            <button type="button" className="icon-btn h-7 w-7" onClick={() => setConfirm({ kind: 'goal', id: g._id })} aria-label="Delete">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <ProgressBar value={pct} />
                        <p className="mt-1 text-[11px] text-charcoal/55">
                          {currency(g.saved, cur)} of {currency(g.target, cur)}
                          {g.deadline ? ` · by ${formatDate(g.deadline)}` : ''}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Transaction modal */}
      <Modal open={Boolean(txForm)} onClose={() => setTxForm(null)} title={txForm?._id ? 'Edit transaction' : 'Add transaction'} size="md">
        {txForm && (
          <form onSubmit={saveTx} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {['expense', 'income'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTxForm((f) => ({ ...f, type: t }))}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize transition ${
                    txForm.type === t ? 'border-deep bg-deep text-white' : 'border-charcoal/12 text-charcoal/65 hover:bg-pale/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount">
                <TextInput type="number" step="0.01" min="0" value={txForm.amount} onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </Field>
              <Field label="Date">
                <TextInput type="date" value={txForm.date} onChange={(e) => setTxForm((f) => ({ ...f, date: e.target.value }))} />
              </Field>
              {txForm.type === 'expense' ? (
                <Field label="Category">
                  <Select value={txForm.category} onChange={(e) => setTxForm((f) => ({ ...f, category: e.target.value }))} options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: capitalize(c) }))} />
                </Field>
              ) : (
                <Field label="Source">
                  <TextInput value={txForm.source} onChange={(e) => setTxForm((f) => ({ ...f, source: e.target.value }))} placeholder="Salary, gift…" />
                </Field>
              )}
              <Field label="Description">
                <TextInput value={txForm.description} onChange={(e) => setTxForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional note" />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn-outline" onClick={() => setTxForm(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Savings modal */}
      <Modal open={Boolean(savForm)} onClose={() => setSavForm(null)} title={savForm?._id ? 'Edit savings entry' : 'Record savings activity'} size="md">
        {savForm && (
          <form onSubmit={saveSavings} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[['deposit', 'Deposit'], ['withdrawal', 'Withdrawal']].map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSavForm((f) => ({ ...f, type: v }))}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    savForm.type === v ? 'border-deep bg-deep text-white' : 'border-charcoal/12 text-charcoal/65 hover:bg-pale/50'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount">
                <TextInput type="number" step="0.01" min="0" value={savForm.amount} onChange={(e) => setSavForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </Field>
              <Field label="Date">
                <TextInput type="date" value={savForm.date} onChange={(e) => setSavForm((f) => ({ ...f, date: e.target.value }))} />
              </Field>
              <Field label="Goal (optional)">
                <Select value={savForm.goal || ''} onChange={(e) => setSavForm((f) => ({ ...f, goal: e.target.value }))}>
                  <option value="">— None —</option>
                  {goals.items.map((g) => (
                    <option key={g._id} value={g._id}>{g.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Note">
                <TextInput value={savForm.note} onChange={(e) => setSavForm((f) => ({ ...f, note: e.target.value }))} placeholder="Optional note" />
              </Field>
            </div>
            <p className="rounded-xl bg-pale/50 px-3.5 py-2.5 text-xs text-charcoal/65">
              Deposits move money from your bank balance into the piggy bank. They are treated as internal transfers, not expenses.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setSavForm(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Goal modal */}
      <Modal open={Boolean(goalForm)} onClose={() => setGoalForm(null)} title={goalForm?._id ? 'Edit savings goal' : 'New savings goal'} size="md">
        {goalForm && (
          <form onSubmit={saveGoal} className="space-y-4">
            <Field label="Goal name">
              <TextInput value={goalForm.name} onChange={(e) => setGoalForm((f) => ({ ...f, name: e.target.value }))} placeholder="Emergency fund" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Target amount">
                <TextInput type="number" step="0.01" min="0" value={goalForm.target} onChange={(e) => setGoalForm((f) => ({ ...f, target: e.target.value }))} />
              </Field>
              <Field label="Target date (optional)">
                <TextInput type="date" value={goalForm.deadline} onChange={(e) => setGoalForm((f) => ({ ...f, deadline: e.target.value }))} />
              </Field>
            </div>
            <Field label="Note">
              <TextArea value={goalForm.note} onChange={(e) => setGoalForm((f) => ({ ...f, note: e.target.value }))} placeholder="Optional" />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setGoalForm(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Profile (starting balance) modal */}
      <Modal open={Boolean(profileForm)} onClose={() => setProfileForm(null)} title="Starting bank balance" size="sm">
        {profileForm && (
          <form onSubmit={saveProfile} className="space-y-4">
            <p className="text-sm text-charcoal/65">
              Set the balance you had before tracking. Your live balance is this amount plus all income, minus expenses and piggy deposits.
            </p>
            <Field label="Starting balance">
              <TextInput type="number" step="0.01" value={profileForm.initialBalance ?? 0} onChange={(e) => setProfileForm((f) => ({ ...f, initialBalance: e.target.value }))} />
            </Field>
            <Field label="Currency">
              <TextInput value={profileForm.currency || 'TND'} onChange={(e) => setProfileForm((f) => ({ ...f, currency: e.target.value }))} placeholder="TND" />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setProfileForm(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete this record?"
        message="This permanently removes the record from your database."
        onConfirm={runConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
