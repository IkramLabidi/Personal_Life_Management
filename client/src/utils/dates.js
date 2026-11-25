/** Local-date helpers shared across pages (week starts on Monday). */

export const startOfDay = (input) => {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const startOfWeek = (input) => {
  const d = startOfDay(input);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
};

export const addDays = (input, n) => {
  const d = new Date(input);
  d.setDate(d.getDate() + n);
  return d;
};

export const addMonths = (input, n) => {
  const d = new Date(input);
  d.setMonth(d.getMonth() + n);
  return d;
};

/** Format a date as YYYY-MM-DD using local time. */
export const iso = (input) => {
  const d = new Date(input);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const isSameDay = (a, b) => iso(a) === iso(b);

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
