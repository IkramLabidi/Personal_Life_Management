import mongoose from 'mongoose';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const mealSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    dayOfWeek: { type: String, trim: true },
    type: { type: String, enum: MEAL_TYPES, required: true },
    name: { type: String, required: [true, 'Meal name is required'], trim: true, maxlength: 160 },
    ingredients: { type: String, trim: true, maxlength: 800 },
    notes: { type: String, trim: true, maxlength: 800 },
    status: { type: String, enum: ['planned', 'consumed'], default: 'planned' },
  },
  { timestamps: true }
);

export default mongoose.model('Meal', mealSchema);
