// Date helpers. The server and client run on the same machine, so local time is used
// consistently for day/week/month grouping.

export const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/** Monday-based start of week. */
export const startOfWeek = (date) => {
  const d = startOfDay(date);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
};

export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const pad = (n) => String(n).padStart(2, '0');

/** Local YYYY-MM-DD. */
export const isoDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Local YYYY-MM. */
export const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

export const isSameDay = (a, b) => isoDate(a) === isoDate(b);

export const daysBetween = (a, b) =>
  Math.round((startOfDay(b) - startOfDay(a)) / (1000 * 60 * 60 * 24));

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
