import mongoose from 'mongoose';

const healthProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    waterGoalMl: { type: Number, default: 2000, min: 250, max: 10000 },
  },
  { timestamps: true }
);

export default mongoose.model('HealthProfile', healthProfileSchema);
