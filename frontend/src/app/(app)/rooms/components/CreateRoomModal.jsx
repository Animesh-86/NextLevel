'use client';
import { Users, X, Clock, Globe, Lock, KeyRound, Shuffle, Rocket } from 'lucide-react';

export default function CreateRoomModal({
  isOpen,
  onClose,
  createForm,
  setCreateForm,
  isCustomExpiry,
  setIsCustomExpiry,
  customExpiryInput,
  setCustomExpiryInput,
  generateRandomPin,
  handleCreateRoom,
  creating,
}) {
  if (!isOpen) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 1000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.82)', 
        backdropFilter: 'blur(10px)',
        padding: '1rem'
      }} 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        style={{ 
          width: '100%', 
          maxWidth: '700px', 
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2.25rem', 
          borderRadius: '16px',
          background: '#0d0f12',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.95)',
          color: '#ffffff',
          animation: 'fadeIn 0.2s ease-out' 
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '10px', 
              background: 'rgba(255, 255, 255, 0.08)', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#ffffff'
            }}>
              <Users size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Create Study Room
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', margin: '3px 0 0 0' }}>
                Set up a shared live focus space or real-time OA Blitz arena for your peers.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              padding: '6px', 
              borderRadius: '8px', 
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Room Details Row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                  Room Title
                </label>
                <span style={{ fontSize: '0.72rem', color: '#ffffff', fontWeight: 600, background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: '10px' }}>
                  Required
                </span>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. LeetCode Practice, GATE OS Revision, Deep Focus"
                value={createForm.title}
                onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                style={{ 
                  width: '100%', 
                  padding: '0.85rem 1.1rem', 
                  background: 'rgba(255, 255, 255, 0.04)', 
                  border: '1px solid rgba(255, 255, 255, 0.2)', 
                  borderRadius: '10px', 
                  color: '#ffffff', 
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ffffff'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)' }}>
                  Topic / Goal Description
                </label>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                  Optional
                </span>
              </div>
              <textarea
                placeholder="What is the group focusing on during this session?"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem', 
                  background: 'rgba(255, 255, 255, 0.04)', 
                  border: '1px solid rgba(255, 255, 255, 0.15)', 
                  borderRadius: '10px', 
                  color: '#ffffff', 
                  fontSize: '0.9rem', 
                  resize: 'vertical',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ffffff'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
              />
            </div>
          </div>

          {/* Room Duration / Expiry Section */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} style={{ color: '#ffffff' }} />
                <span>Room Duration & Auto-Expiry</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                Extendable anytime in room
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { label: '30m', desc: 'Quick Sprint', val: 30 },
                { label: '1 Hour', desc: 'Standard Focus', val: 60 },
                { label: '2 Hours', desc: 'Deep Study', val: 120 },
                { label: '4 Hours', desc: 'Marathon', val: 240 },
                { label: 'Custom', desc: 'Set Minutes', val: 'custom' },
                { label: 'No Expiry', desc: 'Persistent Room', val: 0 },
              ].map(opt => {
                const isSelected = opt.val === 'custom' ? isCustomExpiry : (!isCustomExpiry && createForm.expiryMinutes === opt.val);
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      if (opt.val === 'custom') {
                        setIsCustomExpiry(true);
                        const parsed = parseInt(customExpiryInput, 10) || 45;
                        setCreateForm(prev => ({ ...prev, expiryMinutes: parsed }));
                      } else {
                        setIsCustomExpiry(false);
                        setCreateForm(prev => ({ ...prev, expiryMinutes: opt.val }));
                      }
                    }}
                    style={{
                      padding: '0.75rem 0.6rem',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      border: isSelected ? '1.5px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.9)' }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: isSelected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)', fontWeight: 500 }}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {isCustomExpiry && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Specify Duration:</span>
                  <input
                    type="number"
                    min={5}
                    max={720}
                    value={customExpiryInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomExpiryInput(val);
                      const num = parseInt(val, 10);
                      if (!isNaN(num) && num > 0) {
                        setCreateForm(prev => ({ ...prev, expiryMinutes: num }));
                      }
                    }}
                    style={{
                      width: '85px',
                      padding: '0.45rem 0.6rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>minutes</span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {[45, 90, 150].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setCustomExpiryInput(mins.toString());
                        setCreateForm(prev => ({ ...prev, expiryMinutes: mins }));
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Access Control Cards */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              Privacy & Access
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              <div
                onClick={() => setCreateForm(prev => ({ ...prev, isPrivate: false }))}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: !createForm.isPrivate ? '1.5px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: !createForm.isPrivate ? 'rgba(255, 255, 255, 0.09)' : 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Globe size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff', marginBottom: '2px' }}>
                    Public Room
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.4 }}>
                    Anyone in the lobby can discover and enter without a password.
                  </div>
                </div>
              </div>

              <div
                onClick={() => {
                  setCreateForm(prev => {
                    const newPin = prev.accessPin || Math.floor(1000 + Math.random() * 9000).toString();
                    return { ...prev, isPrivate: true, accessPin: newPin };
                  });
                }}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: createForm.isPrivate ? '1.5px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: createForm.isPrivate ? 'rgba(255, 255, 255, 0.09)' : 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Lock size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff', marginBottom: '2px' }}>
                    Private Room
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.4 }}>
                    Restricted access. Requires a 4-digit security PIN to join.
                  </div>
                </div>
              </div>
            </div>

            {createForm.isPrivate && (
              <div style={{ marginTop: '0.85rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <KeyRound size={18} style={{ color: '#ffffff' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Set 4-Digit Security PIN:</span>
                  <input
                    type="text"
                    maxLength={4}
                    required={createForm.isPrivate}
                    placeholder="1234"
                    value={createForm.accessPin}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, accessPin: e.target.value.replace(/\D/g, '') }))}
                    style={{ 
                      width: '110px', 
                      padding: '0.5rem 0.75rem', 
                      background: 'rgba(0, 0, 0, 0.6)', 
                      border: '1.5px solid rgba(255, 255, 255, 0.4)', 
                      borderRadius: '8px', 
                      color: '#ffffff', 
                      fontSize: '1.15rem', 
                      letterSpacing: '0.25em', 
                      textAlign: 'center', 
                      fontWeight: 800,
                      outline: 'none'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={generateRandomPin}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Shuffle size={13} />
                  <span>Randomize PIN</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.85rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ 
                padding: '0.75rem 1.4rem', 
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              style={{ 
                padding: '0.75rem 1.75rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontWeight: 800,
                borderRadius: '8px',
                border: 'none',
                background: '#ffffff',
                color: '#000000',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255, 255, 255, 0.2)'
              }}
            >
              <Rocket size={16} />
              <span>{creating ? 'Launching...' : 'Launch Room'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
