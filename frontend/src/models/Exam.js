import mongoose from 'mongoose';

const ExamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an exam title'],
    unique: true,
  },
  description: {
    type: String,
  },
  timeLimit: {
    type: Number, // In minutes
    default: 60,
  },
  passPercentage: {
    type: Number,
    default: 75,
  }
}, { timestamps: true });

export default mongoose.models.Exam || mongoose.model('Exam', ExamSchema);
