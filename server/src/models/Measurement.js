import mongoose from 'mongoose';

const measurementSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    weightKg: { type: Number, required: [true, 'Weight is required'], min: 1, max: 500 },
    heightM: { type: Number, required: [true, 'Height is required'], min: 0.5, max: 2.8 },
    bmi: { type: Number },
    note: { type: String, trim: true, maxlength: 400 },
  },
  { timestamps: true }
);

measurementSchema.pre('save', function computeBmi(next) {
  if (this.weightKg && this.heightM) {
    this.bmi = Number((this.weightKg / (this.heightM * this.heightM)).toFixed(1));
  }
  next();
});

measurementSchema.pre('findOneAndUpdate', function computeBmiOnUpdate(next) {
  const update = this.getUpdate() || {};
  const weight = update.weightKg ?? update.$set?.weightKg;
  const height = update.heightM ?? update.$set?.heightM;
  if (weight && height) {
    const bmi = Number((weight / (height * height)).toFixed(1));
    if (update.$set) update.$set.bmi = bmi;
    else update.bmi = bmi;
  }
  next();
});

export default mongoose.model('Measurement', measurementSchema);
