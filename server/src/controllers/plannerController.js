import WeeklyReview from '../models/WeeklyReview.js';
import { startOfWeek, isoDate } from '../utils/dates.js';

const resolveWeek = (req) => req.query.week || req.body.week || isoDate(startOfWeek(new Date()));

export const getReview = async (req, res) => {
  const week = resolveWeek(req);
  const review = await WeeklyReview.findOne({ user: req.user._id, week });
  res.json(review || { week, priorities: '', review: '' });
};

export const saveReview = async (req, res) => {
  const week = resolveWeek(req);
  const { priorities, review } = req.body;
  const doc = await WeeklyReview.findOneAndUpdate(
    { user: req.user._id, week },
    { priorities: priorities ?? '', review: review ?? '' },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
  res.json(doc);
};
