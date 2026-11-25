import mongoose from 'mongoose';

const savingsTxSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
    amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than 0'] },
    date: { type: Date, required: true, default: Date.now, index: true },
    note: { type: String, trim: true, maxlength: 400 },
    goal: { type: mongoose.Schema.Types.ObjectId, ref: 'SavingsGoal', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('SavingsTx', savingsTxSchema);
