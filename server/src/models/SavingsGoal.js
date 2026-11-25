import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Goal name is required'], trim: true, maxlength: 120 },
    target: { type: Number, required: true, min: [1, 'Target must be greater than 0'] },
    deadline: { type: Date, default: null },
    note: { type: String, trim: true, maxlength: 400 },
  },
  { timestamps: true }
);

export default mongoose.model('SavingsGoal', savingsGoalSchema);
