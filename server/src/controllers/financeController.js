import mongoose from 'mongoose';
import FinanceProfile from '../models/FinanceProfile.js';
import Transaction from '../models/Transaction.js';
import SavingsTx from '../models/SavingsTx.js';
import SavingsGoal from '../models/SavingsGoal.js';
import { round2 } from '../utils/dates.js';

const ensureProfile = async (userId) => {
  let profile = await FinanceProfile.findOne({ user: userId });
  if (!profile) profile = await FinanceProfile.create({ user: userId });
  return profile;
};

export const getFinanceProfile = async (req, res) => {
  const profile = await ensureProfile(req.user._id);
  res.json(profile);
};

export const updateFinanceProfile = async (req, res) => {
  const profile = await ensureProfile(req.user._id);
  if (req.body.initialBalance !== undefined) {
    profile.initialBalance = Number(req.body.initialBalance) || 0;
  }
  if (req.body.currency !== undefined) profile.currency = req.body.currency;
  await profile.save();
  res.json(profile);
};

export const buildFinanceSummary = async (rawUserId) => {
  const userId = new mongoose.Types.ObjectId(rawUserId);
  const profile = await ensureProfile(rawUserId);

  const [txAgg, savAgg, monthlyAgg, catAgg] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    SavingsTx.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: {
            ym: { $dateToString: { format: '%Y-%m', date: '$date' } },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.ym': 1 } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
  ]);

  const totalIncome = round2(txAgg.find((x) => x._id === 'income')?.total || 0);
  const totalExpense = round2(txAgg.find((x) => x._id === 'expense')?.total || 0);
  const totalDeposits = round2(savAgg.find((x) => x._id === 'deposit')?.total || 0);
  const totalWithdrawals = round2(savAgg.find((x) => x._id === 'withdrawal')?.total || 0);

  const savingsBalance = round2(totalDeposits - totalWithdrawals);
  const balance = round2(
    profile.initialBalance + totalIncome - totalExpense - totalDeposits + totalWithdrawals
  );

  const monthMap = new Map();
  monthlyAgg.forEach((row) => {
    const ym = row._id.ym;
    if (!monthMap.has(ym)) monthMap.set(ym, { month: ym, income: 0, expense: 0 });
    monthMap.get(ym)[row._id.type] = round2(row.total);
  });

  return {
    currency: profile.currency,
    initialBalance: profile.initialBalance,
    balance,
    totalIncome,
    totalExpense,
    savingsBalance,
    totalDeposits,
    totalWithdrawals,
    monthly: Array.from(monthMap.values()),
    categoryBreakdown: catAgg.map((c) => ({ category: c._id || 'other', total: round2(c.total) })),
  };
};

export const summary = async (req, res) => {
  res.json(await buildFinanceSummary(req.user._id));
};

export const listSavingsGoals = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const [goals, sums] = await Promise.all([
    SavingsGoal.find({ user: req.user._id }).sort({ createdAt: -1 }),
    SavingsTx.aggregate([
      { $match: { user: userId, goal: { $ne: null } } },
      {
        $group: {
          _id: '$goal',
          deposited: { $sum: { $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0] } },
          withdrawn: { $sum: { $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0] } },
        },
      },
    ]),
  ]);

  const sumMap = new Map(sums.map((s) => [String(s._id), round2(s.deposited - s.withdrawn)]));
  res.json(
    goals.map((g) => ({
      ...g.toObject(),
      saved: sumMap.get(String(g._id)) || 0,
    }))
  );
};
