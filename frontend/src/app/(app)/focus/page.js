'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import StarsGalaxy from '@/components/StarsGalaxy';
import { useFocusTimer, PARTICLE_SPEEDS } from '@/lib/FocusContext';
import { useFocusAudio } from './components/useFocusAudio';
import FocusHeader from './components/FocusHeader';
import FocusTimerDisplay from './components/FocusTimerDisplay';
import FocusControls from './components/FocusControls';
import FocusTaskBar from './components/FocusTaskBar';
import FocusCelebrationModal from './components/FocusCelebrationModal';
import FocusExitModal from './components/FocusExitModal';

export default function FocusPage() {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    mode,
    timeLeft,
    duration,
    isRunning,
    customMinutes, setCustomMinutes,
    particlesEnabled, setParticlesEnabled,
    particleSpeedIndex, setParticleSpeedIndex,
    isFullscreen,
    soundType, setSoundType,
    volume, setVolume,
    isMuted, setIsMuted,
    tasks, setTasks,
    selectedTaskId, setSelectedTaskId,
    sessionsCompletedToday,
    totalFocusMinutesToday,
    showCelebration, setShowCelebration,
    awardedXp,
    showExitModal,
    exitQuoteIndex,
    cancelExit,
    confirmExit,
    handleTogglePlay,
    handleModeChange,
    resetTimer,
    handleBackClick
  } = useFocusTimer();

  // Task Quick Add & Session State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  // Web Audio Synthesis Hook
  useFocusAudio({ isRunning, soundType, volume, isMuted });

  // Quick Task Creation for Linked Task
  const handleCreateQuickTask = async () => {
    if (!newTaskTitle.trim()) return;
    setIsCreatingTask(true);
    try {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const payload = {
        title: newTaskTitle.trim(),
        category: 'study',
        priority: 'medium',
        scheduledDate: todayStr,
        duration: Math.max(15, Math.round(duration / 60)),
        status: 'todo'
      };
      const res = await apiFetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTasks((prev) => [data.data, ...prev]);
        setSelectedTaskId(data.data.id);
        setNewTaskTitle('');
        setIsAddingTask(false);
        toast.success(`Task "${data.data.title}" created & linked!`);
      } else {
        toast.error(data.error || 'Failed to create task');
      }
    } catch {
      toast.error('Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Toggle Task Status (done / todo)
  const handleToggleTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await apiFetch(`/api/planner/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
        toast.success(newStatus === 'done' ? 'Task marked as completed! 🎉' : 'Task marked as todo');
      } else {
        toast.error(data.error || 'Failed to update task');
      }
    } catch {
      toast.error('Failed to update task status');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: isFullscreen ? '100vh' : 'calc(100vh - 75px)',
      maxHeight: isFullscreen ? '100vh' : 'calc(100vh - 75px)',
      background: '#000000',
      padding: isFullscreen ? '1.5rem' : '0.85rem 1.5rem 1rem',
      boxSizing: 'border-box',
      overflowY: 'auto',
      overflowX: 'hidden',
      color: '#f4f4f6',
      position: 'relative'
    }}>
      {/* High-density Cosmic Stars Galaxy Background (Active ONLY when timer is running) */}
      {isRunning && particlesEnabled && (
        <StarsGalaxy
          stars={1600}
          speed={0.42 * PARTICLE_SPEEDS[particleSpeedIndex].multiplier}
          twinkle={0.45}
          background="#000000"
        />
      )}

      {/* Subtle ambient lighting vignette */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(circle at 50% 30%, rgba(52, 211, 153, 0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Top Header Panel */}
      <FocusHeader
        sessionsCompletedToday={sessionsCompletedToday}
        totalFocusMinutesToday={totalFocusMinutesToday}
        onBackClick={handleBackClick}
      />

      {/* Centered Focus Viewport Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: 0,
        zIndex: 1,
        padding: '0.25rem 0'
      }}>
        {/* Main Focus Timer Card */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '820px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'rgba(9, 9, 13, 0.88)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '1.75rem 2.25rem',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.85)',
          gap: '1.35rem'
        }}>
          {/* Mode Presets, Notices & Circular Clock */}
          <FocusTimerDisplay
            mode={mode}
            customMinutes={customMinutes}
            handleModeChange={handleModeChange}
            timeLeft={timeLeft}
            duration={duration}
            isRunning={isRunning}
          />

          {/* Controls: Reset / Play-Pause / Mute */}
          <FocusControls
            isRunning={isRunning}
            resetTimer={resetTimer}
            handleTogglePlay={handleTogglePlay}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            soundType={soundType}
          />

          {/* Ambient Sound & Task Drawer */}
          <FocusTaskBar
            soundType={soundType}
            setSoundType={setSoundType}
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            setSelectedTaskId={setSelectedTaskId}
            isAddingTask={isAddingTask}
            setIsAddingTask={setIsAddingTask}
            newTaskTitle={newTaskTitle}
            setNewTaskTitle={setNewTaskTitle}
            isCreatingTask={isCreatingTask}
            handleCreateQuickTask={handleCreateQuickTask}
            handleToggleTaskStatus={handleToggleTaskStatus}
            mode={mode}
            customMinutes={customMinutes}
            setCustomMinutes={setCustomMinutes}
            handleModeChange={handleModeChange}
            volume={volume}
            setVolume={setVolume}
            particlesEnabled={particlesEnabled}
            setParticlesEnabled={setParticlesEnabled}
            particleSpeedIndex={particleSpeedIndex}
            setParticleSpeedIndex={setParticleSpeedIndex}
          />
        </div>
      </div>

      {/* Completion XP Celebration Modal */}
      <FocusCelebrationModal
        showCelebration={showCelebration}
        setShowCelebration={setShowCelebration}
        awardedXp={awardedXp}
        selectedTaskId={selectedTaskId}
        tasks={tasks}
        handleToggleTaskStatus={handleToggleTaskStatus}
        sessionNotes={sessionNotes}
        setSessionNotes={setSessionNotes}
      />

      {/* Humorous Exit Confirmation Modal */}
      <FocusExitModal
        mounted={mounted}
        showExitModal={showExitModal}
        exitQuoteIndex={exitQuoteIndex}
        cancelExit={cancelExit}
        confirmExit={confirmExit}
      />

      {/* Inline styles for pulse and animations */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.04; }
          50% { transform: scale(1.15); opacity: 0.12; }
        }
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
