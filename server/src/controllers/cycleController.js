import CycleProfile from '../models/CycleProfile.js';
import { addDays, daysBetween, startOfDay } from '../utils/dates.js';

const ensureProfile = async (userId) => {
  let profile = await CycleProfile.findOne({ user: userId });
  if (!profile) profile = await CycleProfile.create({ user: userId });
  return profile;
};

const phaseFor = (day, cycleLength, periodDuration) => {
  const ovulationDay = cycleLength - 14;
  if (day <= periodDuration) return 'menstrual';
  if (day < ovulationDay - 1) return 'follicular';
  if (day <= ovulationDay + 1) return 'ovulatory';
  return 'luteal';
};

const ENERGY = {
  menstrual: {
    level: 'lower',
    message: 'Lower-energy window. Favour lighter tasks, rest and recovery. This is a general suggestion, not a rule.',
  },
  follicular: {
    level: 'rising',
    message: 'Rising energy. A good time for demanding, growth-oriented tasks (Covey Q2).',
  },
  ovulatory: {
    level: 'peak',
    message: 'Often peak energy. Good time to schedule your most demanding work and social tasks.',
  },
  luteal: {
    level: 'declining',
    message: 'Energy may decline. Balance demanding work with rest and lighter admin tasks.',
  },
};

export const buildCycleView = (profile, now = new Date()) => {
  const base = {
    enabled: profile.enabled,
    hasData: false,
    cycleLength: profile.cycleLength,
    periodDuration: profile.periodDuration,
    periods: profile.periods.map((p) => ({ id: p._id, startDate: p.startDate })),
    overridePhase: profile.overridePhase,
    notes: profile.notes || '',
    disclaimer:
      'Predictions are approximate estimates only, not medical facts. Everyone experiences cycles and energy differently.',
  };

  if (!profile.enabled) return base;

  const starts = profile.periods
    .map((p) => startOfDay(p.startDate))
    .sort((a, b) => a - b);
  if (!starts.length) return base;

  const today = startOfDay(now);
  let cycleStart = null;
  starts.forEach((s) => {
    if (s <= today) cycleStart = s;
  });
  const isProjected = !cycleStart;
  if (!cycleStart) cycleStart = starts[starts.length - 1];

  const cycleDay = Math.max(1, daysBetween(cycleStart, today) + 1);

  let nextPeriod = addDays(cycleStart, profile.cycleLength);
  while (nextPeriod <= today) nextPeriod = addDays(nextPeriod, profile.cycleLength);

  const autoPhase = phaseFor(cycleDay, profile.cycleLength, profile.periodDuration);
  const phase = profile.overridePhase && profile.overridePhase !== 'auto' ? profile.overridePhase : autoPhase;

  return {
    ...base,
    hasData: true,
    projected: isProjected,
    cycleStartDate: cycleStart,
    cycleDay,
    phase,
    autoPhase,
    nextPeriodDate: nextPeriod,
    daysUntilNextPeriod: daysBetween(today, nextPeriod),
    energy: ENERGY[phase] || ENERGY.luteal,
  };
};

export const getCycle = async (req, res) => {
  const profile = await ensureProfile(req.user._id);
  res.json({ profile, view: buildCycleView(profile) });
};

export const updateCycle = async (req, res) => {
  const profile = await ensureProfile(req.user._id);
  const { enabled, cycleLength, periodDuration, overridePhase, notes } = req.body;
  if (enabled !== undefined) profile.enabled = Boolean(enabled);
  if (cycleLength !== undefined) profile.cycleLength = Number(cycleLength);
  if (periodDuration !== undefined) profile.periodDuration = Number(periodDuration);
  if (overridePhase !== undefined) profile.overridePhase = overridePhase;
  if (notes !== undefined) profile.notes = notes;
  await profile.save();
  res.json({ profile, view: buildCycleView(profile) });
};

export const addPeriod = async (req, res) => {
  const profile = await ensureProfile(req.user._id);
  const startDate = req.body.startDate ? startOfDay(req.body.startDate) : startOfDay(new Date());
  profile.periods.push({ startDate });
  profile.periods.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  await profile.save();
  res.status(201).json({ profile, view: buildCycleView(profile) });
};

export const deletePeriod = async (req, res) => {
  const profile = await ensureProfile(req.user._id);
  profile.periods = profile.periods.filter((p) => String(p._id) !== req.params.periodId);
  await profile.save();
  res.json({ profile, view: buildCycleView(profile) });
};
