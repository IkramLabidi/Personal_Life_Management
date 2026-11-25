import mongoose from 'mongoose';
import HealthProfile from '../models/HealthProfile.js';
import WaterEntry from '../models/WaterEntry.js';
import { startOfDay, endOfDay, startOfWeek, addDays, isoDate } from '../utils/dates.js';

const ensureProfile = async (userId) => {
  let profile = await HealthProfile.findOne({ user: userId });
  if (!profile) profile = await HealthProfile.create({ user: userId });
  return profile;
};

export const getWaterSettings = async (req, res) => {
  res.json(await ensureProfile(req.user._id));
};

export const updateWaterSettings = async (req, res) => {
  const profile = await ensureProfile(req.user._id);
  if (req.body.waterGoalMl !== undefined) profile.waterGoalMl = Number(req.body.waterGoalMl);
  await profile.save();
  res.json(profile);
};

export const waterSummary = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const profile = await ensureProfile(req.user._id);
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfDay(addDays(weekStart, 6));

  const [todayAgg, weekAgg] = await Promise.all([
    WaterEntry.aggregate([
      { $match: { user: userId, date: { $gte: startOfDay(today), $lte: endOfDay(today) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    WaterEntry.aggregate([
      { $match: { user: userId, date: { $gte: weekStart, $lte: weekEnd } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  const consumed = todayAgg[0]?.total || 0;
  const goal = profile.waterGoalMl;
  const byDay = new Map(weekAgg.map((d) => [d._id, d.total]));

  const weekly = Array.from({ length: 7 }).map((_, i) => {
    const day = addDays(weekStart, i);
    return { date: isoDate(day), amount: byDay.get(isoDate(day)) || 0, goal };
  });

  res.json({
    goal,
    consumed,
    remaining: Math.max(0, goal - consumed),
    percent: goal ? Math.min(100, Math.round((consumed / goal) * 100)) : 0,
    weekly,
  });
};
