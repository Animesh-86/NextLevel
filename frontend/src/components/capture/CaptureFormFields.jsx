'use client';

import { Clock, Tag } from 'lucide-react';

export const CAPTURE_CATEGORIES = [
  { value: 'exam', label: 'Exam' },
  { value: 'project', label: 'Project' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'resource', label: 'Resource' },
  { value: 'personal', label: 'Personal' },
  { value: 'college', label: 'College' },
  { value: 'work', label: 'Work' },
  { value: 'job-posting', label: 'Job Posting' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'code', label: 'Code' },
  { value: 'idea', label: 'Idea' },
  { value: 'other', label: 'Other' },
];

export const CAPTURE_URGENCIES = [
  { value: 'critical', label: 'Critical', color: 'var(--urgency-critical)' },
  { value: 'high', label: 'High', color: 'var(--urgency-high)' },
  { value: 'medium', label: 'Medium', color: 'var(--urgency-medium)' },
  { value: 'low', label: 'Low', color: 'var(--urgency-low)' },
  { value: 'none', label: 'None', color: 'var(--text-muted)' },
];

export default function CaptureFormFields({
  title,
  setTitle,
  description,
  setDescription,
  category,
  setCategory,
  urgency,
  setUrgency,
  tags,
  setTags,
  reminderAt,
  setReminderAt,
  reminderRepeats,
  setReminderRepeats
}) {
  return (
    <>
      {/* Title */}
      <div className="capture-field">
        <label className="auth-label">Title</label>
        <input
          className="input"
          type="text"
          placeholder="What's this about?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Description */}
      <div className="capture-field">
        <label className="auth-label">Notes / Description</label>
        <textarea
          className="textarea"
          placeholder="Add any additional context..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      {/* Category + Urgency row */}
      <div className="capture-field-row">
        <div className="capture-field" style={{ flex: 1 }}>
          <label className="auth-label">Category</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CAPTURE_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="capture-field" style={{ flex: 1 }}>
          <label className="auth-label">Urgency</label>
          <select className="select" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
            {CAPTURE_URGENCIES.map(u => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div className="capture-field">
        <label className="auth-label">
          <Tag size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Tags
        </label>
        <input
          className="input"
          type="text"
          placeholder="exam, important, react (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      {/* Reminder (Fixed Date Picker Style) */}
      <div className="capture-field-row">
        <div className="capture-field" style={{ flex: 2 }}>
          <label className="auth-label">
            <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Remind me at
          </label>
          <input
            className="input"
            type="datetime-local"
            style={{ colorScheme: 'dark', cursor: 'pointer' }}
            value={reminderAt}
            onChange={(e) => setReminderAt(e.target.value)}
          />
        </div>
        <div className="capture-field" style={{ flex: 1 }}>
          <label className="auth-label">Repeat</label>
          <select className="select" value={reminderRepeats} onChange={(e) => setReminderRepeats(e.target.value)}>
            <option value="none">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>
    </>
  );
}
