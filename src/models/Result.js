import mongoose from 'mongoose';

const ResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  scorePercent: {
    type: Number,
    required: true,
  },
  correctCount: {
    type: Number,
    required: true,
  },
  wrongCount: {
    type: Number,
    required: true,
  },
  skippedCount: {
    type: Number,
    required: true,
  },
  totalCount: {
    type: Number,
    required: true,
  },
  passed: {
    type: Boolean,
    required: true,
  },
  timeTaken: {
    type: Number, // seconds
    default: 0,
  },
  userAnswers: {
    type: Object, // Stores map of questionId -> array of selected option indices
  }
}, { timestamps: true });

ResultSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Result || mongoose.model('Result', ResultSchema);

