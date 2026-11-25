import mongoose from 'mongoose';

export const EVENT_CATEGORIES = ['Academic', 'Personal', 'Health', 'Financial', 'Other'];

const calendarEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Event title is required'], trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, trim: true, maxlength: 10 },
    endTime: { type: String, trim: true, maxlength: 10 },
    category: { type: String, enum: EVENT_CATEGORIES, default: 'Other' },
    reminder: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('CalendarEvent', calendarEventSchema);
