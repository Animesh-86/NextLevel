import mongoose from 'mongoose';

const SavedLinkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  url: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 500 },
  category: {
    type: String,
    enum: ['tutorial', 'article', 'documentation', 'tool', 'job-posting', 'video', 'course', 'github', 'other'],
    default: 'other',
  },
  tags: [{ type: String, trim: true, lowercase: true }],
  favicon: { type: String, default: '' },
  isPinned: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

SavedLinkSchema.index({ userId: 1, category: 1, createdAt: -1 });

export default mongoose.models.SavedLink || mongoose.model('SavedLink', SavedLinkSchema);
