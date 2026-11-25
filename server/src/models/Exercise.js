import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    type: { type: String, required: [true, 'Exercise type is required'], trim: true, maxlength: 120 },
    duration: { type: Number, required: true, min: [1, 'Duration must be at least 1 minute'] },
    notes: { type: String, trim: true, maxlength: 400 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Exercise', exerciseSchema);
