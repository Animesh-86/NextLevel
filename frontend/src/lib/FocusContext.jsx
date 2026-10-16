'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/api';

const FocusContext = createContext(null);

export const PARTICLE_SPEEDS = [
  { label: '0.2x Zen', multiplier: 0.5 },
  { label: '0.5x Slow', multiplier: 1.0 },
  { label: '1.0x Cosmic', multiplier: 1.8 },
  { label: '2.0x Warp', multiplier: 3.2 }
];

export const HUMOROUS_EXIT_QUOTES = [
  {
    title: "Leaving so soon, Space Cadet?",
    msg: "The dopamine you're looking for isn't on Instagram... stay here and finish what you started."
  },
  {
    title: "Hold up, Legend!",
    msg: "Even my CPU is running hotter than your focus session right now. Don't break your momentum."
  },
  {
    title: "Your future self is watching...",
    msg: "They just sent a reminder: don't click exit, finish this session strong."
  },
  {
    title: "A bug is holding its breath...",
    msg: "Ancient folklore says every time you quit focus mode early, an unexplained bug is born into production."
  },
  {
    title: "Your goals just sent a ping!",
    msg: "They are wondering why you are leaving in the middle of an active session. Stay and conquer."
  }
];

export function FocusProvider({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  // Core Timer State
  const [mode, setMode] = useState('focus'); // focus | shortBreak | longBreak | custom
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [duration, setDuration] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [intent, setIntent] = useState('');

  // Background Particles State
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [particleSpeedIndex, setParticleSpeedIndex] = useState(1); // 0.5x Slow

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sound Synth Configuration
  const [soundType, setSoundType] = useState('none'); // none | rain | noise | beats | ticking
  const [volume, setVolume] = useState(50); // 0-100
  const [isMuted, setIsMuted] = useState(false);

  // Planner Task Linkage
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [customTaskTitle, setCustomTaskTitle] = useState('');
  const selectedTaskTitle = tasks.find(t => t.id === selectedTaskId)?.title || customTaskTitle || '';

  // Daily Stats
  const [sessionsCompletedToday, setSessionsCompletedToday] = useState(0);
  const [totalFocusMinutesToday, setTotalFocusMinutesToday] = useState(0);

  // Celebration Modal
  const [showCelebration, setShowCelebration] = useState(false);
  const [awardedXp, setAwardedXp] = useState(0);

  // Exit Confirmation Modal
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitQuoteIndex, setExitQuoteIndex] = useState(0);
  const [pendingNavUrl, setPendingNavUrl] = useState('/dashboard');

  // Refs for audio and interval
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const activeSourcesRef = useRef([]);
  const metronomeRef = useRef(null);

  const isRunningRef = useRef(isRunning);
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const wasFullscreenRef = useRef(false);
  const isIntentionalExitRef = useRef(false);

  // Exit modal helpers
  const handleInitiateExit = useCallback((targetUrl = '/dashboard') => {
    setPendingNavUrl(targetUrl);
    setExitQuoteIndex(Math.floor(Math.random() * HUMOROUS_EXIT_QUOTES.length));
    setShowExitModal(true);
  }, []);

  const cancelExit = useCallback(() => {
    setShowExitModal(false);
    const isNowFullscreen = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement
    );
    if (!isNowFullscreen) {
      const el = document.documentElement;
      const requestMethod = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (requestMethod) {
        requestMethod.call(el).then(() => {
          wasFullscreenRef.current = true;
        }).catch(() => {});
      }
    }
  }, []);

  const confirmExit = useCallback((targetUrl = null) => {
    isIntentionalExitRef.current = true;
    const isNowFullscreen = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement
    );
    if (isNowFullscreen) {
      const exitMethod = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (exitMethod) {
        exitMethod.call(document).catch(() => {});
      }
    }
    setIsRunning(false);
    isRunningRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(duration);
    setShowExitModal(false);
    router.push(targetUrl || pendingNavUrl || '/dashboard');
  }, [duration, pendingNavUrl, router]);

  // Sync fullscreen change with document & prompt confirmation if exiting fullscreen during active focus
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      setIsFullscreen(isNowFullscreen);

      const isFocusPage = typeof window !== 'undefined' && (
        window.location.pathname === '/focus' ||
        pathname === '/focus' ||
        pathname?.startsWith('/focus')
      );

      // If user exited fullscreen while on /focus during an active session
      if (!isNowFullscreen && isRunningRef.current && isFocusPage && !isIntentionalExitRef.current) {
        handleInitiateExit('/dashboard');
      }

      wasFullscreenRef.current = isNowFullscreen;
      isIntentionalExitRef.current = false;
    };

    const handleKeyDown = (e) => {
      const isFocusPage = typeof window !== 'undefined' && (
        window.location.pathname === '/focus' ||
        pathname === '/focus' ||
        pathname?.startsWith('/focus')
      );
      if (e.key === 'Escape' && isRunningRef.current && isFocusPage && !isIntentionalExitRef.current) {
        handleInitiateExit('/dashboard');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pathname, handleInitiateExit]);

  // Fetch initial tasks & stats
  const loadInitialData = useCallback(async () => {
    try {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const tasksRes = await apiFetch(`/api/planner?start=${todayStr}&end=${todayStr}`);
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        if (tasksData.success) {
          setTasks(tasksData.data || []);
        }
      }

      const sessionsRes = await apiFetch('/api/study/sessions');
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        if (sessionsData.success) {
          const list = sessionsData.data || [];
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          const todaySessions = list.filter(s => new Date(s.createdAt) >= startOfDay);
          setSessionsCompletedToday(todaySessions.length);
          const mins = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
          setTotalFocusMinutesToday(mins);
        }
      }
    } catch (err) {
      console.error('Failed to load initial focus data:', err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const fetchInit = async () => {
      try {
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const tasksRes = await apiFetch(`/api/planner?start=${todayStr}&end=${todayStr}`);
        if (active && tasksRes.ok) {
          const tasksData = await tasksRes.json();
          if (active && tasksData.success) {
            setTasks(tasksData.data || []);
          }
        }

        const sessionsRes = await apiFetch('/api/study/sessions');
        if (active && sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          if (active && sessionsData.success) {
            const list = sessionsData.data || [];
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const todaySessions = list.filter(s => new Date(s.createdAt) >= startOfDay);
            setSessionsCompletedToday(todaySessions.length);
            const mins = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
            setTotalFocusMinutesToday(mins);
          }
        }
      } catch (err) {
        console.error('Failed to load initial focus data:', err);
      }
    };
    fetchInit();
    return () => { active = false; };
  }, []);

  // Audio helper
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtxRef.current = new AudioContextClass();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.setValueAtTime(isMuted ? 0 : volume / 100, audioCtxRef.current.currentTime);
      masterGainRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, [isMuted, volume]);

  const stopAmbientSounds = useCallback(() => {
    activeSourcesRef.current.forEach(src => {
      try { src.stop(); } catch(e) {}
    });
    activeSourcesRef.current = [];
    if (metronomeRef.current) {
      metronomeRef.current.stop();
      metronomeRef.current = null;
    }
  }, []);

  const playZenBell = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    const bellGain = ctx.createGain();
    bellGain.gain.setValueAtTime(0, now);
    bellGain.gain.linearRampToValueAtTime(0.5, now + 0.1);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 7.0);
    bellGain.connect(ctx.destination);

    const frequencies = [220, 442, 663, 885, 1107, 1330];
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      const decayFactor = 1.0 - (idx * 0.12);
      overtoneGain.gain.setValueAtTime(0.12 / frequencies.length, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 7.0 * Math.max(0.1, decayFactor));
      osc.connect(overtoneGain);
      overtoneGain.connect(bellGain);
      osc.start(now);
      osc.stop(now + 7.2);
    });
  }, []);

  // Save completed session to API
  const logFocusSession = useCallback(async (customDurationSecs = null, notes = 'Focused session') => {
    const totalSecs = customDurationSecs !== null ? customDurationSecs : (duration - timeLeft);
    const focusedMinutes = Math.max(1, Math.round(totalSecs / 60));
    try {
      const payload = {
        durationMinutes: focusedMinutes,
        taskId: selectedTaskId || null,
        notes: notes
      };
      const res = await apiFetch('/api/study/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        const xpEarned = Math.max(5, Math.round(focusedMinutes / 5) * 5);
        setAwardedXp(xpEarned);
        setShowCelebration(true);
        loadInitialData();
        if (window.showGamificationToast) {
          window.showGamificationToast(xpEarned, `Completed ${focusedMinutes}m focus!`);
        } else {
          toast.success(`Session saved! You earned ${xpEarned} XP.`);
        }
      }
    } catch (err) {
      console.error('Failed to save study session:', err);
    }
  }, [duration, timeLeft, selectedTaskId, loadInitialData, toast]);

  // Mode changer
  const handleModeChange = useCallback((newMode, minutes) => {
    setMode(newMode);
    setIsRunning(false);
    isRunningRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    const secs = minutes * 60;
    setTimeLeft(secs);
    setDuration(secs);
  }, []);

  // Reset timer
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    isRunningRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    const mins = mode === 'custom' ? customMinutes : mode === 'focus' ? 25 : mode === 'shortBreak' ? 5 : 15;
    const secs = mins * 60;
    setTimeLeft(secs);
    setDuration(secs);
  }, [mode, customMinutes]);

  // Auto Fullscreen on play
  const handleTogglePlay = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      isRunningRef.current = true;
      const isNowFullscreen = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      if (!isNowFullscreen) {
        const el = document.documentElement;
        const requestMethod = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (requestMethod) {
          requestMethod.call(el).then(() => {
            wasFullscreenRef.current = true;
          }).catch(() => {});
        }
      } else {
        wasFullscreenRef.current = true;
      }
    } else {
      setIsRunning(false);
      isRunningRef.current = false;
    }
  }, [isRunning]);

  // End timer (manual or practice auto-end)
  const handleEndTimer = useCallback((reason = 'manual') => {
    setIsRunning(false);
    isRunningRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);

    if (reason === 'practice') {
      // Session interrupted by entering Practice arena: cancel cleanly, NO XP, NO completion celebration
      toast.warning('Focus session cancelled because you entered Practice. No session recorded.', { duration: 5000 });
      setTimeLeft(duration);
      return;
    }

    setTimeLeft(duration);
  }, [duration, toast]);

  // Check Practice section auto-end
  useEffect(() => {
    if (!isRunning || !pathname) return;
    const isPractice = (
      pathname.startsWith('/test') ||
      pathname.startsWith('/exams') ||
      pathname.startsWith('/interview') ||
      pathname.startsWith('/manage') ||
      pathname.startsWith('/results') ||
      pathname.startsWith('/review')
    );
    if (isPractice) {
      const timer = setTimeout(() => {
        handleEndTimer('practice');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [pathname, isRunning, handleEndTimer]);

  // Ticker loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            clearInterval(timerRef.current);
            playZenBell();
            logFocusSession(duration, 'Completed full session');
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
  }, [isRunning, duration, playZenBell, logFocusSession]);

  // Window global integration for task cards
  useEffect(() => {
    window.startFocusTimer = (minutes, taskId, taskTitle) => {
      const secs = (minutes || 25) * 60;
      setMode('focus');
      setDuration(secs);
      setTimeLeft(secs);
      if (taskId) setSelectedTaskId(taskId);
      if (taskTitle) setCustomTaskTitle(taskTitle);
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          wasFullscreenRef.current = true;
        }).catch(() => {});
      } else {
        wasFullscreenRef.current = true;
      }
      setIsRunning(true);
    };
    return () => {
      delete window.startFocusTimer;
    };
  }, []);

  // Prevent leaving platform while running
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isRunning) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRunning]);

  const handleBackClick = useCallback(() => {
    if (isRunning) {
      handleInitiateExit('/dashboard');
    } else {
      router.push('/dashboard');
    }
  }, [isRunning, handleInitiateExit, router]);

  const value = {
    mode, setMode,
    timeLeft, setTimeLeft,
    duration, setDuration,
    isRunning, setIsRunning,
    customMinutes, setCustomMinutes,
    intent, setIntent,
    particlesEnabled, setParticlesEnabled,
    particleSpeedIndex, setParticleSpeedIndex,
    isFullscreen, setIsFullscreen,
    soundType, setSoundType,
    volume, setVolume,
    isMuted, setIsMuted,
    tasks, setTasks,
    selectedTaskId, setSelectedTaskId,
    selectedTaskTitle, setSelectedTaskTitle: setCustomTaskTitle,
    sessionsCompletedToday, setSessionsCompletedToday,
    totalFocusMinutesToday, setTotalFocusMinutesToday,
    showCelebration, setShowCelebration,
    awardedXp, setAwardedXp,
    showExitModal, setShowExitModal,
    exitQuoteIndex, setExitQuoteIndex,
    pendingNavUrl, setPendingNavUrl,
    handleTogglePlay,
    handleModeChange,
    resetTimer,
    handleEndTimer,
    handleInitiateExit,
    handleBackClick,
    cancelExit,
    confirmExit,
    loadInitialData
  };

  return (
    <FocusContext.Provider value={value}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocusTimer() {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocusTimer must be used within a FocusProvider');
  }
  return context;
}
