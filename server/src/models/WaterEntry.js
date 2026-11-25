import mongoose from 'mongoose';

const waterEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    amount: { type: Number, required: true, min: [1, 'Amount must be greater than 0'] },
  },
  { timestamps: true }
);

export default mongoose.model('WaterEntry', waterEntrySchema);
