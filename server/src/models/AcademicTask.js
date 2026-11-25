import mongoose from 'mongoose';

export const ACADEMIC_TASK_TYPES = ['assignment', 'project', 'exam'];

const academicTaskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
    title: { type: String, required: [true, 'Task title is required'], trim: true, maxlength: 200 },
    type: { type: String, enum: ACADEMIC_TASK_TYPES, default: 'assignment' },
    deadline: { type: Date, required: true, index: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    description: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: ['pending', 'done'], default: 'pending' },
  },
  { timestamps: true }
);

export default mongoose.model('AcademicTask', academicTaskSchema);
