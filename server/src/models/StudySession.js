import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
    date: { type: Date, required: true, default: Date.now, index: true },
    startTime: { type: String, trim: true, maxlength: 10 },
    duration: { type: Number, required: true, min: [1, 'Duration must be at least 1 minute'] },
    objectives: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

export default mongoose.model('StudySession', studySessionSchema);
