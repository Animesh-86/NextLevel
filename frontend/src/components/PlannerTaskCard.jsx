'use client';
import Link from 'next/link';
import { CheckCircle2, Circle, Clock, Trash2, GripVertical, FileText, Inbox, Play, Mic } from 'lucide-react';

const priorityColors = {
  high: 'var(--error)',
  medium: 'var(--brand)',
  low: 'var(--text-muted)',
};

const statusIcons = {
  todo: Circle,
  'in-progress': Clock,
  completed: CheckCircle2,
  skipped: Circle,
};

export default function PlannerTaskCard({ task, onStatusToggle, onDelete }) {
  const StatusIcon = statusIcons[task.status] || Circle;
  const isDone = task.status === 'completed';
  const isSkipped = task.status === 'skipped';

  const nextStatus = () => {
    return task.status === 'completed' ? 'todo' : 'completed';
  };

  return (
    <div
      className={`planner-task-card ${isDone ? 'done' : ''} ${isSkipped ? 'skipped' : ''}`}
      style={{ borderLeftColor: priorityColors[task.priority] || priorityColors.medium }}
    >
      <button
        className="planner-task-status-btn"
        onClick={() => onStatusToggle(task.id || task._id, nextStatus())}
        title={`Mark as ${nextStatus()}`}
      >
        <StatusIcon
          size={16}
          style={{
            color: isDone ? 'var(--text-primary)' : priorityColors[task.priority],
            fill: isDone ? 'var(--text-primary)' : 'transparent',
          }}
        />
      </button>

      <div className="planner-task-content">
        <div className="planner-task-title">
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
          {task.category === 'mock-interview' && (
            <Link
              href="/interview"
              className="planner-link-badge"
              style={{ textDecoration: 'none', background: 'rgba(245, 166, 35, 0.15)', color: '#f5a623', border: '1px solid rgba(245, 166, 35, 0.3)' }}
              title="Open AI Mock Interview"
            >
              <Mic size={10} /> Interview
            </Link>
          )}
          {task.category === 'practice-exam' && (
            <Link
              href="/test"
              className="planner-link-badge"
              style={{ textDecoration: 'none', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}
              title="Open Focus Test"
            >
              <Play size={10} /> Focus Exam
            </Link>
          )}
          {task.linkedFileId && <span className="planner-link-badge"><FileText size={10} /> File</span>}
          {task.linkedCaptureId && <span className="planner-link-badge"><Inbox size={10} /> Capture</span>}
        </div>
      </div>

      <div className="planner-task-actions">
        <button
          className="icon-btn planner-task-play"
          onClick={() => {
            if (window.startFocusTimer) {
              window.startFocusTimer(task.duration || 25, task.id || task._id);
            }
          }}
          title="Start Focus Timer"
        >
          <Play size={12} />
        </button>
        <button
          className="icon-btn planner-task-delete"
          onClick={() => onDelete(task.id || task._id)}
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
