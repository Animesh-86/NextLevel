import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  module: {
    type: String,
    required: true,
    default: 'General',
  },
  type: {
    type: String,
    enum: ['MCQ', 'MSQ'],
    default: 'MCQ',
  },
  scenario: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: [v => v.length >= 2, 'Must have at least 2 options'],
  },
  answer: {
    type: [Number],
    required: true,
    validate: [v => v.length >= 1, 'Must provide at least one answer index'],
  },
  chooseCount: {
    type: Number,
    default: 1,
  },
  explanation: {
    type: String,
  },
  timesTested: {
    type: Number,
    default: 0,
  },
  timesFailed: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema);
