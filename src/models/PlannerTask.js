import mongoose from 'mongoose';

const PlannerTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    default: '',
    maxlength: 1000,
  },

  // Scheduling
  scheduledDate: {
    type: Date,
    required: true,
    index: true,
  },
  startTime: {
    type: String, // 'HH:MM' format
    default: null,
  },
  endTime: {
    type: String,
    default: null,
  },
  duration: {
    type: Number, // minutes
    default: 30,
  },

  // Organization
  category: {
    type: String,
    enum: ['study', 'revision', 'practice', 'project', 'assignment', 'exam-prep', 'other'],
    default: 'study',
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done', 'skipped'],
    default: 'todo',
  },

  // Links to other NextLevel features
  linkedCaptureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Capture',
    default: null,
  },
  linkedFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyFile',
    default: null,
  },

  // Recurrence
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurPattern: {
    type: String,
    enum: ['none', 'daily', 'weekdays', 'weekly'],
    default: 'none',
  },
}, { timestamps: true });

PlannerTaskSchema.index({ userId: 1, scheduledDate: 1 });
PlannerTaskSchema.index({ userId: 1, status: 1 });

export default mongoose.models.PlannerTask || mongoose.model('PlannerTask', PlannerTaskSchema);
