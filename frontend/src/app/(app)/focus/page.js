'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { 
  Play, Pause, RotateCcw, 
  Volume2, VolumeX, Sparkles, ArrowLeft, Award,
  ChevronDown, Plus, CheckCircle2, Circle, X,
  Eye, EyeOff, Gauge
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import StarsGalaxy from '@/components/StarsGalaxy';
import { useFocusTimer, PARTICLE_SPEEDS, HUMOROUS_EXIT_QUOTES } from '@/lib/FocusContext';

const createBrownNoise = (ctx) => {
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut * 0.99 + white * 0.01);
    lastOut = data[i];
    data[i] *= 3.5; // Scale up for better gain matching
  }
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;
  return source;
};

export default function FocusPage() {
  const router = useRouter();
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
    showExitModal, setShowExitModal,
    exitQuoteIndex,
    pendingNavUrl,
    cancelExit,
    confirmExit,
    handleTogglePlay,
    handleModeChange,
    resetTimer,
    handleInitiateExit,
    handleBackClick
  } = useFocusTimer();

  // Task Quick Add State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  // Refs for local audio synthesis
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const activeSourcesRef = useRef([]);
  const metronomeRef = useRef(null);

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
    } catch (err) {
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
    } catch (err) {
      toast.error('Failed to update task status');
    }
  };


  // 3. Audio Context & Master Gain Initializer
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(isMuted ? 0 : volume / 100, ctx.currentTime);
      masterGain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterGainRef.current = masterGain;
    }
    // Resume context if suspended (browser autoplay policy)
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, [isMuted, volume]);

  // 4. Update Volume
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const volVal = isMuted ? 0 : volume / 100;
      masterGainRef.current.gain.setValueAtTime(volVal, audioCtxRef.current.currentTime);
    }
  }, [volume, isMuted]);

  // 5. Sound Generators
  const stopAmbientSounds = useCallback(() => {
    // Stop all active sources
    activeSourcesRef.current.forEach(src => {
      try { src.stop(); } catch(e) {}
    });
    activeSourcesRef.current = [];

    // Stop metronome ticking if running
    if (metronomeRef.current) {
      metronomeRef.current.stop();
      metronomeRef.current = null;
    }
  }, []);

  const playZenBell = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    
    // Create localized transient gain node for the bell
    const bellGain = ctx.createGain();
    bellGain.gain.setValueAtTime(0, now);
    bellGain.gain.linearRampToValueAtTime(0.5, now + 0.1);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 7.0);
    bellGain.connect(ctx.destination);

    // Multi-harmonicTibetan singing bowl frequencies (fundamental + clean partials)
    const frequencies = [220, 442, 663, 885, 1107, 1330];
    
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Higher overtones decay faster
      const decayFactor = 1.0 - (idx * 0.12);
      overtoneGain.gain.setValueAtTime(0.12 / frequencies.length, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 7.0 * Math.max(0.1, decayFactor));
      
      osc.connect(overtoneGain);
      overtoneGain.connect(bellGain);
      osc.start(now);
      osc.stop(now + 7.2);
    });
  };

  const startAmbientSound = useCallback((type) => {
    initAudio();
    stopAmbientSounds();

    if (type === 'none' || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const output = masterGainRef.current;

    if (type === 'noise') {
      // Warm Brownian Noise (Deep Ocean)
      const source = createBrownNoise(ctx);
      source.connect(output);
      source.start();
      activeSourcesRef.current.push(source);
    } else if (type === 'rain') {
      // Soothing Rain Synth (rumble + scheduled raindrop clicks)
      const rumble = createBrownNoise(ctx);
      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(450, ctx.currentTime);
      rumble.connect(rumbleFilter);
      rumbleFilter.connect(output);
      rumble.start();
      activeSourcesRef.current.push(rumble);

      let timerId = null;
      const scheduler = () => {
        const nextDropDelay = 0.015 + Math.random() * 0.035;
        playRaindrop(ctx, ctx.currentTime + nextDropDelay, output);
        timerId = setTimeout(scheduler, nextDropDelay * 1000);
      };

      const playRaindrop = (context, time, out) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        const filter = context.createBiquadFilter();

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(700 + Math.random() * 1100, time);
        filter.Q.value = 6;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.012 + Math.random() * 0.008, time + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.015 + Math.random() * 0.025);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(out);

        osc.start(time);
        osc.stop(time + 0.05);
      };

      scheduler();
      metronomeRef.current = { stop: () => {
        clearTimeout(timerId);
      } };
    } else if (type === 'beats') {
      // Deep focus binaural beats (100Hz Left, 104Hz Right) + Low Pass Brownian noise blanket
      const noise = createBrownNoise(ctx);
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(140, ctx.currentTime);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, ctx.currentTime);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(output);
      noise.start();
      activeSourcesRef.current.push(noise);

      const oscL = ctx.createOscillator();
      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(100, ctx.currentTime);
      
      const oscR = ctx.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(104, ctx.currentTime);

      const pannerL = ctx.createStereoPanner();
      pannerL.pan.setValueAtTime(-1, ctx.currentTime);
      const pannerR = ctx.createStereoPanner();
      pannerR.pan.setValueAtTime(1, ctx.currentTime);

      const beatGain = ctx.createGain();
      beatGain.gain.setValueAtTime(0.2, ctx.currentTime);

      oscL.connect(pannerL);
      pannerL.connect(beatGain);

      oscR.connect(pannerR);
      pannerR.connect(beatGain);

      beatGain.connect(output);

      oscL.start();
      oscR.start();

      activeSourcesRef.current.push(oscL, oscR);
    } else if (type === 'ticking') {
      // Vintage Wooden Clock Ticking
      let nextTickTime = ctx.currentTime;
      let timerId = null;

      const scheduler = () => {
        while (nextTickTime < ctx.currentTime + 0.1) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(220, nextTickTime);
          filter.Q.value = 6;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(120, nextTickTime);
          
          gain.gain.setValueAtTime(0.06, nextTickTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, nextTickTime + 0.04);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(output);
          
          osc.start(nextTickTime);
          osc.stop(nextTickTime + 0.05);
          
          nextTickTime += 1.0;
        }
        timerId = setTimeout(scheduler, 50);
      };
      
      scheduler();
      metronomeRef.current = { stop: () => clearTimeout(timerId) };
    }
  }, [initAudio, stopAmbientSounds]);

  // Restart/stop sounds when type changes or play starts/pauses
  useEffect(() => {
    if (isRunning && soundType !== 'none') {
      startAmbientSound(soundType);
    } else {
      stopAmbientSounds();
    }
  }, [soundType, isRunning, startAmbientSound, stopAmbientSounds]);

  // Cleanup sounds on component unmount
  useEffect(() => {
    return () => {
      stopAmbientSounds();
    };
  }, [stopAmbientSounds]);

  // Format Time MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Circular progress calculations
  const progressPercent = duration > 0 ? (timeLeft / duration) * 100 : 0;
  const radius = 110;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

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

      {/* Top Header Panel (Full Width, Left-Aligned with Big Header & Subheader) */}
      <div style={{
        position: 'relative',
        width: '100%',
        margin: '0 0 0.5rem 0',
        padding: '0 0.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        zIndex: 10,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={handleBackClick}
            className="icon-btn"
            title="Exit Focus Mode"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              color: '#f4f4f6',
              borderRadius: '10px',
              padding: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft size={19} />
          </button>
          <div>
            <h1 style={{
              fontSize: '1.9rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1.15
            }}>
              Focus Timer
            </h1>
            <p style={{
              fontSize: '0.92rem',
              color: '#9ca3af',
              margin: '3px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              Today: <strong style={{ color: '#ffffff', fontWeight: 700 }}>{sessionsCompletedToday}</strong> sessions
              <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>{totalFocusMinutesToday} mins focused</span>
            </p>
          </div>
        </div>
      </div>

      {/* Centered Focus Viewport Container (Centers Focus Box Vertically & Horizontally) */}
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
        {/* Main Focus Timer Card (Generous & Spacious Size) */}
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
          {/* Mode Presets */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '3px',
          borderRadius: '30px',
          gap: '4px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {[
            { m: 'focus', mins: 25, label: 'Focus (25m)' },
            { m: 'shortBreak', mins: 5, label: 'Short Break (5m)' },
            { m: 'longBreak', mins: 15, label: 'Long Break (15m)' },
            { m: 'custom', mins: customMinutes, label: 'Custom' }
          ].map(({ m, mins, label }) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m, mins)}
              style={{
                border: 'none',
                padding: '6px 16px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                borderRadius: '20px',
                background: mode === m ? '#ffffff' : 'transparent',
                color: mode === m ? '#000000' : '#a1a1ad',
                fontWeight: mode === m ? 700 : 500,
                transition: 'all 0.2s ease'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Dual Info Callouts: Fullscreen & Practice Section Notice */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          width: '100%',
          maxWidth: '680px'
        }}>
          {/* Info 1: Fullscreen Info */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            background: 'rgba(52, 211, 153, 0.08)',
            border: '1px solid rgba(52, 211, 153, 0.22)',
            borderRadius: '20px',
            fontSize: '0.74rem',
            color: '#a7f3d0'
          }}>
            <span style={{ color: '#34d399', fontWeight: 700 }}>✦ Fullscreen:</span>
            <span>Automatically enters full screen mode when started</span>
          </div>

          {/* Info 2: Practice Section Notice */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.24)',
            borderRadius: '20px',
            fontSize: '0.74rem',
            color: '#fde68a'
          }}>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>⚠ Practice Notice:</span>
            <span>Timer ends automatically if you move to Practice section</span>
          </div>
        </div>

        {/* Circular Immersive Clock (260px diameter) */}
        <div style={{
          position: 'relative',
          width: '260px',
          height: '260px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Breathing ambient glow */}
          <div style={{
            position: 'absolute',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: isRunning ? (mode.includes('Break') ? '#f59e0b' : '#34d399') : 'transparent',
            opacity: 0.08,
            filter: 'blur(35px)',
            transition: 'all 0.5s ease',
            animation: isRunning ? 'pulse 3s infinite ease-in-out' : 'none'
          }} />

          <svg width="260" height="260" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
            <circle
              cx="130"
              cy="130"
              r={radius}
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx="130"
              cy="130"
              r={radius}
              stroke={mode.includes('Break') ? '#f5a623' : '#34d399'}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
            />
          </svg>

          {/* Time digits */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 1
          }}>
            <span style={{
              fontSize: '3.6rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums'
            }}>
              {formatTime(timeLeft)}
            </span>
            <span style={{
              fontSize: '0.72rem',
              color: '#a1a1ad',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginTop: '8px',
              fontWeight: 600
            }}>
              {mode === 'focus' ? 'Focus Session' : mode.includes('Break') ? 'Zen Break' : 'Custom Session'}
            </span>
          </div>
        </div>

        {/* Timer Control Panel (Play / Pause / Reset / Mute) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="icon-btn"
            onClick={resetTimer}
            title="Reset Session"
            style={{
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f4f4f6',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={15} />
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            style={{
              padding: '0.85rem 2rem',
              background: isRunning ? 'rgba(255, 255, 255, 0.1)' : '#ffffff',
              color: isRunning ? '#ffffff' : '#000000',
              border: isRunning ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
              borderRadius: '32px',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isRunning ? 'none' : '0 4px 18px rgba(255, 255, 255, 0.2)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {isRunning ? (
              <>
                <Pause size={16} fill="currentColor" /> Pause
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" /> Start Focus
              </>
            )}
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute sound' : 'Mute sound'}
            disabled={soundType === 'none'}
            style={{
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f4f4f6',
              opacity: soundType === 'none' ? 0.35 : 1,
              cursor: soundType === 'none' ? 'not-allowed' : 'pointer'
            }}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>

        {/* Ambient Sound & Task Association Drawer */}
        <div style={{
          width: '100%',
          padding: '1.25rem 1.5rem',
          background: 'rgba(255, 255, 255, 0.035)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Ambient Sound */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a1a1ad', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Ambient Sound
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <select
                  value={soundType}
                  onChange={(e) => setSoundType(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    fontSize: '0.84rem',
                    background: '#121217',
                    color: '#f4f4f6',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '8px',
                    padding: '0 34px 0 12px',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="none">Silence (No Sound)</option>
                  <option value="rain">Relaxing Rain</option>
                  <option value="noise">White Noise</option>
                  <option value="beats">Binaural Beats</option>
                  <option value="ticking">Metronome</option>
                </select>
                <ChevronDown
                  size={15}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}
                />
              </div>
            </div>

            {/* Linked Task with Quick Add */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a1a1ad', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Linked Task
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingTask(!isAddingTask)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#34d399',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: 0
                  }}
                >
                  <Plus size={12} /> {isAddingTask ? 'Cancel' : 'Quick Add'}
                </button>
              </div>

              {isAddingTask ? (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="New task title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateQuickTask();
                    }}
                    style={{
                      flex: 1,
                      height: '38px',
                      padding: '0 12px',
                      background: '#121217',
                      border: '1px solid rgba(52, 211, 153, 0.45)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      outline: 'none'
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateQuickTask}
                    disabled={isCreatingTask || !newTaskTitle.trim()}
                    style={{
                      height: '38px',
                      padding: '0 14px',
                      background: '#34d399',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      opacity: !newTaskTitle.trim() ? 0.5 : 1
                    }}
                  >
                    {isCreatingTask ? '...' : 'Add'}
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%' }}>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    style={{
                      width: '100%',
                      height: '38px',
                      fontSize: '0.84rem',
                      background: '#121217',
                      color: '#f4f4f6',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '8px',
                      padding: '0 34px 0 12px',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">None (General Focus)</option>
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.status === 'done' ? '✓ ' : ''}{t.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Linked Task Active Status Pill */}
          {(() => {
            const linkedTask = tasks.find((t) => t.id === selectedTaskId);
            if (!linkedTask) return null;
            return (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(52, 211, 153, 0.08)',
                border: '1px solid rgba(52, 211, 153, 0.22)',
                borderRadius: '8px',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleTaskStatus(linkedTask.id, linkedTask.status === 'done' ? 'todo' : 'done')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: linkedTask.status === 'done' ? '#34d399' : 'rgba(255, 255, 255, 0.4)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={linkedTask.status === 'done' ? 'Mark as Incomplete' : 'Mark as Done'}
                  >
                    {linkedTask.status === 'done' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </button>
                  <span style={{
                    color: '#ffffff',
                    fontWeight: 600,
                    textDecoration: linkedTask.status === 'done' ? 'line-through' : 'none',
                    opacity: linkedTask.status === 'done' ? 0.7 : 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {linkedTask.title}
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: linkedTask.status === 'done' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: linkedTask.status === 'done' ? '#34d399' : '#f59e0b',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {linkedTask.status === 'done' ? 'DONE' : 'IN PROGRESS'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTaskId('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    marginLeft: '8px'
                  }}
                  title="Unlink task"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })()}

          {/* Slider for volume or custom duration */}
          {mode === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ fontSize: '0.74rem', color: '#a1a1ad' }}>Minutes:</span>
              <input
                type="range"
                min="1"
                max="120"
                value={customMinutes}
                onChange={(e) => {
                  const mins = parseInt(e.target.value);
                  setCustomMinutes(mins);
                  handleModeChange('custom', mins);
                }}
                style={{ flex: 1, accentColor: '#34d399' }}
              />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', width: '34px', textAlign: 'right' }}>{customMinutes}m</span>
            </div>
          )}

          {soundType !== 'none' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ fontSize: '0.74rem', color: '#a1a1ad' }}>Volume:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: '#34d399' }}
              />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', width: '34px', textAlign: 'right' }}>{volume}%</span>
            </div>
          )}

          {/* Cosmic Background Drift Settings */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.85rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <span style={{ fontSize: '0.74rem', color: '#a1a1ad', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Background:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setParticlesEnabled(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  background: particlesEnabled ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                  border: particlesEnabled ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid rgba(255, 255, 255, 0.14)',
                  color: particlesEnabled ? '#34d399' : '#a1a1ad',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title={particlesEnabled ? 'Turn off galaxy stars during session' : 'Turn on galaxy stars during session'}
              >
                {particlesEnabled ? <Sparkles size={13} /> : <EyeOff size={13} />}
                <span>{particlesEnabled ? 'Galaxy Stars' : 'Stars Off'}</span>
              </button>

              {particlesEnabled && (
                <button
                  type="button"
                  onClick={() => setParticleSpeedIndex(prev => (prev + 1) % PARTICLE_SPEEDS.length)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    color: '#f4f4f6',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title="Cycle cosmic drift speed"
                >
                  <Gauge size={13} color="#34d399" />
                  <span>{PARTICLE_SPEEDS[particleSpeedIndex].label}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Completion XP Celebration Modal */}
      {showCelebration && (
        <div className="dialog-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="glass-panel" style={{
            width: '90%',
            maxWidth: '420px',
            padding: '2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            boxShadow: '0 20px 50px rgba(180,255,100,0.15)',
            border: '1px solid rgba(180,255,100,0.3)',
            animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(180, 255, 100, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand)',
              boxShadow: 'inset 0 0 15px rgba(180, 255, 100, 0.2)'
            }}>
              <Award size={32} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>Focus Complete!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Brilliant job! You completed your focus session.
              </p>
            </div>

            {/* XP Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--brand)',
              fontWeight: 700,
              fontSize: '1rem'
            }}>
              <Sparkles size={16} /> +{awardedXp} XP Awarded
            </div>

            {/* Quick action to complete linked task */}
            {selectedTaskId && (() => {
              const linkedTask = tasks.find(t => t.id === selectedTaskId);
              if (linkedTask && linkedTask.status !== 'done') {
                return (
                  <button
                    type="button"
                    onClick={() => handleToggleTaskStatus(linkedTask.id, 'done')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: 'rgba(52, 211, 153, 0.12)',
                      border: '1px solid rgba(52, 211, 153, 0.35)',
                      borderRadius: '8px',
                      color: '#34d399',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    <CheckCircle2 size={16} /> Mark &ldquo;{linkedTask.title}&rdquo; as Completed
                  </button>
                );
              }
              return null;
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px', marginTop: '8px' }}>
              <input
                type="text"
                className="input"
                placeholder="Add focus notes (e.g. studied math chapter 3)..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowCelebration(false);
                  setSessionNotes('');
                }}
                style={{ width: '100%', padding: '10px' }}
              >
                Collect XP & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Humorous Exit Confirmation Modal (Rendered to Body Portal) */}
      {mounted && showExitModal && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            backdropFilter: 'blur(16px)',
            background: 'rgba(0, 0, 0, 0.85)',
            padding: '1.25rem',
            boxSizing: 'border-box'
          }}
          onClick={cancelExit}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '460px',
              padding: '2.25rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 45px rgba(52, 211, 153, 0.22)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '24px',
              background: '#0d0d14',
              animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                {HUMOROUS_EXIT_QUOTES[exitQuoteIndex]?.title || 'Leaving so soon, Space Cadet?'}
              </h2>
              <p style={{ color: '#d1d5db', fontSize: '0.94rem', lineHeight: '1.55', margin: 0 }}>
                {HUMOROUS_EXIT_QUOTES[exitQuoteIndex]?.msg || "Don't break your momentum. Stay and finish strong."}
              </p>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: '10px',
              marginTop: '8px'
            }}>
              <button
                type="button"
                onClick={cancelExit}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#34d399',
                  color: '#000000',
                  border: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 18px rgba(52, 211, 153, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                Stay and Finish
              </button>

              <button
                type="button"
                onClick={() => confirmExit('/dashboard')}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.55)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Surrender and Exit
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Inline styles for pulse and slideUp animations */}
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
