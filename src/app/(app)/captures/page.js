'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, Inbox, Archive, CheckCircle2,
  SlidersHorizontal, LayoutGrid, List, Loader2
} from 'lucide-react';
import CaptureCard from '@/components/CaptureCard';
import CaptureModal from '@/components/CaptureModal';
import { SkeletonCard } from '@/components/SkeletonLoader';

const categoryFilters = [
  { value: 'all', label: 'All' },
  { value: 'exam', label: '📝 Exam' },
  { value: 'project', label: '🚀 Project' },
  { value: 'deadline', label: '⏰ Deadline' },
  { value: 'resource', label: '📚 Resource' },
  { value: 'personal', label: '💡 Personal' },
  { value: 'college', label: '🎓 College' },
  { value: 'other', label: '📌 Other' },
];

const urgencyFilters = [
  { value: 'all', label: 'All Urgency' },
  { value: 'critical', label: '🔴 Critical' },
  { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🔵 Low' },
  { value: 'none', label: '⚪ None' },
];

const statusTabs = [
  { value: 'active', label: 'Active', icon: Inbox },
  { value: 'completed', label: 'Done', icon: CheckCircle2 },
  { value: 'all', label: 'Archive', icon: Archive },
];

export default function CaptureHub() {
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [urgency, setUrgency] = useState('all');
  const [status, setStatus] = useState('active');
  const [showFilters, setShowFilters] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCapture, setEditingCapture] = useState(null);

  const fetchCaptures = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (urgency !== 'all') params.set('urgency', urgency);
      if (status !== 'all') params.set('status', status);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/captures?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCaptures(data.data);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch captures:', err);
    } finally {
      setLoading(false);
    }
  }, [category, urgency, status, search]);

  useEffect(() => {
    const debounce = setTimeout(fetchCaptures, search ? 300 : 0);
    return () => clearTimeout(debounce);
  }, [fetchCaptures, search]);

  const handlePin = async (id, pinned) => {
    try {
      await fetch(`/api/captures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: pinned }),
      });
      fetchCaptures();
    } catch (err) {
      console.error('Pin failed:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this capture?')) return;
    try {
      await fetch(`/api/captures/${id}`, { method: 'DELETE' });
      fetchCaptures();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleComplete = async (id) => {
    try {
      await fetch(`/api/captures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      fetchCaptures();
    } catch (err) {
      console.error('Complete failed:', err);
    }
  };

  const handleArchive = async (id) => {
    try {
      await fetch(`/api/captures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true, status: 'completed' }),
      });
      fetchCaptures();
    } catch (err) {
      console.error('Archive failed:', err);
    }
  };

  const handleEdit = (capture) => {
    setEditingCapture(capture);
    setModalOpen(true);
  };

  const handleModalSave = () => {
    setModalOpen(false);
    setEditingCapture(null);
    fetchCaptures();
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingCapture(null);
  };

  // Stats
  const pinnedCount = captures.filter(c => c.isPinned).length;
  const withReminders = captures.filter(c => c.reminderAt && !c.isReminderDismissed).length;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <header className="capture-hub-header">
        <div>
          <h1 className="capture-hub-title">Capture Hub</h1>
          <p className="capture-hub-subtitle">
            Your brain&apos;s second memory — {total} capture{total !== 1 ? 's' : ''}
            {pinnedCount > 0 && <> · {pinnedCount} pinned</>}
            {withReminders > 0 && <> · {withReminders} with reminders</>}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> New Capture
        </button>
      </header>

      {/* Status Tabs */}
      <div className="capture-status-tabs">
        {statusTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              className={`capture-status-tab ${status === tab.value ? 'active' : ''}`}
              onClick={() => setStatus(tab.value)}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="capture-toolbar">
        <div className="capture-search-wrapper">
          <Search size={16} className="capture-search-icon" />
          <input
            className="input capture-search-input"
            type="text"
            placeholder="Search captures..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`btn btn-secondary capture-filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="capture-filters" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="capture-filter-group">
            <label className="capture-filter-label">Category</label>
            <div className="capture-filter-pills">
              {categoryFilters.map(f => (
                <button
                  key={f.value}
                  className={`capture-filter-pill ${category === f.value ? 'active' : ''}`}
                  onClick={() => setCategory(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="capture-filter-group">
            <label className="capture-filter-label">Urgency</label>
            <div className="capture-filter-pills">
              {urgencyFilters.map(f => (
                <button
                  key={f.value}
                  className={`capture-filter-pill ${urgency === f.value ? 'active' : ''}`}
                  onClick={() => setUrgency(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Captures Grid */}
      {loading ? (
        <div className="capture-grid">
          <SkeletonCard height="200px" />
          <SkeletonCard height="200px" />
          <SkeletonCard height="200px" />
          <SkeletonCard height="200px" />
          <SkeletonCard height="200px" />
          <SkeletonCard height="200px" />
        </div>
      ) : captures.length === 0 ? (
        <div className="capture-empty-state">
          <div className="capture-empty-icon">
            <Inbox size={56} strokeWidth={1} />
          </div>
          <h3>No captures yet</h3>
          <p>Start dumping links, screenshots, and notes here.<br />AI will organize everything for you.</p>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)} style={{ marginTop: '1.5rem' }}>
            <Plus size={16} /> Create your first capture
          </button>
        </div>
      ) : (
        <div className="capture-grid">
          {captures.map(capture => (
            <CaptureCard
              key={capture._id}
              capture={capture}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPin={handlePin}
              onArchive={handleArchive}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <CaptureModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        editingCapture={editingCapture}
      />
    </div>
  );
}
