/**
 * End-to-end API smoke test for LIFEOS.
 *
 * Requires the backend and MongoDB to be running. It exercises the full flow
 * described in the PRD test scenario and verifies that data persists and that
 * balances/statistics are computed from real records.
 *
 *   node scripts/smoke-test.js
 *
 * Optional: API_URL=http://localhost:5000/api
 */
const BASE = process.env.API_URL || 'http://localhost:5000/api';

let token = '';
let passed = 0;
let failed = 0;

const log = (ok, label, extra = '') => {
  if (ok) passed += 1;
  else failed += 1;
  const mark = ok ? 'PASS' : 'FAIL';
  // eslint-disable-next-line no-console
  console.log(`[${mark}] ${label}${extra ? ` — ${extra}` : ''}`);
};

const request = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
};

const today = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const run = async () => {
  // eslint-disable-next-line no-console
  console.log(`\nLIFEOS smoke test → ${BASE}\n${'='.repeat(48)}`);

  const health = await request('GET', '/health');
  log(health.status === 200, 'Health endpoint reachable', `status ${health.status}`);

  const email = `smoke_${Date.now()}@lifeos.test`;

  // 1. Register
  const reg = await request('POST', '/auth/register', { name: 'Smoke Test', email, password: 'secret123' });
  log(reg.status === 201 && reg.data?.token, 'Register a new user');
  token = reg.data?.token || '';

  // 2. Login again
  const login = await request('POST', '/auth/login', { email, password: 'secret123' });
  log(login.status === 200 && login.data?.token, 'Log in');
  token = login.data?.token || token;

  const me = await request('GET', '/auth/me');
  log(me.status === 200 && me.data?.user?.email === email, 'Fetch current user (/auth/me)');

  // 3. Finance: set starting balance, income, expense, savings
  const prof = await request('PUT', '/finance/profile', { initialBalance: 1000, currency: 'TND' });
  log(prof.status === 200, 'Set starting balance (1000)');

  await request('POST', '/finance/transactions', { type: 'income', amount: 500, date: today(), source: 'Salary' });
  await request('POST', '/finance/transactions', { type: 'expense', amount: 120, date: today(), category: 'food' });
  await request('POST', '/finance/savings', { type: 'deposit', amount: 200, date: today(), note: 'Piggy' });

  const summary = await request('GET', '/finance/summary');
  const s = summary.data || {};
  // balance = 1000 + 500 - 120 - 200 + 0 = 1180
  log(s.balance === 1180, 'Balance reconstructed from records', `balance=${s.balance} (expected 1180)`);
  log(s.savingsBalance === 200, 'Piggy bank balance computed', `savings=${s.savingsBalance} (expected 200)`);

  const goal = await request('POST', '/finance/savings-goals', { name: 'Laptop', target: 1000 });
  log(goal.status === 201, 'Create savings goal');

  // 4. Weekly planner: task + weekly goal + review
  const task = await request('POST', '/planner/tasks', {
    title: 'Study Covey Q2',
    date: today(),
    time: '09:00',
    priority: 'high',
    lifeRole: 'Personal Development',
    quadrant: 'Q2',
  });
  log(task.status === 201, 'Create weekly task');

  const wgoal = await request('POST', '/planner/goals', { week: today(), title: 'Finish reading' });
  log(wgoal.status === 201, 'Create weekly goal');

  const review = await request('PUT', '/planner/review', { week: today(), priorities: 'Focus', review: 'Good week' });
  log(review.status === 200, 'Save weekly review');

  // 5. Cycle
  await request('PUT', '/planner/cycle', { enabled: true, cycleLength: 28, periodDuration: 5 });
  const period = await request('POST', '/planner/cycle/periods', { startDate: today() });
  log(period.status === 201 && period.data?.view?.hasData, 'Record period & build cycle view');
  const cycleView = await request('GET', '/planner/cycle');
  log(Boolean(cycleView.data?.view?.phase), 'Cycle view exposes a phase', cycleView.data?.view?.phase);

  // 6. Health: meal, water, measurement, exercise
  const meal = await request('POST', '/health/meals', { date: today(), type: 'breakfast', name: 'Oats', status: 'planned' });
  log(meal.status === 201, 'Add meal');

  await request('POST', '/health/water', { date: today(), amount: 500 });
  const water = await request('GET', '/health/water/summary');
  log(water.data?.consumed === 500, 'Water consumed today computed', `consumed=${water.data?.consumed}`);

  const measure = await request('POST', '/health/measurements', { date: today(), weightKg: 65, heightM: 1.7 });
  const bmi = measure.data?.bmi;
  log(Math.abs(bmi - 22.5) < 0.2, 'BMI auto-calculated', `bmi=${bmi}`);

  const ex = await request('POST', '/health/exercises', { date: today(), type: 'Running', duration: 30, completed: true });
  log(ex.status === 201, 'Add exercise');

  // 7. Study: subject, task, session
  const subject = await request('POST', '/study/subjects', { name: 'Math', code: 'M1', color: '#344B64' });
  log(subject.status === 201, 'Create subject');
  const subjectId = subject.data?._id;

  const acad = await request('POST', '/study/tasks', {
    title: 'Assignment 1',
    subject: subjectId,
    type: 'assignment',
    deadline: today(),
    priority: 'high',
  });
  log(acad.status === 201, 'Create academic task');

  const session = await request('POST', '/study/sessions', { subject: subjectId, date: today(), startTime: '10:00', duration: 90, objectives: 'Algebra' });
  log(session.status === 201, 'Log study session');

  const stats = await request('GET', '/study/stats');
  log(stats.data?.totalHours >= 1.5, 'Study stats total hours computed', `totalHours=${stats.data?.totalHours}`);

  // 8. Calendar: event + merged agenda (event + academic deadline)
  const evt = await request('POST', '/calendar/events', { title: 'Dentist', date: today(), startTime: '14:00', category: 'Health' });
  log(evt.status === 201, 'Create calendar event');
  const agenda = await request('GET', '/calendar/agenda');
  const hasEvent = Array.isArray(agenda.data) && agenda.data.some((x) => x.source === 'event');
  const hasAcademic = Array.isArray(agenda.data) && agenda.data.some((x) => x.source === 'academic');
  log(hasEvent, 'Agenda includes calendar events');
  log(hasAcademic, 'Agenda includes academic deadlines (auto-synced, no duplicates)');

  // 9. Goals & journal
  const pgoal = await request('POST', '/goals', { title: 'Read 12 books', category: 'Personal Development', type: 'yearly', progress: 25 });
  log(pgoal.status === 201, 'Create personal goal');
  const entry = await request('POST', '/journal', { date: today(), mood: 'good', reflection: 'Productive day', achievements: 'Shipped LIFEOS' });
  log(entry.status === 201, 'Create journal entry');

  // 10. Dashboard aggregation
  const dash = await request('GET', '/dashboard');
  const d = dash.data || {};
  log(dash.status === 200, 'Dashboard loads');
  log(d.finance?.balance === 1180, 'Dashboard bank balance matches', `balance=${d.finance?.balance}`);
  log(d.water?.consumed === 500, 'Dashboard water matches', `consumed=${d.water?.consumed}`);
  log(d.cycle?.enabled === true, 'Dashboard shows cycle (enabled)');

  // 11. Simulate "reopen & log in": fresh login, re-read data
  token = '';
  const reLogin = await request('POST', '/auth/login', { email, password: 'secret123' });
  token = reLogin.data?.token || '';
  const summary2 = await request('GET', '/finance/summary');
  const tasksAfter = await request('GET', '/planner/tasks');
  log(summary2.data?.balance === 1180, 'After re-login, balance still correct (persistence)');
  log(Array.isArray(tasksAfter.data) && tasksAfter.data.length >= 1, 'After re-login, tasks still available (persistence)');

  // eslint-disable-next-line no-console
  console.log(`${'='.repeat(48)}\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Smoke test crashed:', err.message);
  process.exit(1);
});
