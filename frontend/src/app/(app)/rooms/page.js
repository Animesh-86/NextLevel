'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/api';
import { 
  Users, Plus, Search, Lock, Unlock, ArrowRight, X, Trash2, 
  Sparkles, Check, Copy, Clock, Globe, ShieldCheck, Shuffle, Rocket, KeyRound,
  Loader2, AlertTriangle
} from 'lucide-react';
import { SkeletonCard } from '@/components/SkeletonLoader';
import RoomKnockLoader from '@/components/RoomKnockLoader';

export default function StudyRoomsLobby() {
  const router = useRouter();
  const toast = useToast();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  
  // Quick Code Join
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [joiningCode, setJoiningCode] = useState(false);

  // Create Room Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    isPrivate: false,
    accessPin: '',
    expiryMinutes: 60, // 30, 60, 120, 240, 0 = no expiry
  });
  const [isCustomExpiry, setIsCustomExpiry] = useState(false);
  const [customExpiryInput, setCustomExpiryInput] = useState('45');

  // PIN Prompt Modal for Private Room
  const [pinModalRoom, setPinModalRoom] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinVerifying, setPinVerifying] = useState(false);

  // Delete Room Confirmation Modal
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [deletingRoom, setDeletingRoom] = useState(false);

  // Fetch current user profile
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await apiFetch('/api/user/profile');
        const json = await res.json();
        if (json.success && json.data) {
          setCurrentUserId(json.data.id || json.data._id);
          setCurrentUserName(json.data.name || '');
        }
      } catch (err) {}
    }
    fetchMe();
  }, []);

  const fetchRooms = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) {
        queryParams.set('search', searchQuery.trim());
      }

      const res = await apiFetch(`/api/rooms?${queryParams.toString()}`);
      if (!res.ok) {
        if (!isSilent) toast.error('Failed to load study rooms');
        return;
      }
      const json = await res.json();
      if (json.success) {
        setRooms(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      if (!isSilent) toast.error('Failed to load study rooms');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchRooms(false);
    const interval = setInterval(() => {
      fetchRooms(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const generateRandomPin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setCreateForm(prev => ({ ...prev, accessPin: randomPin }));
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      toast.error('Please enter a room title');
      return;
    }
    if (createForm.isPrivate && (!createForm.accessPin || createForm.accessPin.length < 4)) {
      toast.error('Private rooms require a 4-digit PIN');
      return;
    }

    setCreating(true);
    try {
      const res = await apiFetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      if (!res.ok) {
        let errMsg = 'Failed to create room';
        try {
          const errData = await res.json();
          if (errData && errData.message) errMsg = errData.message;
        } catch (_) {}
        toast.error(errMsg);
        return;
      }

      const json = await res.json();
      if (json.success && json.data) {
        toast.success(`Study room "${json.data.title}" opened!`);
        setShowCreateModal(false);
        setCreateForm({ title: '', description: '', isPrivate: false, accessPin: '', expiryMinutes: 60 });
        router.push(`/rooms/${json.data.id || json.data.roomCode}`);
      } else {
        toast.error(json.message || 'Failed to create room');
      }
    } catch (err) {
      console.error('Create room error:', err);
      toast.error('Failed to create study room. Please verify backend connection.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = (room, e) => {
    e.stopPropagation();
    setRoomToDelete(room);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    setDeletingRoom(true);
    try {
      const res = await apiFetch(`/api/rooms/${roomToDelete.id || roomToDelete.roomCode}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success(`Study room "${roomToDelete.title}" deleted`);
        setRooms(prev => prev.filter(r => r.id !== roomToDelete.id && r.roomCode !== roomToDelete.roomCode));
        setRoomToDelete(null);
      } else {
        toast.error(json.message || 'Failed to delete room');
      }
    } catch (err) {
      toast.error('Failed to delete room');
    } finally {
      setDeletingRoom(false);
    }
  };

  const handleJoinWithCode = async (e) => {
    e.preventDefault();
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    setJoiningCode(true);
    try {
      const res = await apiFetch(`/api/rooms/${cleanCode}`);
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.isPrivate) {
          setPinModalRoom(json.data);
        } else {
          router.push(`/rooms/${json.data.id || json.data.roomCode}`);
        }
      } else {
        toast.error('No study room found with code ' + cleanCode);
      }
    } catch (err) {
      toast.error('Failed to find room');
    } finally {
      setJoiningCode(false);
    }
  };

  const handleRoomCardClick = (room) => {
    if (room.isPrivate) {
      setPinModalRoom(room);
      setPinInput('');
    } else {
      router.push(`/rooms/${room.id || room.roomCode}`);
    }
  };

  const handleVerifyPinSubmit = async (e) => {
    e.preventDefault();
    if (!pinModalRoom) return;

    setPinVerifying(true);
    try {
      const res = await apiFetch(`/api/rooms/${pinModalRoom.id || pinModalRoom.roomCode}/join?pin=${pinInput}`, {
        method: 'POST'
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/rooms/${pinModalRoom.id || pinModalRoom.roomCode}`);
      } else {
        toast.error(json.message || 'Incorrect PIN code');
      }
    } catch (err) {
      toast.error('Failed to verify PIN');
    } finally {
      setPinVerifying(false);
    }
  };

  const userInitials = (currentUserName || 'Student')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
      {creating && (
        <RoomKnockLoader
          step="connect"
          code="NEW"
          name="Creating Study Room"
          initials={userInitials}
        />
      )}
      {joiningCode && (
        <RoomKnockLoader
          step="join"
          code={joiningCode}
          name="Entering Study Room"
          initials={userInitials}
        />
      )}

      {/* Header Banner */}
      <header className="glass-panel" style={{ padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border-light)', borderRadius: '20px', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <Users size={13} /> Peer Co-Working & Arena
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.04em', margin: 0 }}>
              Collaborative Study Rooms
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '640px', marginTop: '0.5rem', lineHeight: 1.5 }}>
              Co-work with peers, launch instant OA Blitz challenge sprints, and track real-time scores and leaderboards together.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              style={{ padding: '0.8rem 1.4rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} /> Create Room
            </button>
          </div>
        </div>

        {/* Quick Join With Code Bar */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Have a Room Code?</span>
            <form onSubmit={handleJoinWithCode} style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="e.g. NL-4821"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                style={{
                  width: '130px',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!roomCodeInput.trim() || joiningCode}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
              >
                {joiningCode ? 'Joining...' : 'Join'}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Live Presence & Speed Challenges
            </span>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '340px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search study rooms by title or host..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem 0.6rem 2.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          <SkeletonCard height="160px" />
          <SkeletonCard height="160px" />
          <SkeletonCard height="160px" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: 'var(--text-secondary)' }}>
            <Users size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No Active Study Rooms
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            Open a study room for you and your peers to join, set up instant challenge sprints, and practice together.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.4rem' }}
          >
            <Plus size={16} style={{ marginRight: '6px' }} /> Create Room
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {rooms.map(room => {
            const count = room.participantCount || (room.participants ? room.participants.length : 0);
            const isMyRoom = currentUserId && (room.hostUserId === currentUserId);

            // Expiry calculation
            let expiryLabel = 'No Expiry';
            if (room.expiresAt) {
              const diffMs = new Date(room.expiresAt) - new Date();
              if (diffMs > 0) {
                const diffMins = Math.ceil(diffMs / (1000 * 60));
                expiryLabel = diffMins >= 60 ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m left` : `${diffMins}m left`;
              } else {
                expiryLabel = 'Expiring soon';
              }
            }

            return (
              <div
                key={room.id || room.roomCode}
                className="card"
                onClick={() => handleRoomCardClick(room)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg-surface)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--text-muted)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                }}
              >
                <div>
                  {/* Top Bar inside card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '6px' }}>
                        {room.roomCode}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} /> {expiryLabel}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {room.isPrivate ? (
                        <span title="Private Room - 4 Digit PIN Required" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center' }}>
                          <Lock size={14} />
                        </span>
                      ) : null}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                          {count} peer{count !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {isMyRoom && (
                        <button
                          onClick={(e) => handleDeleteRoom(room, e)}
                          title="Close & Delete this room"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Room Title & Description */}
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem', lineHeight: 1.3 }}>
                    {room.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {room.description || 'Collaborative study & OA Blitz practice session. Jump in, share your goal, and study together.'}
                  </p>
                </div>

                {/* Footer metadata */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                    <span>Host: <strong style={{ color: 'var(--text-primary)' }}>{room.hostUserName || 'Student'}</strong></span>
                  </div>

                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700 }}
                  >
                    <span>Enter Room</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Spacious & Minimalist Monochrome Black & White Create Room Modal */}
      {showCreateModal && (
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
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
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
                onClick={() => setShowCreateModal(false)} 
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

                {/* 6 Clean Spaced Duration Cards in 3 Columns - Monochrome */}
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

              {/* Privacy & Access Control Cards - Monochrome */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  Privacy & Access
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                  {/* Public Room Option */}
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

                  {/* Private Room Option */}
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

              {/* Action Buttons Footer - Cleaned, removed max 25 peers line */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.85rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
      )}

      {/* PIN Prompt Modal */}
      {pinModalRoom && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) setPinModalRoom(null); }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '380px', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <Lock size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Private Room</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Enter the 4-digit PIN to join <strong>{pinModalRoom.title}</strong>
            </p>

            <form onSubmit={handleVerifyPinSubmit}>
              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '160px',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '1.5rem',
                  letterSpacing: '0.4em',
                  textAlign: 'center',
                  fontWeight: 800,
                  outline: 'none',
                  margin: '0 auto 1.5rem auto',
                  display: 'block'
                }}
              />

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setPinModalRoom(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinInput.length < 4 || pinVerifying}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {pinVerifying ? 'Checking...' : 'Enter Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CUSTOM POP-UP FOR ROOM DELETION ─── */}
      {roomToDelete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{
            background: '#111318',
            border: '1.5px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '450px',
            padding: '1.75rem',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(239, 68, 68, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0
              }}>
                <Trash2 size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
                  Delete Study Room
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
                  Are you sure you want to close and permanently delete <strong style={{ color: '#ffffff' }}>&ldquo;{roomToDelete.title}&rdquo;</strong>? All active challenges, chat history, and peer connections will be removed. This cannot be undone.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
              <button
                type="button"
                disabled={deletingRoom}
                onClick={() => setRoomToDelete(null)}
                className="btn btn-secondary"
                style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem', fontWeight: 700 }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingRoom}
                onClick={confirmDeleteRoom}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: deletingRoom ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => { if (!deletingRoom) e.currentTarget.style.background = '#dc2626'; }}
                onMouseLeave={(e) => { if (!deletingRoom) e.currentTarget.style.background = '#ef4444'; }}
              >
                {deletingRoom ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                <span>{deletingRoom ? 'Deleting Room...' : 'Delete Room'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
