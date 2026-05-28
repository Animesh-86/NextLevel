import mongoose from 'mongoose';

const CaptureSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['screenshot', 'link', 'text', 'note'],
    required: true,
  },

  // Content
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200,
  },
  rawContent: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
    maxlength: 2000,
  },
  imageData: {
    type: String, // base64 encoded image for screenshots
    default: null,
  },

  // Organization
  category: {
    type: String,
    enum: ['exam', 'project', 'deadline', 'resource', 'personal', 'college', 'work', 'job-posting', 'tutorial', 'code', 'idea', 'other'],
    default: 'other',
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  urgency: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low', 'none'],
    default: 'none',
  },

  // Reminder
  reminderAt: {
    type: Date,
    default: null,
  },
  reminderRepeats: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none',
  },
  isReminderDismissed: {
    type: Boolean,
    default: false,
  },

  // Meta
  isPinned: {
    type: Boolean,
    default: false,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'],
    default: 'active',
  },
  // Vector data for semantic search
  embedding: {
    type: [Number],
    default: [],
    index: false, // Will be used in Atlas Vector Search index
  },
}, { timestamps: true });

// Indexes for fast queries
CaptureSchema.index({ userId: 1, status: 1, createdAt: -1 });
CaptureSchema.index({ userId: 1, category: 1 });
CaptureSchema.index({ userId: 1, urgency: 1 });
CaptureSchema.index({ userId: 1, reminderAt: 1 });
CaptureSchema.index({ userId: 1, isPinned: -1, createdAt: -1 });

export default mongoose.models.Capture || mongoose.model('Capture', CaptureSchema);
