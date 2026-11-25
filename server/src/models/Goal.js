import mongoose from 'mongoose';

export const GOAL_CATEGORIES = ['Finance', 'Education', 'Health', 'Personal Development', 'Other'];
export const GOAL_TYPES = ['monthly', 'yearly', 'short', 'long'];

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Goal title is required'], trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    category: { type: String, enum: GOAL_CATEGORIES, default: 'Other' },
    type: { type: String, enum: GOAL_TYPES, default: 'short' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    deadline: { type: Date, default: null },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Goal', goalSchema);
