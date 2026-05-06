import mongoose from 'mongoose';

const StudyFileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  fileName: {
    type: String,
    required: true,
    trim: true,
  },
  fileType: {
    type: String,
    enum: ['pdf', 'image', 'doc', 'spreadsheet', 'other'],
    default: 'other',
  },
  mimeType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  fileData: {
    type: String, // base64 encoded — max ~10MB
    required: true,
  },

  // AI-generated metadata
  title: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  summary: {
    type: String,
    default: '',
    maxlength: 3000,
  },

  // Organization
  category: {
    type: String,
    enum: ['system-design', 'dsa', 'web-dev', 'database', 'devops', 'math', 'college', 'notes', 'other'],
    default: 'other',
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  isPinned: {
    type: Boolean,
    default: false,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

StudyFileSchema.index({ userId: 1, category: 1, createdAt: -1 });
StudyFileSchema.index({ userId: 1, isPinned: -1, createdAt: -1 });

export default mongoose.models.StudyFile || mongoose.model('StudyFile', StudyFileSchema);
