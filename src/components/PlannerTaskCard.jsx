'use client';
import { CheckCircle2, Circle, Clock, Trash2, GripVertical, FileText, Inbox } from 'lucide-react';

const priorityColors = {
  high: '#ef4444',
  medium: '#eab308',
  low: '#3b82f6',
};

const statusIcons = {
  todo: Circle,
  'in-progress': Clock,
  done: CheckCircle2,
  skipped: Circle,
};

const categoryEmojis = {
  study: '📖',
  revision: '🔄',
  practice: '💻',
  project: '🚀',
  assignment: '📝',
  'exam-prep': '📚',
  other: '📌',
};

export default function PlannerTaskCard({ task, onStatusToggle, onDelete }) {
  const StatusIcon = statusIcons[task.status] || Circle;
  const isDone = task.status === 'done';
  const isSkipped = task.status === 'skipped';

  const nextStatus = () => {
    const cycle = { todo: 'in-progress', 'in-progress': 'done', done: 'todo', skipped: 'todo' };
    return cycle[task.status] || 'todo';
  };

  return (
    <div
      className={`planner-task-card ${isDone ? 'done' : ''} ${isSkipped ? 'skipped' : ''}`}
      style={{ borderLeftColor: priorityColors[task.priority] || priorityColors.medium }}
    >
      <button
        className="planner-task-status-btn"
        onClick={() => onStatusToggle(task._id, nextStatus())}
        title={`Mark as ${nextStatus()}`}
      >
        <StatusIcon
          size={16}
          style={{
            color: isDone ? '#22c55e' : priorityColors[task.priority],
            fill: isDone ? '#22c55e' : 'transparent',
          }}
        />
      </button>

      <div className="planner-task-content">
        <div className="planner-task-title">
          <span>{categoryEmojis[task.category] || '📌'}</span>
          <span className={isDone || isSkipped ? 'line-through' : ''}>{task.title}</span>
        </div>
        {task.startTime && (
          <div className="planner-task-time">
            <Clock size={10} /> {task.startTime}{task.endTime ? ` – ${task.endTime}` : ''}
          </div>
        )}
        {task.duration && !task.startTime && (
          <div className="planner-task-time">
            <Clock size={10} /> {task.duration}min
          </div>
        )}
        <div className="planner-task-badges">
          {task.linkedFileId && <span className="planner-link-badge"><FileText size={10} /> File</span>}
          {task.linkedCaptureId && <span className="planner-link-badge"><Inbox size={10} /> Capture</span>}
        </div>
      </div>

      <button
        className="icon-btn planner-task-delete"
        onClick={() => onDelete(task._id)}
        title="Delete"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
