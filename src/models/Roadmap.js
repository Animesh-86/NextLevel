import mongoose from 'mongoose';

const TaskItem = new mongoose.Schema({
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
}, { _id: true });

const MilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  targetDate: { type: Date, default: null },
  status: { type: String, enum: ['not-started', 'in-progress', 'completed'], default: 'not-started' },
  order: { type: Number, default: 0 },
  tasks: [TaskItem],
}, { _id: true });

const RoadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, default: '', maxlength: 500 },
  category: {
    type: String,
    enum: ['dsa', 'system-design', 'web-dev', 'devops', 'project', 'career', 'ml-ai', 'other'],
    default: 'other',
  },
  startDate: { type: Date, default: Date.now },
  targetDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'completed', 'paused', 'abandoned'], default: 'active' },
  milestones: [MilestoneSchema],
  overallProgress: { type: Number, default: 0, min: 0, max: 100 },
  color: { type: String, default: '#ffffff' },
  isTemplate: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-calculate progress before save
RoadmapSchema.pre('save', function () {
  if (this.milestones.length === 0) {
    this.overallProgress = 0;
  } else {
    let totalTasks = 0;
    let doneTasks = 0;
    this.milestones.forEach(m => {
      if (m.tasks.length > 0) {
        totalTasks += m.tasks.length;
        doneTasks += m.tasks.filter(t => t.done).length;
      } else {
        totalTasks += 1;
        if (m.status === 'completed') doneTasks += 1;
      }
    });
    this.overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  }
  if (this.overallProgress === 100 && this.status === 'active') {
    this.status = 'completed';
  }
});

export default mongoose.models.Roadmap || mongoose.model('Roadmap', RoadmapSchema);
