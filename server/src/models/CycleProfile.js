import mongoose from 'mongoose';

const periodSchema = new mongoose.Schema(
  {
    startDate: { type: Date, required: true },
  },
  { _id: true }
);

const cycleProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    cycleLength: { type: Number, default: 28, min: 15, max: 60 },
    periodDuration: { type: Number, default: 5, min: 1, max: 14 },
    periods: { type: [periodSchema], default: [] },
    overridePhase: { type: String, enum: ['auto', 'menstrual', 'follicular', 'ovulatory', 'luteal'], default: 'auto' },
    notes: { type: String, trim: true, maxlength: 600, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('CycleProfile', cycleProfileSchema);
