'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Maximize2, Minimize2, 
  Volume2, VolumeX, Sparkles, Clock, ArrowLeft, 
  CheckCircle2, AlertCircle, Award
} from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';

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
  const toast = useToast();

  // Timer Configuration
  const [mode, setMode] = useState('focus'); // focus | shortBreak | longBreak | custom
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [duration, setDuration] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);

  // Stats Counters
  const [sessionsCompletedToday, setSessionsCompletedToday] = useState(0);
  const [totalFocusMinutesToday, setTotalFocusMinutesToday] = useState(0);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sound Synth Configuration
  const [soundType, setSoundType] = useState('none'); // none | rain | noise | beats | ticking
  const [volume, setVolume] = useState(50); // 0-100
  const [isMuted, setIsMuted] = useState(false);

  // Planner Task Linkage
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [awardedXp, setAwardedXp] = useState(0);

  // Refs for audio nodes and interval
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const activeSourcesRef = useRef([]);
  const metronomeRef = useRef(null);

  // 1. Fetch Today's Tasks & Completed Sessions
  const loadInitialData = useCallback(async () => {
    try {
      // Fetch tasks
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const tasksRes = await apiFetch(`/api/planner?start=${todayStr}&end=${todayStr}`);
      const tasksData = await tasksRes.json();
      if (tasksData.success) {
        setTasks(tasksData.data || []);
      }

      // Fetch completed sessions
      const sessionsRes = await apiFetch('/api/study/sessions');
      const sessionsData = await sessionsRes.json();
      if (sessionsData.success) {
        const list = sessionsData.data || [];
        // Filter sessions completed today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todaySessions = list.filter(s => new Date(s.createdAt) >= startOfDay);
        setSessionsCompletedToday(todaySessions.length);
        const mins = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
        setTotalFocusMinutesToday(mins);
      }
    } catch (err) {
      console.error('Failed to load initial focus data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Track Fullscreen Change Event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 3. Audio Context & Master Gain Initializer
  const initAudio = () => {
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
  };

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
  }, [stopAmbientSounds, volume, isMuted]);

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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopAmbientSounds]);

  // 6. Mode Switch Logic
  const handleModeChange = (newMode, minutes) => {
    setMode(newMode);
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    const secs = minutes * 60;
    setTimeLeft(secs);
    setDuration(secs);
  };

  // 7. Save Focus Session API Call
  const logFocusSession = async () => {
    const focusedMinutes = Math.max(1, Math.round(duration / 60));
    try {
      const payload = {
        durationMinutes: focusedMinutes,
        taskId: selectedTaskId || null,
        notes: sessionNotes || 'Focused session'
      };
      
      const res = await apiFetch('/api/study/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        // Calculate XP
        const xpEarned = Math.max(5, Math.round(focusedMinutes / 5) * 5);
        setAwardedXp(xpEarned);
        setShowCelebration(true);
        loadInitialData(); // Reload stats
        toast.success(`Session saved! You earned ${xpEarned} XP.`);
      }
    } catch (err) {
      console.error('Failed to save study session:', err);
      toast.error('Session finished! Failed to log XP to server.');
    }
  };

  // 8. Timer Ticker Loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            clearInterval(timerRef.current);
            playZenBell();
            logFocusSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, duration, selectedTaskId, sessionNotes]);

  // 9. Fullscreen Actions
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        toast.error('Fullscreen mode not supported on this browser');
      });
    } else {
      document.exitFullscreen();
    }
  };

  // 10. Format Time MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Circular progress calculations
  const progressPercent = duration > 0 ? (timeLeft / duration) * 100 : 0;
  const radius = 120;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: isFullscreen ? '100vh' : 'calc(100vh - 120px)',
      background: isFullscreen ? '#0b0b0f' : 'transparent',
      padding: isFullscreen ? '2rem' : '0',
      transition: 'all 0.3s ease-in-out',
      position: 'relative',
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Background Particles Decoration */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(circle at center, rgba(180, 255, 100, 0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Header Panel */}
      <div style={{
        position: isFullscreen ? 'absolute' : 'relative',
        top: isFullscreen ? '2rem' : '0',
        left: isFullscreen ? '2rem' : '0',
        right: isFullscreen ? '2rem' : '0',
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
        marginBottom: isFullscreen ? '0' : '1.5rem',
        padding: '0 1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isFullscreen && (
            <Link href="/dashboard" className="icon-btn" title="Back to Dashboard">
              <ArrowLeft size={20} />
            </Link>
          )}
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Focus Workspace</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Completed today: {sessionsCompletedToday} sessions ({totalFocusMinutesToday} mins)
            </p>
          </div>
        </div>

        <button className="icon-btn" onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>

      {/* Timer & Core Workspace */}
      <div style={{
        flex: 1,
        width: '100%',
        maxWidth: '700px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        gap: '2.5rem'
      }}>
        {/* Toggle Mode Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-light)',
          padding: '4px',
          borderRadius: 'var(--radius-full)',
          backdropFilter: 'blur(10px)',
          gap: '2px'
        }}>
          <button 
            onClick={() => handleModeChange('focus', 25)}
            style={{ 
              border: 'none', 
              padding: '6px 16px', 
              fontSize: '0.85rem', 
              cursor: 'pointer', 
              borderRadius: 'var(--radius-full)',
              background: mode === 'focus' ? 'var(--text-primary)' : 'transparent',
              color: mode === 'focus' ? '#121212' : 'var(--text-muted)',
              fontWeight: mode === 'focus' ? 700 : 500,
              transition: 'all 0.2s'
            }}
          >
            Focus (25m)
          </button>
          <button 
            onClick={() => handleModeChange('shortBreak', 5)}
            style={{ 
              border: 'none', 
              padding: '6px 16px', 
              fontSize: '0.85rem', 
              cursor: 'pointer', 
              borderRadius: 'var(--radius-full)',
              background: mode === 'shortBreak' ? 'var(--text-primary)' : 'transparent',
              color: mode === 'shortBreak' ? '#121212' : 'var(--text-muted)',
              fontWeight: mode === 'shortBreak' ? 700 : 500,
              transition: 'all 0.2s'
            }}
          >
            Short Break (5m)
          </button>
          <button 
            onClick={() => handleModeChange('longBreak', 15)}
            style={{ 
              border: 'none', 
              padding: '6px 16px', 
              fontSize: '0.85rem', 
              cursor: 'pointer', 
              borderRadius: 'var(--radius-full)',
              background: mode === 'longBreak' ? 'var(--text-primary)' : 'transparent',
              color: mode === 'longBreak' ? '#121212' : 'var(--text-muted)',
              fontWeight: mode === 'longBreak' ? 700 : 500,
              transition: 'all 0.2s'
            }}
          >
            Long Break (15m)
          </button>
          <button 
            onClick={() => handleModeChange('custom', customMinutes)}
            style={{ 
              border: 'none', 
              padding: '6px 16px', 
              fontSize: '0.85rem', 
              cursor: 'pointer', 
              borderRadius: 'var(--radius-full)',
              background: mode === 'custom' ? 'var(--text-primary)' : 'transparent',
              color: mode === 'custom' ? '#121212' : 'var(--text-muted)',
              fontWeight: mode === 'custom' ? 700 : 500,
              transition: 'all 0.2s'
            }}
          >
            Custom
          </button>
        </div>

        {/* Circular Immersive Clock */}
        <div style={{
          position: 'relative',
          width: '280px',
          height: '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Radial breathing background glow */}
          <div style={{
            position: 'absolute',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: isRunning ? 'var(--brand)' : 'transparent',
            opacity: 0.04,
            filter: 'blur(30px)',
            transition: 'all 0.5s ease',
            animation: isRunning ? 'pulse 3s infinite ease-in-out' : 'none'
          }} />

          <svg width="280" height="280" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
            {/* Track Circle */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke="rgba(255, 255, 255, 0.02)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress Circle */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke={mode.includes('Break') ? '#eab308' : 'var(--brand)'}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.5s ease-out'
              }}
            />
          </svg>

          {/* Time text inside the clock */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 1
          }}>
            <span style={{
              fontSize: '3.6rem',
              fontWeight: 800,
              fontFamily: 'var(--font-geist, monospace)',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              lineHeight: 1,
              filter: 'drop-shadow(0 0 10px rgba(180, 255, 100, 0.2))'
            }}>
              {formatTime(timeLeft)}
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: '8px',
              fontWeight: 600
            }}>
              {mode === 'focus' ? 'Stay Focused' : mode.includes('Break') ? 'Take a Break' : 'Focus Session'}
            </span>
          </div>
        </div>

        {/* Timer Control Panel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button 
            className="icon-btn" 
            onClick={() => handleModeChange(mode, mode === 'custom' ? customMinutes : mode === 'focus' ? 25 : mode === 'shortBreak' ? 5 : 15)} 
            title="Reset"
            style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '50%', border: '1px solid var(--border-light)' }}
          >
            <RotateCcw size={18} />
          </button>
          
          <button 
            onClick={() => setIsRunning(!isRunning)} 
            style={{ 
              padding: '1.25rem 2.5rem', 
              background: isRunning ? 'rgba(255,255,255,0.05)' : 'var(--brand)', 
              color: isRunning ? 'var(--text-primary)' : '#000',
              border: isRunning ? '1px solid var(--border-light)' : 'none',
              borderRadius: 'var(--radius-full)',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: isRunning ? 'none' : '0 10px 25px rgba(180, 255, 100, 0.3)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {isRunning ? (
              <>
                <Pause size={18} fill="currentColor" /> Pause
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" /> Start Focus
              </>
            )}
          </button>

          {/* Sound Mute Toggle */}
          <button 
            className="icon-btn" 
            onClick={() => setIsMuted(!isMuted)} 
            title={isMuted ? "Unmute sound" : "Mute sound"}
            disabled={soundType === 'none'}
            style={{ 
              padding: '12px', 
              background: 'rgba(255,255,255,0.02)', 
              borderRadius: '50%', 
              border: '1px solid var(--border-light)',
              opacity: soundType === 'none' ? 0.3 : 1 
            }}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        {/* Ambient Settings Drawer */}
        <div className="glass-panel" style={{
          width: '100%',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          border: '1px solid var(--border-light)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Ambient Sound Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Ambient Sound
              </label>
              <select
                className="select"
                value={soundType}
                onChange={(e) => setSoundType(e.target.value)}
                style={{ height: '36px', fontSize: '0.85rem' }}
              >
                <option value="none">Silence (No Sound)</option>
                <option value="rain">Relaxing Rain</option>
                <option value="noise">White Noise</option>
                <option value="beats">Deep Focus (Binaural Beats)</option>
                <option value="ticking">Ticking Metronome</option>
              </select>
            </div>

            {/* Linked Planner Task */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Associate Task
              </label>
              <select
                className="select"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                style={{ height: '36px', fontSize: '0.85rem' }}
              >
                <option value="">None (General Study)</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.status === 'done' ? '✓ ' : ''}{t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Render sliders depending on custom/sound selections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
            {mode === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '100px' }}>Custom Time:</span>
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
                  style={{ flex: 1, accentColor: 'var(--brand)' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, width: '40px', textAlign: 'right' }}>{customMinutes}m</span>
              </div>
            )}

            {soundType !== 'none' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '100px' }}>Sound Vol:</span>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--brand)' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, width: '40px', textAlign: 'right' }}>{volume}%</span>
              </div>
            )}
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
