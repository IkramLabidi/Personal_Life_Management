import mongoose from 'mongoose';

export const LIFE_ROLES = [
  'Student',
  'Health',
  'Personal Development',
  'Family',
  'Personal Life',
  'Other',
];

export const QUADRANTS = ['Q1', 'Q2', 'Q3', 'Q4'];

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Task title is required'], trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 800 },
    date: { type: Date, required: true, default: Date.now, index: true },
    time: { type: String, trim: true, maxlength: 10 },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    lifeRole: { type: String, enum: LIFE_ROLES, default: 'Other' },
    quadrant: { type: String, enum: QUADRANTS, default: 'Q2' },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
