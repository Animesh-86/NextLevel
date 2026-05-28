'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Upload, Type, Link2, Camera, Sparkles, Loader2,
  Clock, Tag, AlertTriangle, ChevronDown
} from 'lucide-react';

const categories = [
  { value: 'exam', label: '📝 Exam' },
  { value: 'project', label: '🚀 Project' },
  { value: 'deadline', label: '⏰ Deadline' },
  { value: 'resource', label: '📚 Resource' },
  { value: 'personal', label: '💡 Personal' },
  { value: 'college', label: '🎓 College' },
  { value: 'work', label: '💼 Work' },
  { value: 'job-posting', label: '🎯 Job Post' },
  { value: 'tutorial', label: '📖 Tutorial' },
  { value: 'code', label: '💻 Code' },
  { value: 'idea', label: '✨ Idea' },
  { value: 'other', label: '📌 Other' },
];

const urgencies = [
  { value: 'critical', label: 'Critical', color: '#ef4444' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'medium', label: 'Medium', color: '#eab308' },
  { value: 'low', label: 'Low', color: '#3b82f6' },
  { value: 'none', label: 'None', color: 'var(--text-muted)' },
];

export default function CaptureModal({ isOpen, onClose, onSave, editingCapture = null }) {
  const [mode, setMode] = useState(editingCapture ? 'text' : 'text'); // 'text' or 'screenshot'
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
    setMode('text');
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
      setMode(editingCapture.type === 'screenshot' ? 'screenshot' : 'text');

      if (editingCapture.type === 'screenshot' && !editingCapture.imageData) {
        setLoading(true);
        fetch(`/api/captures/${editingCapture._id}`)
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
      const res = await fetch('/api/captures/analyze', {
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
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target.result;
      setPreviewImage(base64Data);
      setAnalyzing(true);
      try {
        const res = await fetch('/api/captures/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Data, mimeType: file.type }),
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
            // Append link to description/rawContent
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
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
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
          setMode('screenshot');
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
      if (mode === 'screenshot' && imageFile && !editingCapture) {
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

        const res = await fetch('/api/captures/upload', {
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
          ? `/api/captures/${editingCapture._id}`
          : '/api/captures';

        const res = await fetch(url, {
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

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={handleClose} onPaste={handlePaste}>
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

        {/* Mode tabs (only for new captures) */}
        {!editingCapture && (
          <div className="capture-mode-tabs">
            <button
              className={`capture-mode-tab ${mode === 'text' ? 'active' : ''}`}
              onClick={() => setMode('text')}
            >
              <Type size={16} /> Text / Link
            </button>
            <button
              className={`capture-mode-tab ${mode === 'screenshot' ? 'active' : ''}`}
              onClick={() => setMode('screenshot')}
            >
              <Camera size={16} /> Screenshot
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="capture-form">
          {/* Screenshot upload / preview area */}
          {mode === 'screenshot' && (
            <div className="capture-screenshot-section" style={{ marginBottom: '1.5rem' }}>
              {editingCapture ? (
                previewImage ? (
                  <div className="capture-preview-container">
                    <img src={previewImage} alt="Screenshot" className="capture-preview-img" />
                  </div>
                ) : (
                  <div className="capture-dropzone" style={{ height: '140px' }}>
                    <div className="capture-dropzone-content">
                      <Loader2 className="auth-spinner" size={24} />
                      <p>Loading screenshot...</p>
                    </div>
                  </div>
                )
              ) : (
                <div
                  className={`capture-dropzone ${dragOver ? 'dragover' : ''} ${previewImage ? 'has-preview' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewImage ? (
                    <div className="capture-preview-container">
                      <img src={previewImage} alt="Preview" className="capture-preview-img" />
                      {analyzing && (
                        <div className="capture-preview-overlay">
                          <Loader2 className="auth-spinner" size={24} />
                          <span>AI Extracting Text & Date...</span>
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
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="capture-dropzone-content">
                      <Upload size={32} strokeWidth={1.5} />
                      <p>Drop screenshot here or click to upload</p>
                      <span>Also try Ctrl+V to paste from clipboard</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                  />
                </div>
              )}
            </div>
          )}

          {/* Text/URL input area */}
          {mode === 'text' && (
            <div className="capture-text-input-area">
              <textarea
                className="textarea capture-textarea"
                placeholder="Paste a link, type a note, or dump whatever you want to remember..."
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                rows={4}
                onPaste={handlePaste}
              />
              {rawContent.trim() && !aiSuggested && (
                <button
                  type="button"
                  className="capture-ai-btn"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <><Loader2 size={14} className="auth-spinner" /> Analyzing...</>
                  ) : (
                    <><Sparkles size={14} /> AI Categorize</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* AI suggestion banner */}
          {aiSuggested && editingCapture && (
            <div className="capture-ai-banner">
              <Sparkles size={14} /> AI suggestions applied — feel free to edit below
            </div>
          )}

          {/* Show manual fields if editing, in text mode, or if screenshot is uploaded */}
          {(editingCapture || mode === 'text' || previewImage) && (
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
          )}

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
          <button
            type="submit"
            className="btn btn-primary capture-submit"
            disabled={loading || (mode === 'text' && !rawContent.trim()) || (mode === 'screenshot' && !imageFile && !editingCapture)}
          >
            {loading ? (
              <><Loader2 size={16} className="auth-spinner" /> Saving...</>
            ) : editingCapture ? (
              'Update Capture'
            ) : (
              '✨ Save Capture'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
