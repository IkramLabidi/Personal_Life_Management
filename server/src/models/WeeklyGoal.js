import mongoose from 'mongoose';

const weeklyGoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    week: { type: String, required: true, index: true },
    title: { type: String, required: [true, 'Goal title is required'], trim: true, maxlength: 200 },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('WeeklyGoal', weeklyGoalSchema);
