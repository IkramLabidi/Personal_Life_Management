import mongoose from 'mongoose';

export const EXPENSE_CATEGORIES = [
  'food',
  'transportation',
  'education',
  'shopping',
  'health',
  'entertainment',
  'personal',
  'other',
];

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than 0'] },
    date: { type: Date, required: true, default: Date.now, index: true },
    category: { type: String, enum: EXPENSE_CATEGORIES, default: 'other' },
    source: { type: String, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 400 },
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
