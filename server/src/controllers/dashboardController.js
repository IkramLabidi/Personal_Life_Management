import mongoose from 'mongoose';
import Task from '../models/Task.js';
import AcademicTask from '../models/AcademicTask.js';
import WaterEntry from '../models/WaterEntry.js';
import HealthProfile from '../models/HealthProfile.js';
import StudySession from '../models/StudySession.js';
import Exercise from '../models/Exercise.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Goal from '../models/Goal.js';
import CycleProfile from '../models/CycleProfile.js';
import { buildFinanceSummary } from './financeController.js';
import { buildCycleView } from './cycleController.js';
import { startOfDay, endOfDay, startOfWeek, addDays } from '../utils/dates.js';
import { round2 } from '../utils/dates.js';

export const dashboard = async (req, res) => {
  const userId = req.user._id;
  const oid = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfDay(addDays(weekStart, 6));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const [
    finance,
    todayTasks,
    weekTasks,
    deadlines,
    waterAgg,
    healthProfile,
    studyAgg,
    exerciseDone,
    exerciseTotal,
    events,
    goals,
    cycleProfile,
  ] = await Promise.all([
    buildFinanceSummary(userId),
    Task.find({ user: userId, date: { $gte: dayStart, $lte: dayEnd } })
      .sort({ completed: 1, time: 1 })
      .limit(8),
    Task.find({ user: userId, date: { $gte: weekStart, $lte: weekEnd } }),
    AcademicTask.find({ user: userId, status: 'pending', deadline: { $gte: dayStart } })
      .populate('subject', 'name color')
      .sort({ deadline: 1 })
      .limit(5),
    WaterEntry.aggregate([
      { $match: { user: oid, date: { $gte: dayStart, $lte: dayEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    HealthProfile.findOne({ user: userId }),
    StudySession.aggregate([
      { $match: { user: oid, date: { $gte: weekStart, $lte: weekEnd } } },
      { $group: { _id: null, minutes: { $sum: '$duration' } } },
    ]),
    Exercise.countDocuments({ user: userId, completed: true, date: { $gte: weekStart, $lte: weekEnd } }),
    Exercise.countDocuments({ user: userId, date: { $gte: weekStart, $lte: weekEnd } }),
    CalendarEvent.find({ user: userId, date: { $gte: dayStart } }).sort({ date: 1 }).limit(5),
    Goal.find({ user: userId, status: 'active' }).sort({ deadline: 1 }),
    CycleProfile.findOne({ user: userId }),
  ]);

  const doneTasks = weekTasks.filter((t) => t.completed || t.status === 'done').length;
  const waterGoal = healthProfile?.waterGoalMl || 2000;
  const waterConsumed = waterAgg[0]?.total || 0;

  const monthlyGoals = goals.filter(
    (g) =>
      g.type === 'monthly' ||
      (g.deadline && new Date(g.deadline) >= monthStart && new Date(g.deadline) <= monthEnd)
  );
  const goalsAvg =
    monthlyGoals.length > 0
      ? Math.round(monthlyGoals.reduce((s, g) => s + g.progress, 0) / monthlyGoals.length)
      : 0;

  const monthlyIncome = finance.monthly.find(
    (m) => m.month === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );

  res.json({
    finance: {
      balance: finance.balance,
      savingsBalance: finance.savingsBalance,
      currency: finance.currency,
      monthlyIncome: monthlyIncome?.income || 0,
      monthlyExpense: monthlyIncome?.expense || 0,
    },
    tasks: {
      today: todayTasks,
      weeklyDone: doneTasks,
      weeklyTotal: weekTasks.length,
      weeklyPercent: weekTasks.length ? Math.round((doneTasks / weekTasks.length) * 100) : 0,
    },
    deadlines: deadlines.map((d) => ({
      id: d._id,
      title: d.title,
      type: d.type,
      deadline: d.deadline,
      priority: d.priority,
      subject: d.subject,
    })),
    water: {
      consumed: waterConsumed,
      goal: waterGoal,
      percent: waterGoal ? Math.min(100, Math.round((waterConsumed / waterGoal) * 100)) : 0,
    },
    study: { weeklyHours: round2((studyAgg[0]?.minutes || 0) / 60) },
    exercise: {
      done: exerciseDone,
      total: exerciseTotal,
      percent: exerciseTotal ? Math.round((exerciseDone / exerciseTotal) * 100) : 0,
    },
    events: events.map((e) => ({
      id: e._id,
      title: e.title,
      date: e.date,
      startTime: e.startTime,
      category: e.category,
    })),
    goals: {
      monthlyCount: monthlyGoals.length,
      averageProgress: goalsAvg,
      active: goals.slice(0, 5).map((g) => ({
        id: g._id,
        title: g.title,
        progress: g.progress,
        category: g.category,
        deadline: g.deadline,
      })),
    },
    cycle: cycleProfile ? buildCycleView(cycleProfile) : { enabled: false },
  });
};
