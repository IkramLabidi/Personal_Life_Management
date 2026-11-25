import mongoose from 'mongoose';
import StudySession from '../models/StudySession.js';
import AcademicTask from '../models/AcademicTask.js';
import { startOfWeek, addDays, endOfDay, isoDate, round2 } from '../utils/dates.js';

export const studyStats = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfDay(addDays(weekStart, 6));

  const [totalAgg, weeklyAgg, completed, upcoming, overdue, taskTotal] = await Promise.all([
    StudySession.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, minutes: { $sum: '$duration' } } },
    ]),
    StudySession.aggregate([
      { $match: { user: userId, date: { $gte: weekStart, $lte: weekEnd } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          minutes: { $sum: '$duration' },
        },
      },
    ]),
    AcademicTask.countDocuments({ user: req.user._id, status: 'done' }),
    AcademicTask.countDocuments({ user: req.user._id, status: 'pending', deadline: { $gte: now } }),
    AcademicTask.countDocuments({ user: req.user._id, status: 'pending', deadline: { $lt: now } }),
    AcademicTask.countDocuments({ user: req.user._id }),
  ]);

  const totalMinutes = totalAgg[0]?.minutes || 0;
  const byDay = new Map(weeklyAgg.map((d) => [d._id, d.minutes]));
  const weekly = Array.from({ length: 7 }).map((_, i) => {
    const day = addDays(weekStart, i);
    return { date: isoDate(day), hours: round2((byDay.get(isoDate(day)) || 0) / 60) };
  });

  res.json({
    totalHours: round2(totalMinutes / 60),
    weeklyHours: round2(weeklyAgg.reduce((sum, d) => sum + d.minutes, 0) / 60),
    weekly,
    tasks: { completed, upcoming, overdue, total: taskTotal },
  });
};
