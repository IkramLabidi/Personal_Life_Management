import mongoose from 'mongoose';

const financeProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    initialBalance: { type: Number, default: 0 },
    currency: { type: String, default: 'TND', trim: true, maxlength: 8 },
  },
  { timestamps: true }
);

export default mongoose.model('FinanceProfile', financeProfileSchema);
