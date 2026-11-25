import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import SavingsTx from '../models/SavingsTx.js';
import Task from '../models/Task.js';
import StudySession from '../models/StudySession.js';
import Exercise from '../models/Exercise.js';
import WaterEntry from '../models/WaterEntry.js';
import Goal from '../models/Goal.js';
import { endOfDay, round2 } from '../utils/dates.js';

/** GET /api/report/monthly?month=YYYY-MM */
export const monthlyReport = async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const [year, m] = month.split('-').map(Number);
  if (!year || !m || m < 1 || m > 12) {
    return res.status(400).json({ message: 'Invalid month, expected format YYYY-MM' });
  }

  const start = new Date(year, m - 1, 1);
  const end = endOfDay(new Date(year, m, 0));
  const userId = req.user._id;
  const oid = new mongoose.Types.ObjectId(userId);

  const [
    txAgg,
    catAgg,
    savingsAgg,
    tasksInMonth,
    studyAgg,
    exerciseAgg,
    waterAggDiag,
    goalsInMonth,
  ] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: oid, date: { $gte: start, $lte: end } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { user: oid, type: 'expense', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
    SavingsTx.aggregate([
      { $match: { user: oid, date: { $gte: start, $lte: end } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Task.find({ user: userId, date: { $gte: start, $lte: end } }),
    StudySession.aggregate([
      { $match: { user: oid, date: { $gte: start, $lte: end } } },
      { $group: { _id: null, minutes: { $sum: '$duration' } } },
    ]),
    Exercise.aggregate([
      { $match: { user: oid, date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } },
          minutes: { $sum: '$duration' },
        },
      },
    ]),
    WaterEntry.aggregate([
      { $match: { user: oid, date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' },
        },
      },
    ]),
    Goal.find({
      user: userId,
      $or: [
        { type: 'monthly' },
        { deadline: { $gte: start, $lte: end } },
      ],
    }),
  ]);

  const income = round2(txAgg.find((x) => x._id === 'income')?.total || 0);
  const expense = round2(txAgg.find((x) => x._id === 'expense')?.total || 0);
  const deposited = round2(savingsAgg.find((x) => x._id === 'deposit')?.total || 0);
  const withdrawn = round2(savingsAgg.find((x) => x._id === 'withdrawal')?.total || 0);
  const taskDone = tasksInMonth.filter((t) => t.completed || t.status === 'done').length;
  const avgWater = waterAggDiag.length
    ? Math.round(waterAggDiag.reduce((s, d) => s + d.total, 0) / waterAggDiag.length)
    : 0;
  const ex = exerciseAgg[0] || { total: 0, completed: 0, minutes: 0 };

  res.json({
    month,
    finance: {
      income,
      expense,
      net: round2(income - expense),
      savingsDeposited: deposited,
      savingsWithdrawn: withdrawn,
      savingsNet: round2(deposited - withdrawn),
      categoryBreakdown: catAgg.map((c) => ({ category: c._id || 'other', total: round2(c.total) })),
    },
    tasks: {
      total: tasksInMonth.length,
      completed: taskDone,
      percent: tasksInMonth.length ? Math.round((taskDone / tasksInMonth.length) * 100) : 0,
    },
    study: { hours: round2((studyAgg[0]?.minutes || 0) / 60) },
    exercise: {
      sessions: ex.total,
      completed: ex.completed,
      hours: round2(ex.minutes / 60),
    },
    water: { averageDailyMl: avgWater, daysTracked: waterAggDiag.length },
    goals: {
      count: goalsInMonth.length,
      averageProgress: goalsInMonth.length
        ? Math.round(goalsInMonth.reduce((s, g) => s + g.progress, 0) / goalsInMonth.length)
        : 0,
      completed: goalsInMonth.filter((g) => g.status === 'completed').length,
    },
  });
};
