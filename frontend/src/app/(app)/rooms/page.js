'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/api';
import { Users, Plus, Search } from 'lucide-react';
import { SkeletonCard } from '@/components/SkeletonLoader';
import RoomKnockLoader from '@/components/RoomKnockLoader';
import RoomsHeader from './components/RoomsHeader';
import RoomCard from './components/RoomCard';
import CreateRoomModal from './components/CreateRoomModal';
import RoomPinModal from './components/RoomPinModal';
import DeleteRoomModal from './components/DeleteRoomModal';

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
    expiryMinutes: 60,
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
      } catch {}
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
  }, [searchQuery, toast]);

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
    } catch {
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
    } catch {
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
    } catch {
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
      <RoomsHeader
        onOpenCreate={() => setShowCreateModal(true)}
        roomCodeInput={roomCodeInput}
        setRoomCodeInput={setRoomCodeInput}
        onJoinWithCode={handleJoinWithCode}
        joiningCode={joiningCode}
      />

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
          {rooms.map(room => (
            <RoomCard
              key={room.id || room.roomCode}
              room={room}
              currentUserId={currentUserId}
              onClick={handleRoomCardClick}
              onDelete={handleDeleteRoom}
            />
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        createForm={createForm}
        setCreateForm={setCreateForm}
        isCustomExpiry={isCustomExpiry}
        setIsCustomExpiry={setIsCustomExpiry}
        customExpiryInput={customExpiryInput}
        setCustomExpiryInput={setCustomExpiryInput}
        generateRandomPin={generateRandomPin}
        handleCreateRoom={handleCreateRoom}
        creating={creating}
      />

      {/* PIN Prompt Modal */}
      <RoomPinModal
        room={pinModalRoom}
        pinInput={pinInput}
        setPinInput={setPinInput}
        pinVerifying={pinVerifying}
        onClose={() => setPinModalRoom(null)}
        onSubmit={handleVerifyPinSubmit}
      />

      {/* Delete Room Confirmation Modal */}
      <DeleteRoomModal
        room={roomToDelete}
        deleting={deletingRoom}
        onClose={() => setRoomToDelete(null)}
        onConfirm={confirmDeleteRoom}
      />
    </div>
  );
}
