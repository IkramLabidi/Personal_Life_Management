import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Subject name is required'], trim: true, maxlength: 120 },
    code: { type: String, trim: true, maxlength: 40 },
    instructor: { type: String, trim: true, maxlength: 120 },
    color: { type: String, trim: true, default: '#9BB2C9', maxlength: 20 },
  },
  { timestamps: true }
);

export default mongoose.model('Subject', subjectSchema);
