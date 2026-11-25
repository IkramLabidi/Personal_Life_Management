import mongoose from 'mongoose';

const journalEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    reflection: { type: String, trim: true, maxlength: 4000, default: '' },
    achievements: { type: String, trim: true, maxlength: 2000, default: '' },
    mood: { type: String, enum: ['great', 'good', 'neutral', 'low', 'bad', ''], default: 'neutral' },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('JournalEntry', journalEntrySchema);
