'use client';
import { useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function ProfileCategories({ profile, setProfile }) {
  const [showAddCat, setShowAddCat] = useState(false);
  const toast = useToast();

  const customCategories = profile?.customCategories || [];

  async function handleRemoveCategory(idx) {
    const cats = customCategories.filter((_, i) => i !== idx);
    setProfile({ ...profile, customCategories: cats });
    await apiFetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customCategories: cats })
    });
  }

  async function handleAddCategory(e) {
    if (e.key === 'Escape') setShowAddCat(false);
    if (e.key === 'Enter' && e.target.value.trim()) {
      const newCat = e.target.value.trim();
      e.target.value = '';
      const cats = [...customCategories, newCat];
      setProfile({ ...profile, customCategories: cats });
      await apiFetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customCategories: cats })
      });
      toast.success('Category added');
      setShowAddCat(false);
    }
  }

  return (
    <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
        <BookOpen size={18} />
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Custom Categories</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {['Work', 'Personal', 'Education', 'Finance', 'Health', 'Projects', 'Notes', 'Other'].map(cat => (
            <span key={cat} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
              {cat} (Default)
            </span>
          ))}
          {customCategories.map((cat, idx) => (
            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(180,255,100,0.1)', color: 'var(--brand)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', border: '1px solid rgba(180,255,100,0.2)' }}>
              {cat}
              <button
                className="icon-btn"
                style={{ padding: 0, marginLeft: '4px', opacity: 0.7 }}
                onClick={() => handleRemoveCategory(idx)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        
        {showAddCat ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="input"
              placeholder="New category..."
              autoFocus
              onBlur={() => setShowAddCat(false)}
              onKeyDown={handleAddCategory}
            />
          </div>
        ) : (
          <button className="btn" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', alignSelf: 'flex-start' }} onClick={() => setShowAddCat(true)}>
            + Add Custom Category
          </button>
        )}
      </div>
    </section>
  );
}
