'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import {
  X, Upload, Type, Link2, Camera, Sparkles, Loader2,
  Clock, Tag, AlertTriangle, ChevronDown
} from 'lucide-react';
import { compressImage } from '@/lib/imageUtils';

const categories = [
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

const urgencies = [
  { value: 'critical', label: 'Critical', color: 'var(--urgency-critical)' },
  { value: 'high', label: 'High', color: 'var(--urgency-high)' },
  { value: 'medium', label: 'Medium', color: 'var(--urgency-medium)' },
  { value: 'low', label: 'Low', color: 'var(--urgency-low)' },
  { value: 'none', label: 'None', color: 'var(--text-muted)' },
];

export default function CaptureModal({ isOpen, onClose, onSave, editingCapture = null }) {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Form state
  const [title, setTitle] = useState(editingCapture?.title || '');
  const [rawContent, setRawContent] = useState(editingCapture?.rawContent || '');
  const [description, setDescription] = useState(editingCapture?.description || '');
  const [category, setCategory] = useState(editingCapture?.category || 'other');
  const [urgency, setUrgency] = useState(editingCapture?.urgency || 'none');
  const [tags, setTags] = useState(editingCapture?.tags?.join(', ') || '');
  const [reminderAt, setReminderAt] = useState(
    editingCapture?.reminderAt ? new Date(editingCapture.reminderAt).toISOString().slice(0, 16) : ''
  );
  const [reminderRepeats, setReminderRepeats] = useState(editingCapture?.reminderRepeats || 'none');
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [analysisNotice, setAnalysisNotice] = useState('');

  const fileInputRef = useRef(null);

  const resetForm = useCallback(() => {
    setTitle('');
    setRawContent('');
    setDescription('');
    setCategory('other');
    setUrgency('none');
    setTags('');
    setReminderAt('');
    setReminderRepeats('none');
    setPreviewImage(null);
    setImageFile(null);
    setAiSuggested(false);
    setSaveError('');
    setAnalysisNotice('');
  }, []);

  useEffect(() => {
    let active = true;
    if (editingCapture) {
      setTitle(editingCapture.title || '');
      setRawContent(editingCapture.rawContent || '');
      setDescription(editingCapture.description || '');
      setCategory(editingCapture.category || 'other');
      setUrgency(editingCapture.urgency || 'none');
      setTags(editingCapture.tags?.join(', ') || '');
      setReminderAt(
        editingCapture.reminderAt ? new Date(editingCapture.reminderAt).toISOString().slice(0, 16) : ''
      );
      setReminderRepeats(editingCapture.reminderRepeats || 'none');
      setPreviewImage(editingCapture.imageData || null);

      if (editingCapture.type === 'screenshot' && !editingCapture.imageData) {
        setLoading(true);
        apiFetch(`/api/captures/${editingCapture.id}`)
          .then(res => res.json())
          .then(data => {
            if (active && data.success && data.data) {
              setPreviewImage(data.data.imageData || null);
            }
          })
          .catch(err => console.error('Failed to fetch full capture:', err))
          .finally(() => {
            if (active) setLoading(false);
          });
      }
    } else {
      resetForm();
    }
    return () => {
      active = false;
    };
  }, [editingCapture, isOpen, resetForm]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // AI Analyze text content
  const handleAnalyze = async () => {
    if (!rawContent.trim()) return;
    setAnalyzing(true);
    try {
      const res = await apiFetch('/api/captures/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawContent }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const a = data.data;
        if (a.title) setTitle(a.title);
        if (a.category) setCategory(a.category);
        if (a.urgency) setUrgency(a.urgency);
        if (a.tags) setTags(a.tags.join(', '));
        if (a.summary) setDescription(a.summary);
        if (a.reminderSuggestion) {
          setReminderAt(new Date(a.reminderSuggestion).toISOString().slice(0, 16));
        }
        setAiSuggested(true);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle screenshot upload
  const handleFileSelect = async (file) => {
    if (!file) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PNG, JPEG, WebP, or GIF image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Max 10MB.');
      return;
    }

    setImageFile(file);
    setSaveError('');
    setAnalysisNotice('');
    
    try {
      setAnalyzing(true);
      // Wait for image to compress
      const base64Data = await compressImage(file, 1024, 1024, 0.7);
      setPreviewImage(base64Data);
      
      const res = await apiFetch('/api/captures/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data, mimeType: 'image/jpeg' }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const a = data.data;
        if (a.title) setTitle(a.title);
        if (a.category) setCategory(a.category);
        if (a.urgency) setUrgency(a.urgency);
        if (a.tags) setTags(a.tags.join(', '));
        if (a.summary) setDescription(a.summary);
        if (a.extractedText) setRawContent(a.extractedText);
        if (a.extractedLink) {
          setRawContent(prev => prev ? `${prev}\n\nLink: ${a.extractedLink}` : `Link: ${a.extractedLink}`);
        }
        if (a.reminderSuggestion) {
          const localDate = new Date(a.reminderSuggestion);
          const offset = localDate.getTimezoneOffset();
          const adjustedDate = new Date(localDate.getTime() - (offset * 60 * 1000));
          setReminderAt(adjustedDate.toISOString().slice(0, 16));
        }
        setAiSuggested(true);
      }
    } catch (err) {
      console.error('Image analysis failed:', err);
      setTitle(prev => prev || file.name.replace(/\.[^.]+$/, '') || 'Screenshot Capture');
      setDescription(prev => prev || 'Screenshot saved without AI details.');
      setAnalysisNotice('AI could not read this screenshot. It can still be saved and edited later.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          handleFileSelect(file);
        }
        return;
      }
    }
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (imageFile && !editingCapture) {
        // Upload screenshot with optional manual edits as form data
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('title', title.trim() || 'Screenshot Capture');
        formData.append('description', description);
        formData.append('category', category);
        formData.append('urgency', urgency);
        formData.append('tags', tags);
        formData.append('rawContent', rawContent);
        if (reminderAt) {
          formData.append('reminderAt', new Date(reminderAt).toISOString());
        }
        formData.append('reminderRepeats', reminderRepeats);

        const res = await apiFetch('/api/captures/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          onSave?.();
        }
      } else {
        // Text/Link capture or edit
        const isLink = /^https?:\/\//.test(rawContent.trim());
        const payload = {
          type: editingCapture?.type || (isLink ? 'link' : 'text'),
          title: title.trim() || 'Untitled Capture',
          rawContent,
          description,
          category,
          urgency,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          reminderAt: reminderAt ? new Date(reminderAt).toISOString() : null,
          reminderRepeats,
        };

        const url = editingCapture
          ? `/api/captures/${editingCapture.id}`
          : '/api/captures';

        const res = await apiFetch(url, {
          method: editingCapture ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) onSave?.();
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  // Google Calendar Export
  const handleAddToCalendar = () => {
    if (!title && !editingCapture?.title) {
        alert("Please add a title first");
        return;
    }
    if (!reminderAt) {
        alert("Please set a reminder date first");
        return;
    }
    
    const d = new Date(reminderAt);
    const dateStr = d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    // Create an end date 30 mins later
    const dEnd = new Date(d.getTime() + 30 * 60000);
    const dateEndStr = dEnd.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const t = title || editingCapture?.title || "Capture Reminder";
    const desc = description || rawContent || "";
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(t)}&dates=${dateStr}/${dateEndStr}&details=${encodeURIComponent(desc)}`;
    window.open(url, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onPaste={handlePaste}>
      <div
        className="capture-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="capture-modal-header">
          <h2 className="capture-modal-title">
            {editingCapture ? 'Edit Capture' : 'New Capture'}
          </h2>
          <button className="icon-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Unified Input Area */}
        <form onSubmit={handleSubmit} className="capture-form">
          <div className="capture-text-input-area" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <textarea
                className="textarea capture-textarea"
                placeholder="Paste a link, type a note, or dump an image here..."
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                rows={4}
                onPaste={handlePaste}
                style={{ paddingBottom: '3.5rem' }}
              />
              
              {rawContent.trim() && !aiSuggested && !previewImage && (
                <button
                  type="button"
                  className="capture-ai-btn"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  style={{ position: 'absolute', top: '0.75rem', bottom: 'auto', right: '0.75rem' }}
                >
                  {analyzing ? (
                    <><Loader2 size={14} className="auth-spinner" /> Analyzing...</>
                  ) : (
                    <><Sparkles size={14} /> AI Categorize</>
                  )}
                </button>
              )}

              <button
                type="button"
                className="icon-btn"
                onClick={() => fileInputRef.current?.click()}
                style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}
                title="Attach Image"
              >
                <Camera size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </div>

            {previewImage && (
              <div className="capture-preview-container" style={{ position: 'relative', height: '120px', width: 'fit-content', border: '1px solid var(--border-strong)', borderRadius: '6px', overflow: 'hidden' }}>
                <img src={previewImage} alt="Preview" className="capture-preview-img" style={{ height: '100%', objectFit: 'cover' }} />
                {analyzing && (
                  <div className="capture-preview-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px' }}>
                    <Loader2 className="auth-spinner" size={24} style={{ marginBottom: '4px' }} />
                    <span>Analyzing...</span>
                  </div>
                )}
                <button
                  type="button"
                  className="capture-preview-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewImage(null);
                    setImageFile(null);
                  }}
                  style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: 'white', padding: '4px', cursor: 'pointer', zIndex: 10 }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* AI suggestion banner */}
          {aiSuggested && (
            <div className="capture-ai-banner">
              <Sparkles size={14} /> AI suggestions applied — feel free to edit below
            </div>
          )}

          {/* Show manual fields always */}
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
                    {categories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="capture-field" style={{ flex: 1 }}>
                  <label className="auth-label">Urgency</label>
                  <select className="select" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                    {urgencies.map(u => (
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

            </>
          {/* Reminder (Fixed Date Picker Style) - Always Visible */}
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

          {/* Submit */}
          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={loading}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            {reminderAt && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddToCalendar}
                style={{ flex: 1, whiteSpace: 'nowrap' }}
                title="Add to Google Calendar"
              >
                Google Calendar
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary capture-submit"
              disabled={loading || (!rawContent.trim() && !imageFile && !editingCapture)}
              style={{ flex: 2 }}
            >
              {loading ? (
                <><Loader2 size={16} className="auth-spinner" /> Saving...</>
              ) : editingCapture ? (
                'Update Capture'
              ) : (
                'Save Capture'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
