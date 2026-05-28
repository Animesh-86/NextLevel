import mongoose from 'mongoose';

const TimelineEntry = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  event: { type: String, required: true },
  notes: { type: String, default: '' },
}, { _id: true });

const ApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['full-time', 'internship', 'contract', 'freelance'],
    default: 'full-time',
  },
  status: {
    type: String,
    enum: ['bookmarked', 'applied', 'screening', 'technical', 'onsite', 'offer', 'accepted', 'rejected', 'ghosted'],
    default: 'bookmarked',
  },
  appliedDate: { type: Date, default: null },
  salary: { type: String, default: '' },
  location: { type: String, default: '' },
  url: { type: String, default: '' },
  notes: { type: String, default: '', maxlength: 2000 },
  linkedFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyFile', default: null },
  linkedCaptureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Capture', default: null },
  timeline: [TimelineEntry],
}, { timestamps: true });

ApplicationSchema.index({ userId: 1, status: 1 });
ApplicationSchema.index({ userId: 1, company: 1 });

export default mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
