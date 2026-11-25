import mongoose from 'mongoose';

const weeklyReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    week: { type: String, required: true },
    priorities: { type: String, trim: true, maxlength: 2000, default: '' },
    review: { type: String, trim: true, maxlength: 4000, default: '' },
  },
  { timestamps: true }
);

weeklyReviewSchema.index({ user: 1, week: 1 }, { unique: true });

export default mongoose.model('WeeklyReview', weeklyReviewSchema);
