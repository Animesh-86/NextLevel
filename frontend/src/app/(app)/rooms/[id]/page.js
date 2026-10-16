'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/api';
import { 
  Users, ArrowLeft, Play, Pause, Volume2, VolumeX, 
  Send, Copy, Check, Lock, Clock, Crown, 
  MessageSquare, LogOut, Trash2, Trophy, Swords, 
  X, CheckCircle2, ChevronRight, Headphones, MoreHorizontal,
  ChevronLeft, AlertTriangle, Sparkles, BookOpen,
  Mic, MicOff, Video, VideoOff, Hand, Maximize2, Minimize2,
  FileText, RotateCcw, ThumbsUp, CheckCircle, RefreshCw, Plus, Minus,
  Download, Share2, Code, Shuffle, Lightbulb, Shield, Heart,
  Zap, Flame, ShieldAlert, Users2, Target, CheckSquare, Square, Eye,
  Flag, Upload, Loader2, ClipboardPaste, Pencil
} from 'lucide-react';
import { extractQuestionsFromJson } from '@/lib/questionParser';
import { playAmbientSound, stopAmbientSound } from '@/lib/ambientSound';
import RoomKnockLoader from '@/components/RoomKnockLoader';

// ─── STRICT MSQ DETECTION & SINGLE-CHOICE MCQ NORMALIZATION ───
const isMSQQuestion = (q) => {
  if (!q) return false;
  // 1. Explicit question type check
  const type = String(q.type || '').trim().toUpperCase();
  if (type === 'MSQ' || type === 'MULTIPLE_SELECT' || type.includes('MSQ') || type.includes('MULTI') || type.includes('CHECKBOX')) {
    return true;
  }
  // 2. chooseCount > 1
  const cc = Number(q.chooseCount);
  if (!isNaN(cc) && cc > 1) return true;

  // 3. answer array with multiple indices
  if (Array.isArray(q.answer) && q.answer.length > 1) return true;
  if (Array.isArray(q.answers) && q.answers.length > 1) return true;
  if (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 1) return true;

  // 4. answer string formatted like "[0, 1]" or "0, 1, 2" or "A, B"
  if (typeof q.answer === 'string') {
    const trimmed = q.answer.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 1) return true;
      } catch (e) {}
    }
    if (trimmed.includes(',') || trimmed.includes(';') || trimmed.includes('&')) return true;
  }

  // 5. Scenario text indicators for multiple-select questions
  const scenario = String(q.scenario || '').toLowerCase();
  if (
    scenario.includes('select all') ||
    scenario.includes('choose all') ||
    scenario.includes('multiple options') ||
    scenario.includes('which workarounds are described') ||
    scenario.includes('which of the following are')
  ) {
    if (!Array.isArray(q.answer) || q.answer.length !== 1) return true;
  }

  return false;
};

const getSingleCorrectAnswerIndex = (q) => {
  if (!q) return 0;
  const ans = q.answer;
  if (Array.isArray(ans) && ans.length > 0) {
    const val = Number(ans[0]);
    return isNaN(val) ? 0 : val;
  }
  if (typeof ans === 'number') return ans;
  if (typeof ans === 'string') {
    const parsed = parseInt(ans.replace(/[^0-9]/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export default function StudyRoomArena({ params }) {
  const { id: roomIdOrCode } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinStep, setJoinStep] = useState('join'); // 'join' | 'connect' | 'sync' | 'ready'
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Active Mode Switcher (Challenge, Chat, Flashcards, Scratchpad)
  const [activeTab, setActiveTab] = useState('challenge'); // 'challenge' | 'chat' | 'flashcards' | 'notes'

  // Google Meet Feature Bar States
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  // Collaborative Scratchpad Notes
  const [sharedNotes, setSharedNotes] = useState('# 📝 Study Room Shared Scratchpad\n\n- Meeting Goal: Master OA dynamic programming patterns\n- Problem 1 notes: DP state dp[i][j] represents max subarray profit\n- Code snippet:\n  const maxProfit = (prices) => { ... };\n');
  const [scratchpadView, setScratchpadView] = useState('split'); // 'split' | 'edit' | 'preview'
  const [isScratchpadSaved, setIsScratchpadSaved] = useState(true);



  // Current user info
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('You');

  // Ambient sound (default muted) - folded into 🎧 popover
  const [activeSound, setActiveSound] = useState('none');
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [showAudioPopover, setShowAudioPopover] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);

  // Available Exams for Instant Challenge (Multi-Select Support)
  const [exams, setExams] = useState([]);
  const [examSearchQuery, setExamSearchQuery] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExamIds, setSelectedExamIds] = useState([]); // Multiple vault documents selected
  const [customTitle, setCustomTitle] = useState('');
  const [challengeQCount, setChallengeQCount] = useState(5);
  const [isCustomQCount, setIsCustomQCount] = useState(false);
  const [customQCountInput, setCustomQCountInput] = useState('25');
  const [challengePacing, setChallengePacing] = useState(30);
  const [isCustomPacing, setIsCustomPacing] = useState(false);
  const [customPacingInput, setCustomPacingInput] = useState('45');
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [gameMode, setGameMode] = useState('STANDARD'); // 'STANDARD' | 'BOSS' | 'SURVIVAL' | 'TEAMS' | 'FLASHCARDS'
  const [creatingChallenge, setCreatingChallenge] = useState(false);
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false);
  const [showGameInfoModal, setShowGameInfoModal] = useState(false);
  const [viewingPastChallenge, setViewingPastChallenge] = useState(null);

  // Upload and parse document states (integrated from focus test)
  const [pendingUpload, setPendingUpload] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileInputRef = useRef(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteProcessing, setPasteProcessing] = useState(false);

  // ─── STAGE STATE MACHINE ───
  // 'idle' | 'invite_open' | 'live_question' | 'checkpoint' | 'final'
  const [stageState, setStageState] = useState('idle');

  // In-Game Question State
  const [gameQuestions, setGameQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerEvaluated, setIsAnswerEvaluated] = useState(false);
  const [isEliminated, setIsEliminated] = useState(false);
  const [survivalLives, setSurvivalLives] = useState(1);
  const [bossHp, setBossHp] = useState(1000);
  const [bossMaxHp, setBossMaxHp] = useState(1000);
  const [bossHitEffect, setBossHitEffect] = useState(null);
  const [myTeam, setMyTeam] = useState('ALPHA');
  const [teamAlphaScore, setTeamAlphaScore] = useState(0);
  const [teamBetaScore, setTeamBetaScore] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [qTimeLeft, setQTimeLeft] = useState(30);
  const [checkpointNextIdx, setCheckpointNextIdx] = useState(5);
  const [questionAnswersRecord, setQuestionAnswersRecord] = useState([]); // for post-sprint review
  const [showPostSprintReview, setShowPostSprintReview] = useState(false);
  const [savingVault, setSavingVault] = useState(false);
  const [copiedVictoryCard, setCopiedVictoryCard] = useState(false);

  // Resizable Chat panel state
  const [chatWidth, setChatWidth] = useState(360);
  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false);
  const [chatCollapsedManually, setChatCollapsedManually] = useState(false);

  // Peer Goal & Status
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [myGoal, setMyGoal] = useState('');

  // ─── FOCUS TIMER (Image 3 Spec: Focus 25m, Short Break 5m, Long Break 15m, Custom) ───
  const [timerMode, setTimerMode] = useState('FOCUS'); // 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK' | 'CUSTOM'
  const [isTimerExpanded, setIsTimerExpanded] = useState(false);
  const [pomodoroDurationMinutes, setPomodoroDurationMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(1500); // 25 mins
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroPhase, setPomodoroPhase] = useState('WORK'); // 'WORK' | 'BREAK'
  const [focusSoundEnabled, setFocusSoundEnabled] = useState(true);
  const [customFocusInput, setCustomFocusInput] = useState('50');
  const [showCustomFocusInput, setShowCustomFocusInput] = useState(false);

  const gameTimerRef = useRef(null);
  const advancingRef = useRef(false);

  // Modals & UI States
  const [showPeersModal, setShowPeersModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatBottomRef = useRef(null);

  // Right Rail active tab: 'chat' | 'people'
  const [rightRailTab, setRightRailTab] = useState('chat');

  // Room Expiry Countdown & Popover
  const [expiryDisplay, setExpiryDisplay] = useState('No Expiry');
  const [isExpiryAmber, setIsExpiryAmber] = useState(false);
  const [showExpiryPopover, setShowExpiryPopover] = useState(false);

  // Modal Adaptive Options
  const [challengeStartMode, setChallengeStartMode] = useState('instant');
  const [bossHpSetting, setBossHpSetting] = useState(1000);
  const [teamDraftSetting, setTeamDraftSetting] = useState('auto');

  // Lobby Countdown & Proctored Arena State
  const titleInputRef = useRef(null);
  const [lobbyCountdown, setLobbyCountdown] = useState(null);
  const [isProctoredActive, setIsProctoredActive] = useState(false);
  const [proctorWarnings, setProctorWarnings] = useState(0);
  const proctorWarningsRef = useRef(0);
  const lastInfractionTimeRef = useRef(0);
  const autoAdvanceTimerRef = useRef(null);
  const [showProctorAlert, setShowProctorAlert] = useState(false);
  const [proctorAlertMsg, setProctorAlertMsg] = useState('');
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const [disqualifiedReason, setDisqualifiedReason] = useState(null);
  const autoStartTriggeredRef = useRef(null);

  // Responsive Mobile / PWA Viewport Hook
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch current user
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await apiFetch('/api/user/profile');
        const json = await res.json();
        if (json.success && json.data) {
          const uId = json.data.id || json.data._id;
          setCurrentUserId(uId);
          setCurrentUserName(json.data.name || 'Student');
        }
      } catch (err) {}
    }
    fetchMe();
  }, []);

  // Fetch exams for instant challenge & sync with updates
  useEffect(() => {
    async function loadExams() {
      try {
        const res = await apiFetch('/api/exams');
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setExams(json.data);
          const firstId = json.data[0].id || json.data[0]._id;
          setSelectedExamIds(prev => (prev && prev.length > 0 ? prev : [firstId]));
          setSelectedExamId(prev => prev || firstId);
          setCustomTitle(prev => prev || (json.data[0].title + ' Sprint'));
        }
      } catch (err) {}
    }
    loadExams();

    const handleVaultSync = () => {
      loadExams();
    };
    window.addEventListener('vault-updated', handleVaultSync);
    window.addEventListener('storage', handleVaultSync);
    return () => {
      window.removeEventListener('vault-updated', handleVaultSync);
      window.removeEventListener('storage', handleVaultSync);
    };
  }, []);

  // Expiry calculation (amber in last 5 minutes)
  useEffect(() => {
    if (!room || !room.expiresAt) {
      setExpiryDisplay('No Expiry');
      setIsExpiryAmber(false);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(room.expiresAt);
      const diffMs = expiry - now;

      if (diffMs <= 0) {
        setExpiryDisplay('Expired');
        setIsExpiryAmber(true);
        toast.info('This study room has expired and is now closed.');
        router.push('/rooms');
      } else {
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;

        // Amber only in the last 5 minutes (300 seconds)
        setIsExpiryAmber(totalSecs <= 300);

        if (hours > 0) {
          setExpiryDisplay(`${hours}h ${mins}m`);
        } else {
          setExpiryDisplay(`${mins}:${secs.toString().padStart(2, '0')}`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [room, router, toast]);

  // Fetch room & messages
  const fetchRoomData = useCallback(async (isInitial = false) => {
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}`);
      if (!res.ok) {
        if (isInitial) {
          toast.error('Study room not found or expired');
          router.push('/rooms');
        }
        return;
      }
      const json = await res.json();
      if (json.success && json.data) {
        setRoom(json.data);
        // Sync my goal from participants
        if (json.data.participants && currentUserId) {
          const me = json.data.participants.find(p => p.userId === currentUserId || String(p.userId) === String(currentUserId));
          if (me && me.goal) {
            setMyGoal(me.goal);
          }
        }
        // Sync stage state if active challenge was broadcasted by peer
        if (stageState === 'idle' && json.data.activeChallenge && json.data.activeChallenge.status === 'INVITING') {
          setStageState('invite_open');
        }

        // Multiplayer mode state synchronization
        if (json.data.activeChallenge) {
          const ch = json.data.activeChallenge;
          if (ch.bossCurrentHp !== undefined && ch.bossCurrentHp !== null) {
            setBossHp(ch.bossCurrentHp);
          }
          if (ch.gameMode === 'TEAMS' && ch.leaderboard && ch.leaderboard.length > 0) {
            let alphaSum = 0;
            let betaSum = 0;
            ch.leaderboard.forEach(entry => {
              if (entry.team === 'ALPHA') alphaSum += (entry.score || 0);
              else if (entry.team === 'BETA') betaSum += (entry.score || 0);
            });
            if (alphaSum > 0 || betaSum > 0) {
              setTeamAlphaScore(alphaSum);
              setTeamBetaScore(betaSum);
            }
          }
        }
      } else {
        if (isInitial) {
          toast.error('Study room not found or expired');
          router.push('/rooms');
        }
      }
    } catch (err) {
      console.error('Fetch room error:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [roomIdOrCode, router, stageState]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}/messages`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        setMessages(json.data);
      }
    } catch (err) {}
  }, [roomIdOrCode]);

  // Join room once on mount + 15s Heartbeat + SendBeacon on pagehide
  useEffect(() => {
    let mounted = true;
    async function join() {
      try {
        setJoinStep('join');
        await apiFetch(`/api/rooms/${roomIdOrCode}/join`, { method: 'POST' });
        if (mounted) {
          setJoinStep('connect');
          await fetchRoomData(true);
          setJoinStep('sync');
          await fetchMessages();
          setJoinStep('ready');
        }
      } catch (err) {
        console.error('Join room error:', err);
      }
    }
    join();

    // Regular poll for messages & room state
    const pollInterval = setInterval(() => {
      if (mounted) {
        fetchRoomData(false);
        fetchMessages();
      }
    }, 4000);

    // 15-second heartbeat to ensure presence never drops to 0!
    const heartbeatInterval = setInterval(() => {
      if (mounted) {
        apiFetch(`/api/rooms/${roomIdOrCode}/presence`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ACTIVE' }),
        }).catch(() => {});
      }
    }, 15000);

    // Instant beacon on tab close / reload
    const handlePageHide = () => {
      navigator.sendBeacon(`/api/rooms/${roomIdOrCode}/leave`);
    };
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      clearInterval(heartbeatInterval);
      window.removeEventListener('pagehide', handlePageHide);
      stopAmbientSound();
    };
  }, [roomIdOrCode, fetchRoomData, fetchMessages]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollTop = chatBottomRef.current.scrollHeight;
    }
  }, [messages]);

  // Ambient sound switcher
  const handleSelectSound = (soundType) => {
    if (soundType === 'none' || (soundType === activeSound && soundPlaying)) {
      stopAmbientSound();
      setSoundPlaying(false);
      setActiveSound('none');
    } else {
      setActiveSound(soundType);
      playAmbientSound(soundType);
      setSoundPlaying(true);
    }
    setShowAudioPopover(false);
  };

  // Adjust room timer (+5m, -5m, or custom delta) across all participants
  const handleAdjustRoomTimer = async (deltaMinutes) => {
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}/extend?minutes=${deltaMinutes}`, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setRoom(json.data);
        const sign = deltaMinutes > 0 ? '+' : '';
        toast.success(`Room timer adjusted (${sign}${deltaMinutes}m) across all screens! ⏱️`);
      } else {
        toast.error(json.message || 'Failed to adjust room timer');
      }
    } catch (err) {
      toast.error('Failed to adjust room timer');
    }
  };
  const handleExtendRoom = () => handleAdjustRoomTimer(30);

  const toggleMic = () => {
    setIsMicMuted(prev => {
      const next = !prev;
      toast.info(next ? 'Microphone muted 🔇' : 'Microphone unmuted 🎙️');
      return next;
    });
  };

  const toggleCamera = () => {
    setIsVideoOff(prev => {
      const next = !prev;
      toast.info(next ? 'Camera turned off 🚫' : 'Camera turned on 📹');
      return next;
    });
  };

  const handleRaiseHand = async () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    if (next) {
      toast.info('✋ Hand raised!');
      try {
        await apiFetch(`/api/rooms/${roomIdOrCode}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `✋ ${currentUserName} raised their hand!`,
            type: 'SYSTEM'
          })
        });
        fetchMessages();
      } catch (e) {}
    } else {
      toast.info('Hand lowered');
    }
  };

  // Close room permanently (Host only)
  const handleCloseRoom = async () => {
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Study room closed');
        router.push('/rooms');
      } else {
        toast.error(json.message || 'Failed to close room');
      }
    } catch (err) {
      toast.error('Failed to close room');
    } finally {
      setShowCloseConfirmModal(false);
    }
  };

  // Exit room
  const handleExitRoom = async () => {
    try {
      await apiFetch(`/api/rooms/${roomIdOrCode}/leave`, { method: 'POST' });
    } catch (e) {}
    router.push('/rooms');
  };

  // Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || sendingMsg) return;

    const text = chatInput.trim();
    setChatInput('');
    setSendingMsg(true);

    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, type: 'CHAT' }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMessages(prev => [...prev, json.data]);
      }
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  // Copy helpers
  const copyRoomCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.roomCode);
    setCopiedCode(true);
    toast.success('Room code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyRoomLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success('Room link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Web Audio Synth Chime for instant feedback
  const playFeedbackSound = (isCorrect) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      if (isCorrect) {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {}
  };

  // Draggable Splitter mouse listener for adjustable chat width
  const handleSplitterMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingSplitter(true);
    const startX = e.clientX;
    const startWidth = chatWidth;

    const handleMouseMove = (moveEvent) => {
      const delta = startX - moveEvent.clientX; // dragging left increases chat width
      const newWidth = Math.max(260, Math.min(580, startWidth + delta));
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingSplitter(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Synchronized Pomodoro timer effect
  useEffect(() => {
    let timer;
    if (pomodoroRunning) {
      timer = setInterval(() => {
        setPomodoroSeconds(prev => {
          if (prev <= 1) {
            if (pomodoroPhase === 'WORK') {
              setPomodoroPhase('BREAK');
              toast.info('Focus block complete! Break phase active - head to Tech Bubble Pit! 🫧');
              return 300; // 5 min break
            } else {
              setPomodoroPhase('WORK');
              toast.info('Break over! Back to focus work. 🎯');
              return pomodoroDurationMinutes * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [pomodoroRunning, pomodoroPhase, pomodoroDurationMinutes, toast]);

  // Peer Goal update
  const handleSaveGoal = async (e) => {
    if (e) e.preventDefault();
    if (!goalInput.trim()) return;
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}/goal?goal=${encodeURIComponent(goalInput.trim())}`, {
        method: 'PUT',
      });
      const json = await res.json();
      if (json.success) {
        setMyGoal(goalInput.trim());
        setShowGoalModal(false);
        toast.success('Focus goal updated!');
        fetchRoomData();
      }
    } catch (err) {
      toast.error('Failed to update goal');
    }
  };

  // Host Moderation: Kick user
  const handleKickUser = async (targetUserId) => {
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}/kick/${targetUserId}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success('Participant removed from room');
        fetchRoomData();
      } else {
        toast.error(json.message || 'Failed to remove participant');
      }
    } catch (err) {
      toast.error('Failed to kick user');
    }
  };

  // Host Moderation: Transfer host role
  const handleTransferHost = async (targetUserId) => {
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}/transfer-host/${targetUserId}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success('Host ownership transferred successfully');
        fetchRoomData();
      } else {
        toast.error(json.message || 'Failed to transfer host');
      }
    } catch (err) {
      toast.error('Failed to transfer host');
    }
  };

  // Save missed questions to Knowledge Vault (Post-Sprint Review)
  const handleSaveMissedToVault = async () => {
    const missed = questionAnswersRecord.filter(q => !q.isCorrect);
    if (missed.length === 0) {
      toast.info('No missed questions in this sprint! Perfect score!');
      return;
    }

    setSavingVault(true);
    try {
      for (const item of missed) {
        await apiFetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario: item.question.scenario,
            options: item.question.options,
            answer: item.question.answer,
            explanation: item.question.explanation,
            tags: ['StudyRoom', room.title, room.roomCode],
            difficulty: 'MEDIUM',
          })
        }).catch(() => {});
      }
      toast.success(`Saved ${missed.length} missed question${missed.length > 1 ? 's' : ''} to your Knowledge Vault!`);
    } catch (err) {
      toast.error('Failed to save to Vault');
    } finally {
      setSavingVault(false);
    }
  };

  // Share Victory Card (LinkedIn / X formatted summary)
  const handleShareVictoryCard = () => {
    const text = `🏆 NextLevel Collaborative Study Rooms | Sprint Result\n\nRoom: ${room.title} (${room.roomCode})\nScore: ${userScore} pts | Accuracy: ${Math.round((correctCount / (gameQuestions.length || 1)) * 100)}%\nMode: ${room.activeChallenge?.gameMode || 'OA Blitz'}\n\nCo-working and multiplayer practice on NextLevel! 🚀`;
    navigator.clipboard.writeText(text);
    setCopiedVictoryCard(true);
    toast.success('Victory card copied to clipboard!');
    setTimeout(() => setCopiedVictoryCard(false), 3000);
  };

  // ─── SAVE / EXPORT SPRINT RESULT IMAGE VIA HTML5 CANVAS ───
  const handleDownloadResultImage = (challengeToDownload) => {
    const ch = challengeToDownload || room?.activeChallenge;
    if (!ch) {
      toast.error('No sprint result to export');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Sleek dark background
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 700);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(0.5, '#111827');
      bgGrad.addColorStop(1, '#050811');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 700);

      // 2. Amber neon border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 24, 1152, 652);

      // Corner accent marks
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(20, 20, 32, 4);
      ctx.fillRect(20, 20, 4, 32);
      ctx.fillRect(1148, 20, 32, 4);
      ctx.fillRect(1176, 20, 4, 32);
      ctx.fillRect(20, 676, 32, 4);
      ctx.fillRect(20, 648, 4, 32);
      ctx.fillRect(1148, 676, 32, 4);
      ctx.fillRect(1176, 648, 4, 32);

      // 3. Header badge
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('NEXTLEVEL ARENA  •  SPRINT RESULTS', 54, 75);

      // Date / Room Code
      ctx.fillStyle = '#6b7280';
      ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const dateStr = new Date(ch.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      ctx.fillText(`Room: ${room?.title || 'Study Room'} (${room?.inviteCode || 'NextLevel'})  •  ${dateStr}`, 700, 75);

      // 4. Sprint Title
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(ch.title || 'Multiplayer Challenge', 54, 135);

      // Mode Badge & Parameters
      const modeName = ch.gameMode === 'BOSS' ? 'Co-op Boss Battle' : ch.gameMode === 'SURVIVAL' ? 'Sudden-Death Survival' : ch.gameMode === 'TEAMS' ? 'Squad Battle' : 'OA Blitz (FFA)';
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const modeLabel = `MODE: ${modeName.toUpperCase()}`;
      ctx.fillText(modeLabel, 54, 175);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '500 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`•  ${ch.questionCount || 10} Questions  •  ${ch.perQuestionSeconds || 30}s / Question`, 54 + ctx.measureText(modeLabel).width + 16, 175);

      // Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(54, 205);
      ctx.lineTo(1146, 205);
      ctx.stroke();

      // 5. Standings / Leaderboard Cards
      const leaderboard = ch.leaderboard || [];
      if (leaderboard.length === 0) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Sprint completed! No participant scores were recorded.', 54, 300);
      } else {
        const top3 = leaderboard.slice(0, 3);
        const cardWidth = 345;
        const startX = 54;
        const cardY = 240;
        const cardH = 340;

        top3.forEach((player, idx) => {
          const x = startX + idx * (cardWidth + 28);
          const isWinner = idx === 0;

          // Card Background
          ctx.fillStyle = isWinner ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.04)';
          ctx.fillRect(x, cardY, cardWidth, cardH);
          ctx.strokeStyle = isWinner ? '#f59e0b' : 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = isWinner ? 2 : 1;
          ctx.strokeRect(x, cardY, cardWidth, cardH);

          // Medal / Rank
          const medals = ['🥇 1ST PLACE', '🥈 2ND PLACE', '🥉 3RD PLACE'];
          ctx.fillStyle = isWinner ? '#f59e0b' : '#d1d5db';
          ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(medals[idx], x + 24, cardY + 45);

          // Player Name
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const truncatedName = (player.userName || 'Participant').length > 18 ? (player.userName || 'Participant').slice(0, 16) + '...' : (player.userName || 'Participant');
          ctx.fillText(truncatedName, x + 24, cardY + 95);

          // Score
          ctx.fillStyle = '#f59e0b';
          ctx.font = '900 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(`${player.score || 0}`, x + 24, cardY + 165);
          ctx.fillStyle = '#9ca3af';
          ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('PTS', x + 24 + ctx.measureText(`${player.score || 0}`).width + 8, cardY + 165);

          // Divider inside card
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.beginPath();
          ctx.moveTo(x + 24, cardY + 200);
          ctx.lineTo(x + cardWidth - 24, cardY + 200);
          ctx.stroke();

          // Correct answers
          ctx.fillStyle = '#9ca3af';
          ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('Accuracy:', x + 24, cardY + 245);
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(`${player.correctCount || 0} / ${ch.questionCount || 10} correct`, x + 120, cardY + 245);

          // Avg Speed
          ctx.fillStyle = '#9ca3af';
          ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('Avg Speed:', x + 24, cardY + 290);
          ctx.fillStyle = '#60a5fa';
          ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(`${player.avgSpeedSeconds || 0}s / question`, x + 120, cardY + 290);
        });
      }

      // 6. Footer Watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Verified NextLevel Co-Working Session  •  app.nextlevel.ai', 54, 635);

      // Trigger instant PNG download
      const safeTitle = (ch.title || 'sprint').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const link = document.createElement('a');
      link.download = `nextlevel-sprint-${safeTitle}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Sprint result image downloaded!');
    } catch (err) {
      toast.error('Failed to generate result image');
    }
  };

  // Back to Main Room (concludes challenge on backend & shows past challenge history)
  const handleBackToMainRoom = async () => {
    try {
      if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
    setIsFullscreenActive(false);
    setIsProctoredActive(false);
    setShowProctorAlert(false);
    setLobbyCountdown(null);
    try {
      await apiFetch(`/api/rooms/${roomIdOrCode}/challenge`, { method: 'DELETE' });
    } catch (e) {}
    setGameQuestions([]);
    setCurrentQIdx(0);
    setSelectedOption(null);
    setIsAnswerEvaluated(false);
    setIsEliminated(false);
    setBossHitEffect(null);
    setStageState('idle');
    fetchRoomData();
    fetchMessages();
  };

  // Cancel challenge invitation
  const handleCancelChallenge = async () => {
    try {
      if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
    setIsFullscreenActive(false);
    setIsProctoredActive(false);
    setShowProctorAlert(false);
    setLobbyCountdown(null);
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    lastInfractionTimeRef.current = 0;
    proctorWarningsRef.current = 0;
    setProctorWarnings(0);
    try {
      await apiFetch(`/api/rooms/${roomIdOrCode}/challenge?reason=cancelled`, { method: 'DELETE' });
    } catch (e) {}
    setGameQuestions([]);
    setCurrentQIdx(0);
    setSelectedOption(null);
    setIsAnswerEvaluated(false);
    setIsEliminated(false);
    setBossHitEffect(null);
    setStageState('idle');
    fetchRoomData();
    fetchMessages();
  };

  // ─── UPLOAD & PARSE DOCUMENT PIPELINE (INTEGRATED FROM FOCUS TEST) ───
  const saveQuestionsToVault = async (questionsArray, docTitle, toastId) => {
    // Strict MSQ Exclusion: only keep single-choice MCQs!
    const filteredQuestions = (questionsArray || []).filter(q => !isMSQQuestion(q));
    if (filteredQuestions.length === 0) {
      throw new Error('No single-choice questions found. All extracted questions were multiple-select (MSQs).');
    }

    toast.loading('Creating document group...', { id: toastId });
    const examRes = await apiFetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: docTitle,
        description: `Questions from ${docTitle}`,
        timeLimit: 60,
        isPublic: false
      })
    });
    const examData = await examRes.json();
    if (!examData.success) {
      throw new Error(examData.error || 'Failed to create vault document');
    }
    const newExam = examData.data;

    const questionsWithExam = filteredQuestions.map(q => ({
      ...q,
      examId: newExam._id || newExam.id
    }));

    toast.loading(`Saving ${questionsWithExam.length} questions...`, { id: toastId });
    const qRes = await apiFetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionsWithExam)
    });
    const qData = await qRes.json();

    if (qData.success) {
      toast.success(`Successfully added "${docTitle}" (${questionsWithExam.length} Qs)!`, { id: toastId });
      const examWithMeta = {
        ...newExam,
        questionCount: questionsWithExam.length,
        totalQuestions: questionsWithExam.length
      };
      setExams(prev => [examWithMeta, ...prev]);
      setSelectedExamIds(prev => [newExam._id || newExam.id, ...prev]);
      setCustomTitle(`${docTitle} Sprint`);

      // Broadcast update so Focus Test & other components sync immediately
      try {
        window.dispatchEvent(new CustomEvent('vault-updated', { detail: { exam: examWithMeta } }));
        localStorage.setItem('vault_last_updated', Date.now().toString());
      } catch (e) {}

      return examWithMeta;
    } else {
      throw new Error(qData.error || 'Failed to save questions to vault');
    }
  };

  const handleUploadDocumentChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const suggested = file.name.replace(/\.[^/.]+$/, '');
    setPendingUpload({ file });
    setUploadName(suggested);
  };

  const confirmDocumentUpload = async () => {
    if (!pendingUpload) return;
    const { file } = pendingUpload;
    const docTitle = uploadName.trim() || file.name.replace(/\.[^/.]+$/, '');

    if (exams.some(e => e.title === docTitle)) {
      toast.error(`A document named "${docTitle}" already exists.`);
      return;
    }

    setPendingUpload(null);
    setUploadName('');
    setIsUploadingDoc(true);
    const toastId = toast.loading(`Processing ${file.name}...`);

    try {
      let questionsArray = [];

      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);
        questionsArray = extractQuestionsFromJson(json);
        if (questionsArray.length === 0) {
          throw new Error('No valid questions found in JSON file.');
        }
      } else {
        const formData = new FormData();
        formData.append('file', file);

        const extractRes = await fetch('/api/extract', {
          method: 'POST',
          body: formData
        });
        const extractData = await extractRes.json();
        if (!extractData.success) {
          throw new Error(extractData.error || 'Failed to extract text from document');
        }

        toast.loading('Analyzing questions with AI...', { id: toastId });

        const genRes = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: extractData.text })
        });
        const genData = await genRes.json();
        if (!genData.success) {
          throw new Error(genData.error || 'Failed to generate questions');
        }
        questionsArray = genData.data;
      }

      await saveQuestionsToVault(questionsArray, docTitle, toastId);
    } catch (err) {
      toast.error(err.message || 'Upload failed', { id: toastId });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;

    // Fast path: if the user pasted raw JSON, parse questions directly!
    try {
      const parsedJson = JSON.parse(pasteText.trim());
      const questions = extractQuestionsFromJson(parsedJson);

      if (questions && questions.length > 0) {
        setPasteProcessing(true);
        const toastId = toast.loading(`Processing ${questions.length} pasted questions...`);

        const docTitle = pasteTitle.trim() || `Pasted Test ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

        if (exams.some(e => e.title === docTitle)) {
          toast.error(`A document named "${docTitle}" already exists.`, { id: toastId });
          setPasteProcessing(false);
          return;
        }

        await saveQuestionsToVault(questions, docTitle, toastId);
        setShowPasteModal(false);
        setPasteText('');
        setPasteTitle('');
        setPasteProcessing(false);
        return;
      }
    } catch (e) {
      // Not JSON, continue to AI extraction
    }

    setPasteProcessing(true);
    const toastId = toast.loading('Analyzing parsed questions with AI...');

    try {
      const genRes = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText })
      });
      const genData = await genRes.json();

      if (!genData.success) {
        throw new Error(genData.error || 'Failed to parse questions');
      }

      const docTitle = pasteTitle.trim() || `Pasted ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

      if (exams.some(e => e.title === docTitle)) {
        toast.error(`A document named "${docTitle}" already exists.`, { id: toastId });
        setPasteProcessing(false);
        return;
      }

      await saveQuestionsToVault(genData.data, docTitle, toastId);
      setShowPasteModal(false);
      setPasteText('');
      setPasteTitle('');
    } catch (err) {
      toast.error(err.message || 'Failed to process pasted questions', { id: toastId });
    } finally {
      setPasteProcessing(false);
    }
  };

  // ─── INSTANT CHALLENGE CREATION ───
  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!customTitle.trim()) {
      toast.error('Please enter a challenge title');
      return;
    }

    const effectiveQCount = isCustomQCount 
      ? Math.max(1, Math.min(100, parseInt(customQCountInput, 10) || 10))
      : challengeQCount;

    const effectivePacing = isCustomPacing
      ? Math.max(5, Math.min(300, parseInt(customPacingInput, 10) || 30))
      : challengePacing;

    const chosenExamIds = (selectedExamIds && selectedExamIds.length > 0)
      ? selectedExamIds
      : (selectedExamId ? [selectedExamId] : []);

    setCreatingChallenge(true);
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle.trim(),
          examId: chosenExamIds[0] || '',
          examIds: chosenExamIds,
          questionCount: effectiveQCount,
          perQuestionSeconds: effectivePacing,
          negativeMarking: (gameMode === 'SURVIVAL' || gameMode === 'BOSS') ? false : negativeMarking,
          gameMode: gameMode,
          bossMaxHp: bossHpSetting,
          teamDraft: teamDraftSetting,
          lobbySeconds: challengeStartMode === 'lobby' ? 30 : 0,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setRoom(json.data);
        setShowCreateChallengeModal(false);
        if (challengeStartMode === 'instant') {
          toast.success(`Challenge "${json.data.activeChallenge?.title}" launched immediately!`);
          handleStartChallenge(json.data.activeChallenge);
        } else {
          setStageState('invite_open');
          setLobbyCountdown(30);
          autoStartTriggeredRef.current = null;
          toast.success(`Challenge lobby for "${json.data.activeChallenge?.title}" opened! Auto-starts in 30 seconds.`);
        }
        fetchMessages();
      } else {
        toast.error(json.message || 'Failed to create challenge');
      }
    } catch (err) {
      toast.error('Failed to create challenge');
    } finally {
      setCreatingChallenge(false);
    }
  };

  // ─── START SPRINT ───
  const handleStartChallenge = async (challengeToPlay) => {
    // Synchronously request fullscreen immediately before any async await to preserve user gesture
    try {
      if (typeof document !== 'undefined' && document.documentElement?.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreenActive(true)).catch(() => {});
      }
    } catch (e) {}

    const ch = challengeToPlay || room?.activeChallenge;
    if (!ch) return;

    // Notify backend that challenge status is IN_PROGRESS so join link is revoked room-wide
    apiFetch(`/api/rooms/${roomIdOrCode}/challenge/start`, { method: 'POST' }).catch(() => {});
    setRoom(prev => prev ? {
      ...prev,
      activeChallenge: prev.activeChallenge ? { ...prev.activeChallenge, status: 'IN_PROGRESS' } : null
    } : prev);

    proctorWarningsRef.current = 0;
    lastInfractionTimeRef.current = 0;
    setProctorWarnings(0);
    setShowProctorAlert(false);
    setDisqualifiedReason(null);

    try {
      toast.info('Loading challenge questions...');
      const targetExamIds = (ch.examIds && ch.examIds.length > 0)
        ? ch.examIds
        : (ch.examId ? [ch.examId] : (selectedExamIds.length > 0 ? selectedExamIds : []));

      let qs = [];
      if (targetExamIds.length > 0) {
        const responses = await Promise.all(
          targetExamIds.map(id => 
            apiFetch(`/api/questions?examId=${id}&limit=100`)
              .then(r => r.json())
              .catch(() => ({ data: [] }))
          )
        );
        responses.forEach(jsonRes => {
          const list = jsonRes.data?.data || jsonRes.data || [];
          if (Array.isArray(list)) qs.push(...list);
        });
      } else {
        const res = await apiFetch(`/api/questions?limit=100`);
        const json = await res.json();
        qs = json.data?.data || json.data || [];
      }

      // If selected documents returned 0 questions, fall back to global pool questions
      if (!qs || qs.length === 0) {
        const fallbackRes = await apiFetch(`/api/questions?limit=100`);
        const fallbackJson = await fallbackRes.json();
        qs = fallbackJson.data?.data || fallbackJson.data || [];
      }

      // Strict filter: EXCLUDE ALL MSQs (Multiple Select Questions). Arena challenges are strictly single-choice MCQs!
      qs = qs.filter(q => !isMSQQuestion(q));

      // Shuffle combined questions from selected documents
      for (let i = qs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [qs[i], qs[j]] = [qs[j], qs[i]];
      }

      if (ch.questionIds && ch.questionIds.length > 0) {
        const idSet = new Set(ch.questionIds);
        qs = qs.filter(q => idSet.has(q.id || q._id));
      } else {
        qs = qs.slice(0, ch.questionCount || 10);
      }

      // Final safeguard: Re-verify that NO MSQ is in the active challenge questions pool
      qs = qs.filter(q => !isMSQQuestion(q));

      if (qs.length === 0) {
        toast.error('No questions found for this challenge.');
        return;
      }

      // Initialize arena mode states
      const chMode = (ch.gameMode || 'STANDARD').toUpperCase();
      if (chMode === 'BOSS') {
        const initialBossHp = ch.bossCurrentHp || ch.bossMaxHp || 1000;
        setBossHp(initialBossHp);
        setBossMaxHp(ch.bossMaxHp || 1000);
        setBossHitEffect(null);
      } else if (chMode === 'SURVIVAL') {
        setSurvivalLives(1);
        setIsEliminated(false);
      } else if (chMode === 'TEAMS') {
        const userIdx = participantsList.findIndex(p => p.userId === currentUserId);
        const assigned = ch.teamAssignments?.[currentUserId] || (userIdx % 2 === 0 ? 'ALPHA' : 'BETA');
        setMyTeam(assigned);
        setTeamAlphaScore(0);
        setTeamBetaScore(0);
      }

      setGameQuestions(qs);
      setCurrentQIdx(0);
      setSelectedOption(null);
      setIsAnswerEvaluated(false);
      setIsEliminated(false);
      setUserScore(0);
      setCurrentStreak(0);
      setCorrectCount(0);
      setQTimeLeft(ch.perQuestionSeconds || 30);
      setCheckpointNextIdx(5);
      setQuestionAnswersRecord([]);
      setShowPostSprintReview(false);
      setStageState('live_question');

      // Request automatic browser fullscreen mode
      try {
        if (typeof document !== 'undefined' && document.documentElement && document.documentElement.requestFullscreen) {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        }
      } catch (e) {}
      setIsFullscreenActive(true);
      setIsProctoredActive(true);
      setProctorWarnings(0);
      setShowProctorAlert(false);
    } catch (err) {
      toast.error('Failed to load challenge questions');
    }
  };

  // ─── 30S LOBBY LIVE COUNTDOWN & AUTO-START TICKER ───
  useEffect(() => {
    if (stageState !== 'invite_open' || !room?.activeChallenge) {
      return;
    }

    const ch = room.activeChallenge;
    const computeRemaining = () => {
      if (ch.lobbyEndsAt) {
        const diff = Math.ceil((new Date(ch.lobbyEndsAt).getTime() - Date.now()) / 1000);
        return Math.max(0, diff);
      }
      if (ch.createdAt) {
        const targetSec = ch.lobbySeconds || 30;
        const diff = Math.ceil((new Date(ch.createdAt).getTime() + (targetSec * 1000) - Date.now()) / 1000);
        return Math.max(0, diff);
      }
      return 30;
    };

    const initialRem = computeRemaining();
    setLobbyCountdown(initialRem);

    if (initialRem <= 0) {
      if (autoStartTriggeredRef.current !== ch.id) {
        autoStartTriggeredRef.current = ch.id;
        handleStartChallenge(ch);
      }
      return;
    }

    const interval = setInterval(() => {
      const rem = computeRemaining();
      setLobbyCountdown(rem);
      if (rem <= 0) {
        clearInterval(interval);
        if (autoStartTriggeredRef.current !== ch.id) {
          autoStartTriggeredRef.current = ch.id;
          toast.info('🚀 30s lobby complete! Sprint auto-starting now...');
          handleStartChallenge(ch);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stageState, room?.activeChallenge]);

  // ─── PROCTORED ENVIRONMENT SAFEGUARDS (Tab switch, Blur, Fullscreen detection) ───
  useEffect(() => {
    if (stageState !== 'live_question' && stageState !== 'checkpoint') {
      setIsProctoredActive(false);
      setShowProctorAlert(false);
      return;
    }

    setIsProctoredActive(true);

    const triggerDisqualification = (reason) => {
      setDisqualifiedReason(reason);
      setShowProctorAlert(false);
      setIsProctoredActive(false);
      proctorWarningsRef.current = 3;
      setProctorWarnings(3);

      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }

      // Broadcast disqualification notice to room chat
      apiFetch(`/api/rooms/${roomIdOrCode}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🚫 ${currentUserName || 'A participant'} was disqualified from the challenge for proctor infractions (3/3).`,
          type: 'SYSTEM'
        })
      }).catch(() => {});

      setStageState('idle');
      toast.error('🚫 Disqualified: Exceeded maximum allowed infractions (3/3).');
    };

    const recordInfraction = (reason, alertMsg) => {
      const now = Date.now();
      // Debounce duplicate infraction events with 5000ms cooldown to prevent multi-increment on single tab switch
      if (now - lastInfractionTimeRef.current < 5000) {
        return;
      }
      lastInfractionTimeRef.current = now;

      const nextWarnings = Math.min(3, proctorWarningsRef.current + 1);
      proctorWarningsRef.current = nextWarnings;
      setProctorWarnings(nextWarnings);

      if (nextWarnings >= 3) {
        triggerDisqualification(`${reason} (3/3 infractions).`);
      } else {
        setProctorAlertMsg(`${alertMsg} (${nextWarnings}/3)`);
        setShowProctorAlert(true);
        toast.warning(`⚠️ Proctor Warning (${nextWarnings}/3): ${reason}. (3 infractions will result in disqualification).`);
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        recordInfraction('Tab switch detected', '⚠️ Tab switch detected!');
      }
    };

    const handleWindowBlur = () => {
      // Only fire on window blur if document is not hidden to avoid double-counting with tab switch
      if (typeof document !== 'undefined' && !document.hidden) {
        recordInfraction('Focus lost from challenge window', '⚠️ Challenge window lost focus!');
      }
    };

    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setIsFullscreenActive(isFull);
      if (!isFull && (stageState === 'live_question' || stageState === 'checkpoint')) {
        setProctorAlertMsg('⚠️ Exited full screen! Click to restore proctored full screen.');
        setShowProctorAlert(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [stageState, roomIdOrCode, currentUserName]);

  // Handle immediate click on option with green/red visual evaluation
  const handleOptionClick = (oIdx) => {
    if (isAnswerEvaluated || isEliminated) return;

    setSelectedOption(oIdx);
    setIsAnswerEvaluated(true);

    const currentQ = gameQuestions[currentQIdx];
    const correctAnswers = currentQ?.answer || [];
    const isCorrect = correctAnswers.includes(oIdx);

    playFeedbackSound(isCorrect);

    const chMode = (room?.activeChallenge?.gameMode || 'STANDARD').toUpperCase();

    // Mode: Co-op Boss Battle
    if (chMode === 'BOSS') {
      const dmg = isCorrect ? (100 + (qTimeLeft * 2)) : 0;
      if (isCorrect) {
        setBossHp(prev => Math.max(0, prev - dmg));
        setBossHitEffect({ type: 'DMG', text: `-${dmg} HP Hit!` });
        setTimeout(() => setBossHitEffect(null), 1200);
        apiFetch(`/api/rooms/${roomIdOrCode}/challenge/score`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bossDamageDelta: dmg })
        }).catch(() => {});
      } else {
        setBossHp(prev => Math.min(bossMaxHp, prev + 50));
        setBossHitEffect({ type: 'HEAL', text: '+50 Boss Heal' });
        setTimeout(() => setBossHitEffect(null), 1200);
        apiFetch(`/api/rooms/${roomIdOrCode}/challenge/score`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bossDamageDelta: -50 })
        }).catch(() => {});
      }
    }

    // Mode: Survival Sudden-Death Elimination
    if (chMode === 'SURVIVAL' && !isCorrect) {
      setSurvivalLives(0);
      setIsEliminated(true);
      toast.warning('Eliminated in sudden-death! You are now in spectator mode.');
      apiFetch(`/api/rooms/${roomIdOrCode}/challenge/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEliminated: true })
      }).catch(() => {});
    }

    // Mode: Squad Battle (Team Match)
    if (chMode === 'TEAMS' && isCorrect) {
      const pts = 100 + (qTimeLeft * 6);
      if (myTeam === 'ALPHA') setTeamAlphaScore(prev => prev + pts);
      else setTeamBetaScore(prev => prev + pts);
      apiFetch(`/api/rooms/${roomIdOrCode}/challenge/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: pts, team: myTeam })
      }).catch(() => {});
    }
    // Auto-advance to next question after 1.1s visual red/green feedback
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    autoAdvanceTimerRef.current = setTimeout(() => {
      handleAdvanceQuestion(false, oIdx);
    }, 1100);
  };

  // In-Game Countdown Timer
  useEffect(() => {
    if (stageState !== 'live_question') {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      return;
    }

    gameTimerRef.current = setInterval(() => {
      setQTimeLeft(prev => {
        if (prev <= 1) {
          setTimeout(() => {
            handleAdvanceQuestion(true);
          }, 0);
          return room?.activeChallenge?.perQuestionSeconds || 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [stageState, currentQIdx, room]);

  // Lock answer & advance question
  const handleAdvanceQuestion = useCallback((isTimeout = false, overrideOption = null) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (advancingRef.current || stageState !== 'live_question') return;
    advancingRef.current = true;
    setTimeout(() => { advancingRef.current = false; }, 500);

    const currentQ = gameQuestions[currentQIdx];
    if (!currentQ) return;

    const limit = room?.activeChallenge?.perQuestionSeconds || 30;
    const isNeg = Boolean(room?.activeChallenge?.negativeMarking);

    let pointsGained = 0;
    let isCorrect = false;

    const chosenOption = overrideOption !== null ? overrideOption : selectedOption;

    if (!isTimeout && chosenOption !== null) {
      const correctIdx = getSingleCorrectAnswerIndex(currentQ);
      isCorrect = chosenOption === correctIdx;

      if (isCorrect) {
        // Base 100 + speed bonus (remaining seconds * 6) + streak bonus (streak * 10)
        pointsGained = 100 + (qTimeLeft * 6) + (currentStreak * 10);
        setCurrentStreak(prev => prev + 1);
        setCorrectCount(prev => prev + 1);
      } else {
        if (isNeg) {
          pointsGained = -25;
        }
        setCurrentStreak(0);
      }
    } else {
      setCurrentStreak(0);
      const chMode = (room?.activeChallenge?.gameMode || 'STANDARD').toUpperCase();
      if (chMode === 'SURVIVAL' && !isEliminated) {
        setSurvivalLives(0);
        setIsEliminated(true);
        toast.warning('Time expired in sudden-death! You are now in spectator mode.');
        apiFetch(`/api/rooms/${roomIdOrCode}/challenge/score`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEliminated: true })
        }).catch(() => {});
      }
      if (chMode === 'BOSS') {
        setBossHp(prev => Math.min(bossMaxHp, prev + 50));
        setBossHitEffect({ type: 'HEAL', text: '+50 Boss Heal' });
        setTimeout(() => setBossHitEffect(null), 1200);
        apiFetch(`/api/rooms/${roomIdOrCode}/challenge/score`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bossDamageDelta: -50 })
        }).catch(() => {});
      }
    }

    const updatedScore = Math.max(0, userScore + pointsGained);
    setUserScore(updatedScore);

    // Save response for post-sprint review
    setQuestionAnswersRecord(prev => [
      ...prev,
      {
        question: currentQ,
        selectedOption: isTimeout ? null : chosenOption,
        isCorrect,
        isTimeout,
        timeSpent: limit - qTimeLeft,
      }
    ]);

    // Send score update to backend for live room leaderboard
    apiFetch(`/api/rooms/${roomIdOrCode}/challenge/score`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: updatedScore,
        questionsAnswered: currentQIdx + 1,
        correctCount: isCorrect ? correctCount + 1 : correctCount,
        avgSpeedSeconds: Number(((limit - qTimeLeft)).toFixed(1)),
      })
    }).catch(() => {});

    // Check if test completed or checkpoint
    if (currentQIdx >= gameQuestions.length - 1) {
      setStageState('final');
      try {
        if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (e) {}
      setIsFullscreenActive(false);
      setIsProctoredActive(false);
      fetchRoomData();
    } else if (currentQIdx + 1 === checkpointNextIdx && currentQIdx + 1 < gameQuestions.length) {
      setStageState('checkpoint');
      fetchRoomData();
    } else {
      setCurrentQIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerEvaluated(false);
      setQTimeLeft(limit);
    }
  }, [stageState, gameQuestions, currentQIdx, room, selectedOption, qTimeLeft, currentStreak, userScore, correctCount, checkpointNextIdx, roomIdOrCode, fetchRoomData]);

  // Keyboard shortcut listener (1-4 or A-D, Enter) during live question
  useEffect(() => {
    if (stageState !== 'live_question') return;

    const handleKeyDown = (e) => {
      if (['1', 'a', 'A'].includes(e.key)) setSelectedOption(0);
      else if (['2', 'b', 'B'].includes(e.key)) setSelectedOption(1);
      else if (['3', 'c', 'C'].includes(e.key)) setSelectedOption(2);
      else if (['4', 'd', 'D'].includes(e.key)) setSelectedOption(3);
      else if (e.key === 'Enter' && selectedOption !== null) {
        handleAdvanceQuestion(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stageState, selectedOption, handleAdvanceQuestion]);

  const resumeFromCheckpoint = () => {
    setCheckpointNextIdx(prev => prev + 5);
    setCurrentQIdx(prev => prev + 1);
    setSelectedOption(null);
    setIsAnswerEvaluated(false);
    setQTimeLeft(room?.activeChallenge?.perQuestionSeconds || 30);
    setStageState('live_question');
  };

  const isHost = room && currentUserId && (room.hostUserId === currentUserId);
  const participantsList = room?.participants || [];
  const activeChallenge = room?.activeChallenge;
  const currentLeaderboard = activeChallenge?.leaderboard || [];

  const isChallengeActive = stageState === 'live_question' || stageState === 'checkpoint';

  // Auto-collapse right rail if Zen Mode, or full Chat tab active. In challenge mode, keep sidebar chat visible!
  const isChatCollapsed = isZenMode || activeTab === 'chat' || (isChallengeActive ? false : chatCollapsedManually);

  const userInitials = (currentUserName || 'Student')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  if (loading && !room) {
    return (
      <RoomKnockLoader
        step={joinStep}
        code={roomIdOrCode}
        name="Study Room Arena"
        initials={userInitials}
      />
    );
  }

  if (!room) return null;

  return (
    <RoomKnockLoader
      step={joinStep}
      code={room?.roomCode || roomIdOrCode}
      name={room?.name || room?.title || 'Study Room Arena'}
      initials={userInitials}
    >
      <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: (isZenMode || isChallengeActive) ? '100vh' : '100%',
      maxHeight: (isZenMode || isChallengeActive) ? '100vh' : '100%',
      flex: 1,
      minHeight: 0,
      overflow: isMobile ? 'auto' : 'hidden',
      gap: isChallengeActive ? '0.75rem' : '1.1rem',
      animation: 'fadeIn 0.25s ease-out',
      ...(isChallengeActive ? {
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#0a0a0c',
        padding: '0.85rem 1.25rem',
        overflow: 'hidden',
        width: '100vw',
        height: '100vh',
      } : isZenMode ? {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg-primary)',
        padding: '1rem',
        overflow: 'hidden'
      } : {})
    }}>
      {/* Proctor Alert Floating Notification */}
      {showProctorAlert && isChallengeActive && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100000,
          background: '#ef4444',
          color: '#ffffff',
          padding: '10px 22px',
          borderRadius: '10px',
          boxShadow: '0 8px 30px rgba(239, 68, 68, 0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 800,
          fontSize: '0.88rem'
        }}>
          <ShieldAlert size={18} />
          <span>{proctorAlertMsg}</span>
          <button
            type="button"
            onClick={() => setShowProctorAlert(false)}
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '3px 8px',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* ─── MODAL: DISQUALIFIED FROM CHALLENGE (3/3 INFRACTIONS) ─── */}
      {disqualifiedReason && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100001,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#13141a',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '460px',
            padding: '2rem',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(239, 68, 68, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '1.25rem'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <ShieldAlert size={30} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', margin: '0 0 8px 0' }}>
                Disqualified from Challenge
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#fca5a5', lineHeight: 1.5, margin: '0 0 10px 0', fontWeight: 700 }}>
                {disqualifiedReason}
              </p>
              <p style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
                You reached the maximum limit of 3 infractions (3/3). You have been removed from the active sprint to preserve exam integrity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDisqualifiedReason(null);
                proctorWarningsRef.current = 0;
                lastInfractionTimeRef.current = 0;
                setProctorWarnings(0);
              }}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.65rem', fontSize: '0.9rem', fontWeight: 800, marginTop: '0.5rem' }}
            >
              Return to Study Room
            </button>
          </div>
        </div>
      )}

      {/* ─── SPEC HEADER (BY PRIORITY) ─── */}
      {isChallengeActive && stageState !== 'live_question' ? (
        <div style={{
          padding: '0.65rem 1.25rem',
          borderRadius: '12px',
          background: 'rgba(17, 24, 39, 0.85)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#f59e0b'
            }}>
              <ShieldAlert size={14} />
              <span>PROCTORED SPRINT ACTIVE</span>
            </div>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
              {activeChallenge?.title || 'Arena Challenge'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {proctorWarnings > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#f87171',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '0.76rem',
                fontWeight: 800
              }}>
                ⚠️ Infractions: {proctorWarnings}/3
              </div>
            )}

            {!isFullscreenActive && (
              <button
                type="button"
                onClick={() => {
                  if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  }
                }}
                className="btn btn-secondary"
                style={{ padding: '3px 10px', fontSize: '0.74rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Maximize2 size={13} /> Re-enter Fullscreen
              </button>
            )}

            <button
              type="button"
              onClick={handleCancelChallenge}
              className="btn btn-secondary"
              style={{ padding: '3px 10px', fontSize: '0.74rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              Exit Sprint
            </button>
          </div>
        </div>
      ) : isZenMode ? (
        <div style={{
          padding: '0.5rem 1rem',
          borderRadius: '12px',
          background: 'rgba(17, 24, 39, 0.75)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981' }}>🧘 Zen Mode Active</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• {room.title}</span>
          </div>
          <button
            onClick={() => setIsZenMode(false)}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
          >
            Exit Zen
          </button>
        </div>
      ) : (
      <header className="glass-panel" style={{
        padding: '0.85rem 1.5rem',
        minHeight: '64px',
        height: isMobile ? 'auto' : '64px',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        gap: '1.25rem',
        flexShrink: 0
      }}>
        {/* Left Side: ← RoomTitle | 🟢 N online · ⏳ Expires in 43m ▾ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/rooms')}
            className="icon-btn"
            style={{ color: 'var(--text-secondary)' }}
            title="Back to Study Rooms"
          >
            <ArrowLeft size={19} />
          </button>

          <h1 style={{ fontSize: '1.22rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
            {room.title}
          </h1>

          <div style={{ width: '1px', height: '16px', background: 'var(--border-light)', margin: '0 2px' }} />

          {/* Grouped Room Status Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Live Presence Indicator (Green): 🟢 N online */}
            <button
              onClick={() => {
                if (isMobile) {
                  setActiveTab('chat');
                }
                setRightRailTab('people');
                if (isChatCollapsed) setChatCollapsedManually(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '16px',
                padding: '3px 10px',
                cursor: 'pointer',
                color: '#10b981',
                transition: 'all 0.15s ease'
              }}
              title="Click to view peers in People tab"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                {participantsList.length} online
              </span>
            </button>

            {/* Expiry Chip: Only show dropdown & timer controls if room has an expiry */}
            {room.expiresAt && expiryDisplay !== 'No Expiry' ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowExpiryPopover(prev => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: isExpiryAmber ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isExpiryAmber ? 'rgba(245, 158, 11, 0.5)' : 'var(--border-light)'}`,
                    color: isExpiryAmber ? '#f59e0b' : 'var(--text-secondary)',
                    padding: '3px 9px',
                    borderRadius: '14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title={`Room session expires in ${expiryDisplay}. Click for host duration controls.`}
                >
                  <Clock size={12} />
                  <span>Expires in {expiryDisplay}</span>
                  <span style={{ fontSize: '0.62rem' }}>▾</span>
                </button>

                {showExpiryPopover && (
                  <div
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '125%',
                      zIndex: 250,
                      width: '220px',
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      animation: 'fadeIn 0.15s ease-out'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Room Timer Controls
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Expires in: <strong style={{ color: isExpiryAmber ? '#f59e0b' : 'var(--text-primary)' }}>{expiryDisplay}</strong>
                    </div>

                    {isHost ? (
                      <>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Host Extension Options:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                          {[
                            { label: '+5 Min', m: 5 },
                            { label: '+15 Min', m: 15 },
                            { label: '+30 Min', m: 30 },
                            { label: '-5 Min', m: -5 },
                          ].map(ext => (
                            <button
                              key={ext.m}
                              onClick={() => {
                                handleAdjustRoomTimer(ext.m);
                                setShowExpiryPopover(false);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '4px', fontSize: '0.74rem', fontWeight: 700 }}
                            >
                              {ext.label}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                        Only the room host can adjust room duration.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-muted)',
                  padding: '3px 9px',
                  borderRadius: '14px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  userSelect: 'none'
                }}
              >
                <span>No Expiry</span>
              </div>
            )}
          </div>

          {/* Session Goal Chip in Header (No emoji icon) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '3px 10px',
            fontSize: '0.78rem'
          }}>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Goal:</span>
            <span style={{
              maxWidth: '220px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: myGoal ? 'var(--text-primary)' : 'var(--text-muted)',
              fontStyle: myGoal ? 'normal' : 'italic',
              fontWeight: 600
            }}>
              {myGoal ? `"${myGoal}"` : 'No goal set'}
            </span>
            <button
              onClick={() => { setGoalInput(myGoal); setShowGoalModal(true); }}
              className="btn btn-secondary"
              style={{ padding: '1px 7px', fontSize: '0.72rem', height: '22px', borderRadius: '8px', fontWeight: 700 }}
            >
              {myGoal ? 'Edit' : 'Set'}
            </button>
          </div>
        </div>

        {/* Right Side: Audio Popover, Exit, More (⋯) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {participantsList.length < 2 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Invite:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-primary)', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 7px', borderRadius: '4px' }}>
                {room.roomCode}
              </span>
              <button
                onClick={copyRoomLink}
                className="btn btn-secondary"
                style={{ padding: '2px 7px', fontSize: '0.72rem', height: '24px', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Copy room invite link"
              >
                {copiedLink ? <Check size={11} style={{ color: '#10b981' }} /> : <Copy size={11} />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

          {/* Exit Button */}
          <button
            onClick={handleExitRoom}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <LogOut size={14} /> Exit
          </button>

          {/* More Options (⋯) Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMoreMenu(prev => !prev)}
              className="icon-btn"
              style={{ color: 'var(--text-secondary)', padding: '6px' }}
              title="More options"
            >
              <MoreHorizontal size={18} />
            </button>

            {showMoreMenu && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '120%',
                  zIndex: 200,
                  width: '200px',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  animation: 'fadeIn 0.15s ease-out'
                }}
              >
                <button
                  onClick={() => { copyRoomLink(); setShowMoreMenu(false); }}
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Copy size={14} /> Copy Room Link
                </button>

                {isHost && (
                  <button
                    onClick={() => { setShowCloseConfirmModal(true); setShowMoreMenu(false); }}
                    style={{
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      border: 'none',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700
                    }}
                  >
                    <Trash2 size={14} /> Close Room (Host)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      )}

      {/* ─── TWO-COLUMN WORKSPACE: STATE-DRIVEN STAGE + CHAT RAIL ─── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '0.75rem' : '1.25rem',
        flex: 1,
        minHeight: 0,
        height: '100%',
        overflow: isMobile ? 'auto' : 'hidden'
      }}>
        
        {/* ─── LEFT STAGE (STATE-DRIVEN) ─── */}
        <div style={{
          display: isMobile && activeTab === 'chat' ? 'none' : 'flex',
          flex: isMobile ? '1 1 100%' : (isChatCollapsed ? '1 1 96%' : '1 1 65%'),
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
          height: '100%',
          transition: 'flex 0.25s ease'
        }}>

          {/* ═════════════════════════════════════════════════════
              STATE 1: IDLE
              Spacious collaborative hub, session goal, invite card, recent sprints
             ═════════════════════════════════════════════════════ */}
          {/* ─── TABS DIRECTLY ABOVE THE STAGE (SWITCHER) ─── */}
          {!isChallengeActive && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '0.45rem',
              borderBottom: '1px solid var(--border-light)',
              marginBottom: '0.85rem',
              gap: '0.75rem',
              flexWrap: 'wrap',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {[
                  { id: 'challenge', label: 'OA Blitz Arena', icon: Swords },
                  { id: 'notes', label: 'Scratchpad', icon: FileText },
                  ...(isMobile ? [{ id: 'chat', label: `Chat (${messages.length})`, icon: MessageSquare }] : [])
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: isActive ? 800 : 600,
                        border: isActive ? '1px solid var(--border-strong)' : '1px solid transparent',
                        background: isActive ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.04)',
                        color: isActive ? 'var(--brand-inverse)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon size={13} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════
              TAB 2: COLLABORATIVE SCRATCHPAD
             ═════════════════════════════════════════════════════ */}
          {activeTab === 'notes' && (
            <div className="card glass-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} style={{ color: '#3b82f6' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Room Scratchpad</h3>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                    Shared Markdown
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setScratchpadView(prev => (prev === 'edit' ? 'preview' : 'edit'))}
                    className="btn btn-secondary"
                    style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                  >
                    {scratchpadView === 'edit' ? 'Show Preview' : 'Edit Markdown'}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sharedNotes);
                      toast.success('Notes copied to clipboard!');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '3px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, minHeight: '340px', display: 'flex' }}>
                {scratchpadView === 'edit' ? (
                  <textarea
                    value={sharedNotes}
                    onChange={(e) => setSharedNotes(e.target.value)}
                    style={{
                      width: '100%',
                      height: '100%',
                      padding: '1rem',
                      fontFamily: 'monospace',
                      fontSize: '0.88rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      resize: 'none',
                      outline: 'none',
                      lineHeight: 1.6
                    }}
                    placeholder="Write collaborative notes, pseudo-code, LeetCode patterns, or meeting minutes..."
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    {sharedNotes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════
              TAB 3 / STAGE 1: OA BLITZ ARENA (IDLE STAGE)
             ═════════════════════════════════════════════════════ */}
          {activeTab === 'challenge' && stageState === 'idle' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              height: '100%',
              minHeight: 0,
              gap: '2rem',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              
              {/* ─── 1. TOP BIG HERO BLOCK: CHOOSE AN ARENA (4 SPACIOUS COLUMNS) ─── */}
              <div className="card glass-panel" style={{
                padding: isTimerExpanded ? '0 1.5rem' : '1.5rem 1.75rem',
                maxHeight: isTimerExpanded ? '0px' : '450px',
                opacity: isTimerExpanded ? 0 : 1,
                overflow: 'hidden',
                borderRadius: '18px',
                background: 'var(--bg-surface)',
                border: isTimerExpanded ? '0px solid transparent' : '1px solid var(--border-light)',
                flexShrink: 0,
                pointerEvents: isTimerExpanded ? 'none' : 'auto',
                transition: 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, padding 0.4s ease, border 0.3s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.22rem', fontWeight: 900, margin: '0 0 4px 0', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      Choose an Arena
                    </h3>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      Multiplayer challenge modes for instant co-working practice
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                  gap: '1.25rem',
                  minHeight: 0
                }}>
                      {[
                        {
                          mode: 'STANDARD',
                          icon: Zap,
                          title: 'OA Blitz',
                          badge: 'Free-For-All',
                          players: '1+ Players',
                          minPlayers: 1,
                          desc: 'Speed sprint with individual ranking & reflex bonuses.'
                        },
                        {
                          mode: 'BOSS',
                          icon: Flame,
                          title: 'Co-op Boss Battle',
                          badge: 'Shared HP',
                          players: '2+ Players',
                          minPlayers: 2,
                          desc: 'Collaborate to defeat the Algorithmic Dragon with shared HP.'
                        },
                        {
                          mode: 'SURVIVAL',
                          icon: ShieldAlert,
                          title: 'Survival Arena',
                          badge: 'Sudden-Death',
                          players: '2+ Players',
                          minPlayers: 2,
                          desc: 'Sudden-death elimination. Answer wrong and switch to spectator.'
                        },
                        {
                          mode: 'TEAMS',
                          icon: Users2,
                          title: 'Squad Battle',
                          badge: 'Blue vs Violet',
                          players: '2+ Players',
                          minPlayers: 2,
                          desc: 'Team Alpha (Blue) vs Team Beta (Violet) aggregate squad match.'
                        },
                      ].map(arena => {
                        const isLaunchable = participantsList.length >= arena.minPlayers;
                        return (
                          <div
                            key={arena.mode}
                            onClick={() => {
                              if (!isLaunchable) {
                                toast.info(`${arena.title} requires at least ${arena.minPlayers} peers in the room.`);
                                return;
                              }
                              setGameMode(arena.mode);
                              setShowCreateChallengeModal(true);
                            }}
                            className="card"
                            style={{
                              padding: '1.3rem 1.35rem',
                              minHeight: '185px',
                              cursor: isLaunchable ? 'pointer' : 'default',
                              border: '1px solid var(--border-light)',
                              background: 'var(--bg-surface)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              boxSizing: 'border-box',
                              overflow: 'hidden',
                              borderRadius: '16px',
                              transition: 'border-color 0.15s ease, background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
                              opacity: isLaunchable ? 1 : 0.85
                            }}
                            onMouseEnter={(e) => {
                              if (isLaunchable) {
                                e.currentTarget.style.borderColor = '#f59e0b';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.35)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-light)';
                              e.currentTarget.style.background = 'var(--bg-surface)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <div style={{ minHeight: 0, overflow: 'hidden' }}>
                              {/* Top Row: Clean Tags / Badges with good spacing */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                                  {arena.badge}
                                </span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border-light)', color: isLaunchable ? 'var(--text-secondary)' : '#f59e0b' }}>
                                  {arena.players}
                                </span>
                              </div>

                              {/* Game Title: Own Line, Bold & Spacious */}
                              <div style={{ fontWeight: 900, fontSize: '1.12rem', color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                                {arena.title}
                              </div>

                              {/* Description with comfortable line height */}
                              <p style={{
                                fontSize: '0.8rem',
                                color: 'rgba(255, 255, 255, 0.68)',
                                lineHeight: 1.5,
                                margin: 0,
                                minHeight: '38px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {arena.desc}
                              </p>
                            </div>

                            {/* Clean Spacious Launch Button */}
                            <button
                              type="button"
                              disabled={!isLaunchable}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isLaunchable) {
                                  toast.info(`${arena.title} requires at least ${arena.minPlayers} peers in the room.`);
                                  return;
                                }
                                setGameMode(arena.mode);
                                setShowCreateChallengeModal(true);
                              }}
                              className="btn btn-secondary"
                              style={{
                                width: '100%',
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                marginTop: '0.9rem',
                                borderRadius: '10px',
                                flexShrink: 0,
                                opacity: isLaunchable ? 1 : 0.45,
                                cursor: isLaunchable ? 'pointer' : 'not-allowed'
                              }}
                              title={isLaunchable ? 'Launch arena challenge' : `Needs ${arena.minPlayers}+ peers in room to launch`}
                            >
                              <Play size={12} fill="currentColor" /> Launch
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ─── 2. BOTTOM SPLIT: FOCUS TIMER & RECENT SPRINTS (FILLS REMAINING HEIGHT) ─── */}
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isTimerExpanded ? '0' : '1.75rem',
                    alignItems: 'stretch',
                    flex: 1,
                    minHeight: isTimerExpanded ? '460px' : '340px',
                    transition: 'gap 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}>

                    {/* LEFT BLOCK: FOCUS TIMER (FULL HEIGHT) */}
                    <div className="card glass-panel" style={{
                      flex: isTimerExpanded ? '1 1 100%' : '1.1 1 0',
                      width: '100%',
                      height: '100%',
                      padding: isTimerExpanded ? '1.5rem 2rem' : '1.15rem 1.35rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxSizing: 'border-box',
                      overflow: 'visible',
                      transition: 'flex 0.4s cubic-bezier(0.16, 1, 0.3, 1), padding 0.3s ease'
                    }}>
                    {/* Top Segmented Pill Switcher with Fullscreen Toggle near Custom */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      flexShrink: 0
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '26px',
                        padding: '3px 4px',
                        gap: '3px',
                        maxWidth: '100%',
                        overflowX: 'auto',
                        flexShrink: 0
                      }}>
                        {[
                          { id: 'FOCUS', label: 'Focus (25m)', mins: 25, phase: 'WORK' },
                          { id: 'SHORT_BREAK', label: 'Short Break (5m)', mins: 5, phase: 'BREAK' },
                          { id: 'LONG_BREAK', label: 'Long Break (15m)', mins: 15, phase: 'BREAK' },
                          { id: 'CUSTOM', label: 'Custom', mins: parseInt(customFocusInput, 10) || 50, phase: 'WORK' },
                        ].map(tab => {
                          const isActive = timerMode === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => {
                                setTimerMode(tab.id);
                                if (tab.id === 'CUSTOM') {
                                  setShowCustomFocusInput(true);
                                } else {
                                  setShowCustomFocusInput(false);
                                  setPomodoroDurationMinutes(tab.mins);
                                  setPomodoroSeconds(tab.mins * 60);
                                  setPomodoroRunning(false);
                                  setPomodoroPhase(tab.phase);
                                }
                              }}
                              style={{
                                padding: '5px 13px',
                                borderRadius: '18px',
                                fontSize: '0.82rem',
                                fontWeight: isActive ? 800 : 600,
                                border: 'none',
                                cursor: 'pointer',
                                background: isActive ? '#ffffff' : 'transparent',
                                color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {tab.label}
                            </button>
                          );
                        })}

                        {/* Full Screen Toggle Icon (near Custom button) */}
                        <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.15)', margin: '0 2px' }} />
                        <button
                          type="button"
                          onClick={() => setIsTimerExpanded(prev => !prev)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: isTimerExpanded ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                            border: isTimerExpanded ? '1px solid #10b981' : 'none',
                            color: isTimerExpanded ? '#10b981' : 'rgba(255, 255, 255, 0.75)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            flexShrink: 0
                          }}
                          title={isTimerExpanded ? "Restore Game Arena and Recent Sprints" : "Full screen focus timer (minimize arena & sprints)"}
                        >
                          {isTimerExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Inline Custom Minutes Config */}
                    {showCustomFocusInput && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        margin: '4px 0',
                        flexShrink: 0
                      }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Focus duration:</span>
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={customFocusInput}
                          onChange={(e) => setCustomFocusInput(e.target.value)}
                          style={{
                            width: '46px',
                            padding: '3px 6px',
                            borderRadius: '5px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid var(--border-light)',
                            color: '#ffffff',
                            fontSize: '0.86rem',
                            fontWeight: 700,
                            textAlign: 'center',
                            outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>mins</span>
                        <button
                          type="button"
                          onClick={() => {
                            const mins = Math.max(1, Math.min(180, parseInt(customFocusInput, 10) || 25));
                            setPomodoroDurationMinutes(mins);
                            setPomodoroSeconds(mins * 60);
                            setPomodoroRunning(false);
                            setPomodoroPhase('WORK');
                            toast.success(`Custom focus interval set to ${mins} minutes!`);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '3px 10px', fontSize: '0.78rem', fontWeight: 800 }}
                        >
                          Set
                        </button>
                      </div>
                    )}

                    {/* Middle Area: Centered Timer Circle */}
                    {(() => {
                      const circleSize = isTimerExpanded ? 280 : 185;
                      const radius = isTimerExpanded ? 122 : 80;
                      const circumference = 2 * Math.PI * radius;
                      const progress = Math.min(1, Math.max(0, pomodoroSeconds / (pomodoroDurationMinutes * 60 || 1500)));
                      const offset = circumference * (1 - progress);
                      return (
                        <div style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          margin: '0.35rem 0'
                        }}>
                          <div style={{
                            position: 'relative',
                            width: `${circleSize}px`,
                            height: `${circleSize}px`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <svg width={circleSize} height={circleSize} viewBox={`0 0 ${circleSize} ${circleSize}`} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                              {/* Background subtle ring */}
                              <circle
                                cx={circleSize / 2} cy={circleSize / 2} r={radius}
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.08)"
                                strokeWidth="7"
                              />
                              {/* Active emerald countdown ring (vibrant green) */}
                              <circle
                                cx={circleSize / 2} cy={circleSize / 2} r={radius}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="7"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                              />
                            </svg>

                            {/* Centered Digits & Subtitle */}
                            <div style={{
                              position: 'absolute',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              width: '100%',
                              padding: '0 4px',
                              pointerEvents: 'none'
                            }}>
                              <div style={{
                                fontSize: isTimerExpanded ? '3.6rem' : '2.45rem',
                                fontWeight: 900,
                                fontFamily: 'monospace',
                                letterSpacing: '-0.02em',
                                color: '#ffffff',
                                lineHeight: 1
                              }}>
                                {Math.floor(pomodoroSeconds / 60).toString().padStart(2, '0')}:{(pomodoroSeconds % 60).toString().padStart(2, '0')}
                              </div>
                              <div style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                color: 'rgba(255, 255, 255, 0.75)',
                                textTransform: 'uppercase',
                                marginTop: '4px',
                                whiteSpace: 'nowrap'
                              }}>
                                {timerMode === 'SHORT_BREAK' ? 'SHORT BREAK' : timerMode === 'LONG_BREAK' ? 'LONG BREAK' : 'FOCUS SESSION'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Bottom Controls Row: Reset, Start Focus Pill, Ambient Audio Popover */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      position: 'relative',
                      marginTop: 'auto',
                      paddingTop: '0.4rem',
                      width: '100%'
                    }}>
                      {/* Reset button */}
                      <button
                        type="button"
                        onClick={() => {
                          setPomodoroRunning(false);
                          setPomodoroSeconds(pomodoroDurationMinutes * 60);
                          toast.info('Timer reset');
                        }}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid var(--border-light)',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title="Reset timer"
                      >
                        <RotateCcw size={14} />
                      </button>

                      {/* Start / Pause Focus button (Pill) */}
                      <button
                        type="button"
                        onClick={() => {
                          setPomodoroRunning(prev => {
                            const next = !prev;
                            if (next) toast.info(pomodoroPhase === 'WORK' ? 'Focus timer started! 🎯' : 'Break timer started! ☕');
                            else toast.info('Focus timer paused ⏸️');
                            return next;
                          });
                        }}
                        style={{
                          height: '38px',
                          padding: '0 20px',
                          borderRadius: '19px',
                          background: '#ffffff',
                          color: '#000000',
                          fontWeight: 800,
                          fontSize: '0.86rem',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          boxShadow: '0 4px 16px rgba(255, 255, 255, 0.25)',
                          transition: 'transform 0.1s ease, box-shadow 0.1s ease'
                        }}
                      >
                        {pomodoroRunning ? <Pause size={14} fill="#000000" /> : <Play size={14} fill="#000000" />}
                        <span>{pomodoroRunning ? 'Pause Focus' : 'Start Focus'}</span>
                      </button>

                      {/* Ambient Focus Audio Popover Button */}
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setShowAudioPopover(prev => !prev)}
                          style={{
                            height: '36px',
                            padding: '0 12px',
                            borderRadius: '18px',
                            background: soundPlaying ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                            border: soundPlaying ? '1px solid #10b981' : '1px solid var(--border-light)',
                            color: soundPlaying ? '#10b981' : 'var(--text-secondary)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="Ambient Focus Sounds"
                        >
                          <Headphones size={14} style={{ color: soundPlaying ? '#10b981' : 'currentColor' }} />
                          <span style={{ textTransform: 'capitalize' }}>
                            {activeSound !== 'none' && soundPlaying ? activeSound.replace('_', ' ') : 'Audio'}
                          </span>
                          <span style={{ fontSize: '0.65rem' }}>▾</span>
                        </button>

                        {showAudioPopover && (
                          <div
                            className="glass-panel"
                            style={{
                              position: 'absolute',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              bottom: '125%',
                              zIndex: 300,
                              width: '180px',
                              padding: '0.5rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              boxShadow: '0 12px 32px rgba(0,0,0,0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              background: '#111827',
                              borderRadius: '12px',
                              animation: 'fadeIn 0.15s ease-out'
                            }}
                          >
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>
                              Ambient Focus Audio
                            </div>
                            {[
                              { id: 'none', label: 'Muted (Off)' },
                              { id: 'lofi', label: 'Lo-Fi Beats' },
                              { id: 'brown_noise', label: 'Ocean Waves' },
                              { id: 'rain', label: 'Gentle Rain' },
                              { id: 'cafe', label: 'Cozy Cafe' },
                            ].map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectSound(item.id)}
                                style={{
                                  textAlign: 'left',
                                  padding: '0.45rem 0.75rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: activeSound === item.id ? 700 : 500,
                                  border: 'none',
                                  background: activeSound === item.id ? '#ffffff' : 'transparent',
                                  color: activeSound === item.id ? '#000000' : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  transition: 'all 0.1s ease'
                                }}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ─── RIGHT BLOCK: RECENT SPRINTS (FULL HEIGHT) ─── */}
                  <div className="card glass-panel" style={{
                    flex: isTimerExpanded ? '0 0 0px' : '1 1 0',
                    maxWidth: isTimerExpanded ? '0px' : '100%',
                    opacity: isTimerExpanded ? 0 : 1,
                    overflow: 'hidden',
                    padding: isTimerExpanded ? '0' : '1.15rem 1.35rem',
                    background: 'var(--bg-surface)',
                    border: isTimerExpanded ? '0px solid transparent' : '1px solid var(--border-light)',
                    borderRadius: '16px',
                    height: '100%',
                    minHeight: 0,
                    pointerEvents: isTimerExpanded ? 'none' : 'auto',
                    transition: 'flex 0.4s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, padding 0.4s ease, border 0.3s ease'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <Trophy size={18} style={{ color: '#f59e0b' }} />
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Recent Sprints</h4>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '12px' }}>
                      {(room.pastChallenges || []).length} recorded
                    </span>
                  </div>

                  {(!room.pastChallenges || room.pastChallenges.length === 0) ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', gap: '8px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trophy size={18} style={{ opacity: 0.4 }} />
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        No sprints completed yet in this room.
                      </div>
                      <p style={{ fontSize: '0.74rem', margin: 0, maxWidth: '240px', lineHeight: 1.4 }}>
                        Pick an arena above to start your first multiplayer challenge!
                      </p>
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem', overflowY: 'auto', padding: '4px 2px 4px 2px' }}>
                      {room.pastChallenges.map((ch, idx) => {
                        const top = ch.leaderboard && ch.leaderboard.length > 0 ? ch.leaderboard[0] : null;
                        const modeTag = ch.gameMode === 'BOSS' ? 'Co-op Boss' : ch.gameMode === 'SURVIVAL' ? 'Survival' : ch.gameMode === 'TEAMS' ? 'Squad' : 'OA Blitz';
                        const isViewing = viewingPastChallenge && (viewingPastChallenge.title === ch.title && viewingPastChallenge.createdAt === ch.createdAt);
                        return (
                          <div
                            key={idx}
                            onClick={() => setViewingPastChallenge(ch)}
                            style={{
                              padding: '0.55rem 0.8rem',
                              borderRadius: '8px',
                              background: isViewing ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                              border: isViewing ? '1.5px solid #f59e0b' : '1px solid var(--border-light)',
                              boxShadow: isViewing ? '0 0 0 1px #f59e0b' : 'none',
                              boxSizing: 'border-box',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                              e.currentTarget.style.borderColor = '#f59e0b';
                              e.currentTarget.style.boxShadow = '0 0 0 1px #f59e0b';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = isViewing ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.03)';
                              e.currentTarget.style.borderColor = isViewing ? '#f59e0b' : 'var(--border-light)';
                              e.currentTarget.style.boxShadow = isViewing ? '0 0 0 1px #f59e0b' : 'none';
                            }}
                            title="Click to view sprint standings & export result image"
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.82rem' }}>{ch.title}</span>
                                <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', fontWeight: 700 }}>
                                  {modeTag}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {ch.questionCount}Q • {ch.perQuestionSeconds}s/Q
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {ch.status === 'CANCELLED' ? (
                                <span style={{ fontSize: '0.68rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                  Cancelled
                                </span>
                              ) : top ? (
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    🥇 {top.userName}
                                  </div>
                                  <div style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 700 }}>
                                    {top.score} pts
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Concluded</span>
                              )}
                              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                <ChevronRight size={13} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════
              STATE 2: INVITE OPEN (MODE-AWARE ARENA LOBBY)
             ═════════════════════════════════════════════════════ */}
          {stageState === 'invite_open' && activeChallenge && (() => {
            const chMode = (activeChallenge.gameMode || 'STANDARD').toUpperCase();
            const teamAlphaPeers = participantsList.filter((_, idx) => idx % 2 === 0);
            const teamBetaPeers = participantsList.filter((_, idx) => idx % 2 !== 0);
            const myAssignedTeam = participantsList.findIndex(p => p.userId === currentUserId) % 2 === 0 ? 'ALPHA' : 'BETA';

            const countdownSecs = lobbyCountdown !== null ? lobbyCountdown : 30;

            return (
              <div className="card glass-panel" style={{
                flex: 1,
                padding: '1.75rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '16px',
                background: 'rgba(15, 17, 23, 0.95)',
                border: '1px solid var(--border-light)'
              }}>
                <div>
                  {/* Mode Badge & Sprint Title */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: chMode === 'BOSS' ? 'rgba(239, 68, 68, 0.15)' : chMode === 'SURVIVAL' ? 'rgba(168, 85, 247, 0.15)' : chMode === 'TEAMS' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.75rem', color: chMode === 'BOSS' ? '#f87171' : chMode === 'SURVIVAL' ? '#c084fc' : chMode === 'TEAMS' ? '#60a5fa' : '#f59e0b' }}>
                    <Zap size={14} />
                    <span>{chMode === 'BOSS' ? 'Co-op Boss Battle Ready' : chMode === 'SURVIVAL' ? 'Sudden-Death Survival Ready' : chMode === 'TEAMS' ? 'Squad Team Battle Ready' : 'OA Blitz Challenge Ready'}</span>
                  </div>

                  <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', margin: '0 0 1.5rem 0' }}>
                    {activeChallenge.title}
                  </h2>

                  {/* ─── TWO COLUMN LOBBY (ELIMINATES DEAD SPACE) ─── */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr',
                    gap: '1.5rem',
                    alignItems: 'stretch'
                  }}>
                    {/* LEFT COLUMN: ROUND TIMER & METADATA IN BLOCKS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* Round Timer Block */}
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '14px',
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        boxShadow: '0 0 25px -5px rgba(245, 158, 11, 0.15)'
                      }}>
                        {/* Circular Countdown Ring */}
                        <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0 }}>
                          <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
                            <circle
                              cx="48"
                              cy="48"
                              r="42"
                              stroke="rgba(255, 255, 255, 0.08)"
                              strokeWidth="6"
                              fill="transparent"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="42"
                              stroke="#f59e0b"
                              strokeWidth="6"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 42}
                              strokeDashoffset={2 * Math.PI * 42 * (1 - (countdownSecs / 30))}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dashoffset 1s linear' }}
                            />
                          </svg>
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'monospace',
                            color: '#ffffff'
                          }}>
                            <span style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1, color: '#f59e0b' }}>
                              {countdownSecs}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>
                              SEC
                            </span>
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#ffffff' }}>
                              Lobby Countdown Active
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'rgba(245, 158, 11, 0.25)', color: '#f59e0b', padding: '1px 6px', borderRadius: '6px' }}>
                              Auto-start
                            </span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.45, margin: 0 }}>
                            Sprint will automatically launch in <strong>{countdownSecs}s</strong>. Click start below to skip waiting.
                          </p>
                        </div>
                      </div>

                      {/* Instead of text, show in modern blocks (2x2 grid) */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '0.75rem'
                      }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                            Questions
                          </div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>
                            {activeChallenge.questionCount || 5} Questions
                          </div>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                            Time per Question
                          </div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>
                            {activeChallenge.perQuestionSeconds || 30}s / Q
                          </div>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                            Scoring Rule
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: activeChallenge.negativeMarking ? '#f87171' : '#10b981' }}>
                            {activeChallenge.negativeMarking ? 'Negative Marking' : 'Standard Scoring'}
                          </div>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                            Arena Mode
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#60a5fa' }}>
                            {chMode === 'BOSS' ? 'Co-op Boss' : chMode === 'SURVIVAL' ? 'Survival Arena' : chMode === 'TEAMS' ? 'Squad Match' : 'OA Blitz'}
                          </div>
                        </div>
                      </div>

                      {/* Mode specials (Boss / Survival) */}
                      {chMode === 'BOSS' && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f87171', marginBottom: '2px' }}>
                            🐉 Boss: The Algorithmic Dragon (1,000 HP)
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#fca5a5' }}>
                            Shared health pool. Correct answers deal -100 HP damage. Wrong answers heal the dragon +50 HP.
                          </div>
                        </div>
                      )}
                      {chMode === 'SURVIVAL' && (
                        <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#c084fc', marginBottom: '2px' }}>
                            🛡️ Sudden-Death Survival
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#e9d5ff' }}>
                            1 Life each. Answering incorrectly or timing out eliminates you to Spectator Mode!
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT COLUMN: JOINED PARTICIPANTS */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '14px',
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                            Joined Participants
                          </h4>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: '10px' }}>
                          {participantsList.length} Connected
                        </span>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '280px', paddingRight: '4px' }}>
                        {participantsList.map((p, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              padding: '0.65rem 0.9rem',
                              borderRadius: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                color: '#ffffff'
                              }}>
                                {(p.userName || 'P').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>{p.userName}</span>
                                  {p.userId === currentUserId && (
                                    <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>(You)</span>
                                  )}
                                  {p.userId === room.hostUserId && (
                                    <Crown size={13} style={{ color: '#f59e0b' }} title="Host" />
                                  )}
                                </div>
                              </div>
                            </div>

                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: '#10b981',
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              Ready
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Squad Breakdown (if TEAMS mode) */}
                      {chMode === 'TEAMS' && (
                        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                            <strong style={{ color: '#60a5fa' }}>🔵 Team Alpha:</strong> {teamAlphaPeers.map(p => p.userName).join(', ')}
                          </div>
                          <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                            <strong style={{ color: '#f87171' }}>🔴 Team Beta:</strong> {teamBetaPeers.map(p => p.userName).join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Launch Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    onClick={() => {
                      if (typeof document !== 'undefined' && document.documentElement?.requestFullscreen && !document.fullscreenElement) {
                        document.documentElement.requestFullscreen().then(() => setIsFullscreenActive(true)).catch(() => {});
                      }
                      handleStartChallenge(activeChallenge);
                    }}
                    className="btn btn-primary"
                    style={{ padding: '0.85rem 2.25rem', fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Play size={18} /> {chMode === 'BOSS' ? 'Battle the Boss' : chMode === 'SURVIVAL' ? 'Enter Survival Arena' : chMode === 'TEAMS' ? 'Launch Squad Match' : 'Start Blitz Challenge'} {countdownSecs > 0 ? `(${countdownSecs}s)` : ''}
                  </button>

                  <button
                    onClick={handleCancelChallenge}
                    className="btn btn-secondary"
                    style={{ padding: '0.85rem 1.5rem', fontWeight: 700 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ═════════════════════════════════════════════════════
              STATE 3: LIVE QUESTION (OA SPRINT - IMAGE 3 DESIGN)
             ═════════════════════════════════════════════════════ */}
          {stageState === 'live_question' && gameQuestions.length > 0 && (
            <div className="card glass-panel" style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '1.5rem 1.75rem',
              borderRadius: '16px',
              border: '1px solid var(--border-strong)',
              background: 'rgba(15, 17, 23, 0.95)',
              position: 'relative'
            }}>
              <div>
                {/* 1. Top Bar matching Image 1 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#f59e0b'
                    }}>
                      <Shield size={13} style={{ color: '#f59e0b' }} />
                      <span>Proctored</span>
                    </div>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ffffff' }}>
                      {activeChallenge?.title || room?.activeChallenge?.title || 'OA Blitz Sprint'}
                    </span>
                  </div>
                </div>

                {/* 2. Segmented Horizontal Progress Bar matching Image 1 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  marginBottom: '1.35rem'
                }}>
                  {gameQuestions.map((_, qIdx) => {
                    const isPassedOrActive = qIdx <= currentQIdx;
                    return (
                      <div
                        key={qIdx}
                        style={{
                          flex: 1,
                          height: '4px',
                          borderRadius: '2px',
                          background: isPassedOrActive ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                          boxShadow: isPassedOrActive ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
                          transition: 'background 0.3s ease'
                        }}
                      />
                    );
                  })}
                </div>

                {/* 3. Subheader: Question X of Y + Topic Tag (Spacious, points/timer in live leaderboard on right) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '1.35rem'
                }}>
                  <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff' }}>
                    Question {currentQIdx + 1} of {gameQuestions.length}
                  </span>
                  <span style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.55)',
                    fontWeight: 600
                  }}>
                    {gameQuestions[currentQIdx].module || 'Introduction to IoT — Part II'}
                  </span>
                </div>

                {/* Co-op Boss Battle Banner (if BOSS mode) */}
                {room?.activeChallenge?.gameMode === 'BOSS' && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '0.65rem 1rem', marginBottom: '1.15rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🐉 The Algorithmic Dragon
                        {bossHitEffect && (
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 900,
                            padding: '1px 7px',
                            borderRadius: '8px',
                            background: bossHitEffect.type === 'DMG' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                            color: bossHitEffect.type === 'DMG' ? '#fca5a5' : '#34d399',
                          }}>
                            {bossHitEffect.text}
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: bossHp <= 250 ? '#ef4444' : '#fca5a5', fontFamily: 'monospace' }}>
                        {bossHp} / {bossMaxHp} HP ({Math.round((bossHp / bossMaxHp) * 100)}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.max(0, Math.min(100, (bossHp / bossMaxHp) * 100))}%`,
                        height: '100%',
                        background: bossHp <= 250 ? '#ef4444' : 'linear-gradient(90deg, #ef4444, #f59e0b)',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                )}

                {/* Survival Status Banner (if SURVIVAL mode) */}
                {room?.activeChallenge?.gameMode === 'SURVIVAL' && (
                  <div style={{
                    background: isEliminated ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                    border: `1px solid ${isEliminated ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.3)'}`,
                    borderRadius: '10px',
                    padding: '0.6rem 1rem',
                    marginBottom: '1.15rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={15} style={{ color: isEliminated ? '#ef4444' : '#10b981' }} />
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: isEliminated ? '#f87171' : '#34d399' }}>
                        {isEliminated ? 'Eliminated in Sudden-Death (Spectating Remaining Round)' : 'Sudden-Death Survival Arena'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Heart size={14} style={{ fill: isEliminated ? 'transparent' : '#ef4444', color: '#ef4444' }} />
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: isEliminated ? '#9ca3af' : '#f87171' }}>
                        {isEliminated ? '0 Lives' : `${survivalLives} Life Remaining`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Squad Battle Tug-of-War Bar (if TEAMS mode) */}
                {room?.activeChallenge?.gameMode === 'TEAMS' && (
                  <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '10px', padding: '0.65rem 1rem', marginBottom: '1.15rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🔵 Team Alpha: {teamAlphaScore} pts {myTeam === 'ALPHA' && <span style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.25)', padding: '1px 5px', borderRadius: '4px' }}>YOU</span>}
                      </span>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                        ⚔️ SQUAD TUG-OF-WAR
                      </span>
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {myTeam === 'BETA' && <span style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.25)', padding: '1px 5px', borderRadius: '4px' }}>YOU</span>} Team Beta: {teamBetaScore} pts 🔴
                      </span>
                    </div>
                    {(() => {
                      const totalPts = Math.max(1, teamAlphaScore + teamBetaScore);
                      const alphaPct = Math.round((teamAlphaScore / totalPts) * 100);
                      const betaPct = 100 - alphaPct;
                      return (
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                          <div style={{ width: `${alphaPct}%`, height: '100%', background: '#3b82f6', transition: 'width 0.3s ease' }} />
                          <div style={{ width: `${betaPct}%`, height: '100%', background: '#ef4444', transition: 'width 0.3s ease' }} />
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 4. Question Scenario Title */}
                <h3 style={{
                  fontSize: '1.22rem',
                  fontWeight: 800,
                  lineHeight: 1.5,
                  color: '#ffffff',
                  marginBottom: '1.5rem'
                }}>
                  {gameQuestions[currentQIdx].scenario}
                </h3>

                {/* 5. Multiple Choice Options matching Image 3 (A, B, C, D badges, green/red blocks, auto-jump) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {(gameQuestions[currentQIdx].options || []).map((opt, oIdx) => {
                    const isSelected = selectedOption === oIdx;
                    const singleCorrectIdx = getSingleCorrectAnswerIndex(gameQuestions[currentQIdx]);
                    const isOptionCorrect = singleCorrectIdx === oIdx;

                    let blockBorder = '1px solid rgba(255, 255, 255, 0.08)';
                    let blockBg = 'rgba(255, 255, 255, 0.025)';
                    let blockColor = 'rgba(255, 255, 255, 0.9)';
                    let badgeBg = 'rgba(255, 255, 255, 0.07)';
                    let badgeColor = 'rgba(255, 255, 255, 0.7)';

                    if (isAnswerEvaluated) {
                      if (isSelected) {
                        if (isOptionCorrect) {
                          blockBorder = '2px solid #10b981';
                          blockBg = 'rgba(16, 185, 129, 0.2)';
                          blockColor = '#34d399';
                          badgeBg = '#10b981';
                          badgeColor = '#ffffff';
                        } else {
                          blockBorder = '2px solid #ef4444';
                          blockBg = 'rgba(239, 68, 68, 0.2)';
                          blockColor = '#f87171';
                          badgeBg = '#ef4444';
                          badgeColor = '#ffffff';
                        }
                      } else if (isOptionCorrect) {
                        blockBorder = '2px solid #10b981';
                        blockBg = 'rgba(16, 185, 129, 0.15)';
                        blockColor = '#34d399';
                        badgeBg = '#10b981';
                        badgeColor = '#ffffff';
                      }
                    } else if (isSelected) {
                      blockBorder = '1.5px solid #10b981';
                      blockBg = 'rgba(16, 185, 129, 0.08)';
                      badgeBg = '#10b981';
                      badgeColor = '#ffffff';
                    }

                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleOptionClick(oIdx)}
                        style={{
                          textAlign: 'left',
                          padding: '0.95rem 1.25rem',
                          borderRadius: '12px',
                          border: blockBorder,
                          background: blockBg,
                          color: blockColor,
                          fontSize: '0.92rem',
                          fontWeight: (isSelected || (isAnswerEvaluated && isOptionCorrect)) ? 700 : 500,
                          cursor: (isAnswerEvaluated || isEliminated) ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isAnswerEvaluated && !isEliminated) {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isAnswerEvaluated && !isEliminated) {
                            e.currentTarget.style.borderColor = blockBorder;
                            e.currentTarget.style.background = blockBg;
                          }
                        }}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 900,
                          background: badgeBg,
                          color: badgeColor,
                          flexShrink: 0
                        }}>
                          {isAnswerEvaluated && isSelected ? (isOptionCorrect ? '✓' : '✕') : isAnswerEvaluated && isOptionCorrect ? '✓' : String.fromCharCode(65 + oIdx)}
                        </div>
                        <span style={{ flex: 1, lineHeight: 1.45 }}>{opt}</span>
                        {isAnswerEvaluated && isSelected && isOptionCorrect && (
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981' }}>Correct</span>
                        )}
                        {isAnswerEvaluated && isSelected && !isOptionCorrect && (
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ef4444' }}>Incorrect</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. Bottom footer matching Image 3 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                  Press A to D to pick, Enter to confirm
                </span>
                <button
                  type="button"
                  onClick={() => handleAdvanceQuestion(false)}
                  disabled={selectedOption === null && !isEliminated}
                  className="btn btn-secondary"
                  style={{
                    padding: '0.6rem 1.6rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    opacity: (selectedOption === null && !isEliminated) ? 0.4 : 1,
                    cursor: (selectedOption === null && !isEliminated) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {currentQIdx >= gameQuestions.length - 1 ? 'Finish Sprint' : 'Next question'}
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════
              STATE 4: CHECKPOINT (EVERY 5 QUESTIONS)
              Mid-Sprint Leaderboard
             ═════════════════════════════════════════════════════ */}
          {stageState === 'checkpoint' && (
            <div className="card" style={{ flex: 1, padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <Trophy size={28} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                  🏁 Checkpoint Leaderboard!
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  {checkpointNextIdx} questions completed. Current live standings:
                </p>

                {/* Ranked Board */}
                <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                  {currentLeaderboard.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem' }}>
                      You are in the lead with {userScore} points!
                    </div>
                  ) : (
                    currentLeaderboard.map((entry, rIdx) => {
                      const isMe = entry.userId === currentUserId;
                      return (
                        <div
                          key={rIdx}
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            background: isMe ? 'rgba(255, 255, 255, 0.1)' : 'var(--bg-surface)',
                            border: isMe ? '1px solid var(--border-strong)' : '1px solid var(--border-light)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', width: '22px' }}>
                              {rIdx === 0 ? '🥇' : rIdx === 1 ? '🥈' : rIdx === 2 ? '🥉' : `#${rIdx + 1}`}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                              {entry.userName} {isMe && '(You)'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {entry.questionsAnswered} ans
                            </span>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#f59e0b' }}>
                              {entry.score} pts
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <button
                  onClick={resumeFromCheckpoint}
                  className="btn btn-primary"
                  style={{ padding: '0.8rem 2.5rem', fontSize: '1rem', fontWeight: 800 }}
                >
                  Continue Next 5 Questions →
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════
              STATE 5: FINAL (PODIUM & POST-SPRINT REVIEW)
             ═════════════════════════════════════════════════════ */}
          {stageState === 'final' && (
            <div className="card" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto' }}>
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  {(() => {
                    const chMode = (room?.activeChallenge?.gameMode || 'STANDARD').toUpperCase();
                    if (chMode === 'BOSS') {
                      const bossDefeated = bossHp <= 0;
                      return (
                        <>
                          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: bossDefeated ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: bossDefeated ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                            <Trophy size={32} />
                          </div>
                          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.25rem', color: bossDefeated ? '#10b981' : 'var(--text-primary)' }}>
                            {bossDefeated ? '🐉 Victory! Dragon Defeated!' : '⚔️ Boss Escaped!'}
                          </h2>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                            {bossDefeated
                              ? `The room triumphed against the Algorithmic Dragon! You contributed ${userScore} pts with ${correctCount}/${gameQuestions.length} correct answers.`
                              : `The Dragon escaped with ${bossHp} HP remaining. You earned ${userScore} points.`}
                          </p>
                        </>
                      );
                    }

                    if (chMode === 'SURVIVAL') {
                      return (
                        <>
                          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: !isEliminated ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: !isEliminated ? '#f59e0b' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                            <Trophy size={32} />
                          </div>
                          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                            {!isEliminated ? '👑 Survival Champion!' : '💀 Eliminated in Sudden-Death'}
                          </h2>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                            {!isEliminated
                              ? `You survived every round of the sudden-death gauntlet! Final Score: ${userScore} pts (${correctCount}/${gameQuestions.length} correct).`
                              : `You were knocked out but spectated through all ${gameQuestions.length} questions. You earned ${userScore} pts before falling.`}
                          </p>
                        </>
                      );
                    }

                    if (chMode === 'TEAMS') {
                      const userTeamWon = (myTeam === 'ALPHA' && teamAlphaScore > teamBetaScore) || (myTeam === 'BETA' && teamBetaScore > teamAlphaScore);
                      const isTie = teamAlphaScore === teamBetaScore;
                      return (
                        <>
                          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                            <Trophy size={32} />
                          </div>
                          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                            {isTie ? '⚔️ Squad Match Tie!' : userTeamWon ? '🏆 Your Squad Won!' : '⚔️ Squad Match Concluded'}
                          </h2>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                            🔵 Team Alpha: <strong>{teamAlphaScore} pts</strong> vs 🔴 Team Beta: <strong>{teamBetaScore} pts</strong>. You earned <strong>{userScore} pts</strong> for {myTeam === 'ALPHA' ? 'Team Alpha' : 'Team Beta'}.
                          </p>
                        </>
                      );
                    }

                    return (
                      <>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                          <Trophy size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                          Sprint Completed! 🎉
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                          You earned <strong>{userScore} points</strong> with <strong>{correctCount} / {gameQuestions.length} correct</strong>.
                        </p>
                      </>
                    );
                  })()}
                </div>

                {!showPostSprintReview ? (
                  /* Final Leaderboard / Podium */
                  <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Final Standings
                    </div>
                    {currentLeaderboard.map((entry, rIdx) => {
                      const isMe = entry.userId === currentUserId;
                      return (
                        <div
                          key={rIdx}
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: '8px',
                            background: isMe ? 'rgba(255, 255, 255, 0.1)' : 'var(--bg-surface)',
                            border: isMe ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-light)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.15rem' }}>
                              {rIdx === 0 ? '🥇' : rIdx === 1 ? '🥈' : rIdx === 2 ? '🥉' : `#${rIdx + 1}`}
                            </span>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                                {entry.userName} {isMe && '(You)'}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                Avg Speed: {entry.avgSpeedSeconds}s / question
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#f59e0b' }}>
                              {entry.score} pts
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {entry.correctCount} correct
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Post-Sprint Review (Priority 1 in Hardening Checklist) */
                  <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Post-Sprint Question Review ({questionAnswersRecord.length} Questions)
                    </div>
                    {questionAnswersRecord.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '1rem',
                          borderRadius: '8px',
                          background: 'var(--bg-surface)',
                          border: `1px solid ${item.isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Q{idx + 1}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: item.isCorrect ? '#10b981' : '#ef4444' }}>
                            {item.isCorrect ? 'CORRECT (+Points)' : item.isTimeout ? 'TIMED OUT' : 'WRONG'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                          {item.question.scenario}
                        </p>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <strong>Correct Answer:</strong> {item.question.options ? item.question.options[getSingleCorrectAnswerIndex(item.question)] : 'Answer key'}
                        </div>
                        {item.question.explanation && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                            {item.question.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowPostSprintReview(prev => !prev)}
                  className="btn btn-secondary"
                  style={{ padding: '0.7rem 1.4rem' }}
                >
                  {showPostSprintReview ? 'Show Standings' : 'Review Missed Questions'}
                </button>

                {showPostSprintReview && (
                  <button
                    onClick={handleSaveMissedToVault}
                    disabled={savingVault}
                    className="btn btn-secondary"
                    style={{ padding: '0.7rem 1.4rem' }}
                  >
                    {savingVault ? 'Saving to Vault...' : 'Save Missed to Vault'}
                  </button>
                )}

                <button
                  onClick={handleShareVictoryCard}
                  className="btn btn-secondary"
                  style={{ padding: '0.7rem 1.4rem' }}
                >
                  {copiedVictoryCard ? 'Copied Victory Card!' : 'Share Victory Card'}
                </button>

                <button
                  onClick={() => handleDownloadResultImage(room?.activeChallenge)}
                  className="btn btn-secondary"
                  style={{ padding: '0.7rem 1.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={15} /> Save as Image
                </button>

                <button
                  onClick={handleBackToMainRoom}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 2.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <ArrowLeft size={16} /> Return to Main Room
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Draggable Divider Splitter */}
        {!isChatCollapsed && !isMobile && (
          <div
            onMouseDown={handleSplitterMouseDown}
            style={{
              width: '8px',
              cursor: 'col-resize',
              background: isDraggingSplitter ? 'var(--brand-primary)' : 'transparent',
              borderRadius: '4px',
              margin: '0 1px',
              transition: 'background 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              userSelect: 'none'
            }}
            title="Drag left/right to resize room chat"
          >
            <div style={{ width: '3px', height: '36px', background: 'var(--border-light)', borderRadius: '2px' }} />
          </div>
        )}

        {/* ─── RIGHT STAGE: LIVE LEADERBOARD (UPPER) + CHAT (LOWER) (IMAGE 1 SPEC) ─── */}
        <div style={{
          display: isMobile && activeTab !== 'chat' ? 'none' : 'flex',
          width: isMobile ? '100%' : (isChatCollapsed ? '46px' : `${Math.max(chatWidth, 340)}px`),
          minWidth: isMobile ? '100%' : (isChatCollapsed ? '46px' : '280px'),
          maxWidth: isMobile ? '100%' : (isChatCollapsed ? '46px' : '580px'),
          flex: isMobile ? '1 1 100%' : 'none',
          height: '100%',
          minHeight: 0,
          flexDirection: 'column',
          gap: (stageState === 'live_question' && !isChatCollapsed) ? '0.75rem' : '0',
          transition: isDraggingSplitter ? 'none' : 'width 0.2s ease'
        }}>
          {isChatCollapsed ? (
            /* Collapsed Thin Strip during live 30s timer */
            <div
              onClick={() => setChatCollapsedManually(true)}
              style={{
                height: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '0.5rem 0',
                gap: '8px'
              }}
              title="Click to expand chat"
            >
              <MessageSquare size={16} style={{ color: 'var(--text-muted)' }} />
              <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                CHAT ({messages.length})
              </span>
            </div>
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════════
                  UPPER RIGHT: LIVE LEADERBOARD (IMAGE 1 SPEC)
                 ═══════════════════════════════════════════════════════ */}
              {stageState === 'live_question' && (
                <div className="card glass-panel" style={{
                  flex: '0 0 auto',
                  maxHeight: '48%',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '0.85rem 1rem',
                  borderRadius: '14px',
                  background: 'rgba(15, 17, 23, 0.95)',
                  border: '1px solid var(--border-light)',
                  boxSizing: 'border-box'
                }}>
                  {/* Top Row: Warnings + Exit Sprint */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: proctorWarnings > 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.55)'
                    }}>
                      Warnings {proctorWarnings}/3
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelChallenge}
                      style={{
                        padding: '3px 12px',
                        borderRadius: '16px',
                        background: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.45)',
                        color: '#ef4444',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                        e.currentTarget.style.borderColor = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.45)';
                      }}
                    >
                      Exit sprint
                    </button>
                  </div>

                  {/* Center Stats: Points + Circular Timer Gauge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1.75rem',
                    padding: '0.3rem 0',
                    marginBottom: '0.35rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    {/* Points */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>
                        {userScore}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 700, marginTop: '2px' }}>
                        points
                      </div>
                    </div>

                    {/* Circular Timer Gauge */}
                    <div style={{ position: 'relative', width: '44px', height: '44px' }}>
                      <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          stroke="rgba(255, 255, 255, 0.08)"
                          strokeWidth="3.5"
                          fill="transparent"
                        />
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          stroke={qTimeLeft <= 5 ? '#ef4444' : '#10b981'}
                          strokeWidth="3.5"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 18}
                          strokeDashoffset={2 * Math.PI * 18 * (1 - (qTimeLeft / (room?.activeChallenge?.perQuestionSeconds || 30)))}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
                        />
                      </svg>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'monospace',
                        fontSize: '1rem',
                        fontWeight: 900,
                        color: qTimeLeft <= 5 ? '#ef4444' : '#ffffff'
                      }}>
                        {qTimeLeft}
                      </div>
                    </div>
                  </div>

                  {/* Ranked Participant Cards (Leaderboard Slots matching Image 1) */}
                  {(() => {
                    let board = [...currentLeaderboard];
                    const myEntryIdx = board.findIndex(e => e.userId === currentUserId);
                    if (myEntryIdx >= 0) {
                      board[myEntryIdx] = {
                        ...board[myEntryIdx],
                        score: Math.max(board[myEntryIdx].score || 0, userScore),
                        questionsAnswered: currentQIdx + 1
                      };
                    } else {
                      board.push({
                        userId: currentUserId,
                        userName: currentUserName || 'You',
                        score: userScore,
                        questionsAnswered: currentQIdx + 1
                      });
                    }

                    participantsList.forEach(p => {
                      if (!board.some(e => e.userId === p.userId)) {
                        board.push({
                          userId: p.userId,
                          userName: p.userName || 'Peer',
                          score: 0,
                          questionsAnswered: 0
                        });
                      }
                    });

                    board.sort((a, b) => (b.score || 0) - (a.score || 0));

                    return (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                        flex: 1,
                        minHeight: 0,
                        overflowY: 'auto',
                        paddingRight: '2px'
                      }}>
                        {board.map((entry, rIdx) => {
                          const isMe = entry.userId === currentUserId;
                          return (
                            <div
                              key={entry.userId || rIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.4rem 0.65rem',
                                borderRadius: '8px',
                                background: isMe ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.035)',
                                border: isMe ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-light)',
                                boxSizing: 'border-box'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, width: '18px', flexShrink: 0, textAlign: 'center' }}>
                                  {rIdx === 0 ? '🥇' : rIdx === 1 ? '🥈' : rIdx === 2 ? '🥉' : `#${rIdx + 1}`}
                                </span>
                                <div style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  background: isMe ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)',
                                  color: isMe ? '#000000' : '#ffffff',
                                  fontSize: '0.68rem',
                                  fontWeight: 900,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {(entry.userName || '?')[0].toUpperCase()}
                                </div>
                                <span style={{
                                  fontSize: '0.78rem',
                                  fontWeight: isMe ? 800 : 600,
                                  color: isMe ? '#ffffff' : 'var(--text-secondary)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {entry.userName} {isMe && '(You)'}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#f59e0b', flexShrink: 0 }}>
                                {entry.score || 0} pts
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Bottom Action in Leaderboard: Next question / Finish Sprint */}
                  <button
                    type="button"
                    onClick={() => handleAdvanceQuestion(false)}
                    disabled={selectedOption === null && !isEliminated}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      borderRadius: '8px',
                      marginTop: '0.45rem',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-light)',
                      opacity: (selectedOption === null && !isEliminated) ? 0.4 : 1,
                      cursor: (selectedOption === null && !isEliminated) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {currentQIdx >= gameQuestions.length - 1 ? 'Finish Sprint' : 'Next question →'}
                  </button>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════
                  LOWER RIGHT: FULL CHAT / PEOPLE RAIL (IMAGE 1 SPEC)
                 ═══════════════════════════════════════════════════════ */}
              <div className="card" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: stageState === 'live_question' ? 'auto' : '100%',
                minHeight: 0,
                padding: stageState === 'live_question' ? '0.85rem 1rem' : '1.1rem 1.25rem',
                boxSizing: 'border-box'
              }}>
              {/* Top Segment Switcher: [Chat] | [People ({participantsList.length})] */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)', marginBottom: '0.95rem' }}>
                <div style={{ display: 'flex', gap: '3px', background: 'rgba(255, 255, 255, 0.04)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <button
                    type="button"
                    onClick={() => setRightRailTab('chat')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: rightRailTab === 'chat' ? 800 : 600,
                      background: rightRailTab === 'chat' ? 'var(--brand-primary)' : 'transparent',
                      color: rightRailTab === 'chat' ? 'var(--brand-inverse)' : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <MessageSquare size={13} />
                    <span>Chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightRailTab('people')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: rightRailTab === 'people' ? 800 : 600,
                      background: rightRailTab === 'people' ? 'var(--brand-primary)' : 'transparent',
                      color: rightRailTab === 'people' ? 'var(--brand-inverse)' : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Users size={13} />
                    <span>People ({participantsList.length})</span>
                  </button>
                </div>

                {stageState === 'live_question' && (
                  <button
                    onClick={() => setChatCollapsedManually(true)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                    title="Collapse rail for focus"
                  >
                    <span>Collapse</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

              {/* ─── TAB CONTENT 1: CHAT ─── */}
              {rightRailTab === 'chat' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  {/* Messages Feed */}
                  <div
                    ref={chatBottomRef}
                    style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingRight: '4px' }}
                  >
                    {messages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '3rem' }}>
                        No messages yet. Say hi to your peers or launch a challenge! 👋
                      </div>
                    ) : (
                      messages.map((msg, i) => {
                        if (msg.type === 'SYSTEM') {
                          return (
                            <div key={i} style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', padding: '4px 8px', fontStyle: 'italic', lineHeight: 1.4 }}>
                              {msg.content}
                            </div>
                          );
                        }

                        if (msg.type === 'CHALLENGE_INVITE') {
                          const chId = msg.metadata?.challengeId;
                          const isThisChallenge = !chId || room?.activeChallenge?.id === chId;
                          const chStatus = room?.activeChallenge?.status;
                          const isChallengeActiveNow = isChallengeActive || stageState === 'live_question' || stageState === 'checkpoint';
                          const isStarted = isThisChallenge && (chStatus === 'IN_PROGRESS' || isChallengeActiveNow);
                          const isLobby = isThisChallenge && !isStarted && (chStatus === 'INVITING' || stageState === 'invite_open');
                          const isStillActive = (isLobby || isStarted) && chStatus !== 'COMPLETED' && chStatus !== 'CANCELLED';

                          const pastCh = (room?.pastChallenges || []).find(c => c.id === chId || (msg.content && msg.content.includes(c.title)));
                          const wasCancelled = pastCh?.status === 'CANCELLED' || (msg.content && msg.content.toLowerCase().includes('cancel')) || messages.some(m => m.type === 'SYSTEM' && m.content && m.content.toLowerCase().includes('cancelled') && (pastCh ? m.content.includes(pastCh.title) : true));

                          return (
                            <div
                              key={i}
                              style={{
                                background: isStillActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                border: `1px solid ${isStillActive ? 'var(--brand-primary)' : 'var(--border-light)'}`,
                                borderRadius: '10px',
                                padding: '0.75rem 0.9rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                opacity: isStillActive ? 1 : 0.7
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Swords size={15} />
                                  <span>OA Blitz Challenge Ready</span>
                                </div>
                                {isStarted ? (
                                  <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 800, background: 'rgba(239, 68, 68, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                                    In Progress
                                  </span>
                                ) : !isStillActive ? (
                                  wasCancelled ? (
                                    <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 800, background: 'rgba(239, 68, 68, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                                      Cancelled
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Concluded</span>
                                  )
                                ) : null}
                              </div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                                {msg.content}
                              </div>
                              {isStarted ? (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '6px',
                                  padding: '6px 10px',
                                  color: '#f87171',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  marginTop: '4px'
                                }}>
                                  <Lock size={13} />
                                  <span>Sprint in progress • Lobby closed</span>
                                </div>
                              ) : isLobby ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                  {lobbyCountdown !== null && lobbyCountdown > 0 && (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      background: 'rgba(245, 158, 11, 0.15)',
                                      border: '1px solid rgba(245, 158, 11, 0.35)',
                                      borderRadius: '6px',
                                      padding: '4px 8px',
                                      color: '#f59e0b',
                                      fontSize: '0.74rem',
                                      fontWeight: 800
                                    }}>
                                      <Clock size={12} />
                                      <span>Auto-starts in {lobbyCountdown}s...</span>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => {
                                      if (typeof document !== 'undefined' && document.documentElement?.requestFullscreen && !document.fullscreenElement) {
                                        document.documentElement.requestFullscreen().then(() => setIsFullscreenActive(true)).catch(() => {});
                                      }
                                      handleStartChallenge(room?.activeChallenge);
                                    }}
                                    className="btn btn-primary"
                                    style={{ padding: '0.45rem', fontSize: '0.8rem', fontWeight: 800 }}
                                  >
                                    Join Challenge {lobbyCountdown !== null && lobbyCountdown > 0 ? `(${lobbyCountdown}s)` : ''}
                                  </button>
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.74rem', color: wasCancelled ? '#f87171' : 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                                  {wasCancelled ? 'Sprint Cancelled ✖' : 'Sprint Concluded 🏁'}
                                </div>
                              )}
                            </div>
                          );
                        }

                        const isMe = msg.userId === currentUserId;
                        const isMsgHost = msg.userId === room.hostUserId;

                        return (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: isMe ? 'flex-end' : 'flex-start',
                            }}
                          >
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              {isMe ? 'You' : msg.userName}
                              {isMsgHost && <Crown size={11} style={{ color: '#f59e0b' }} />}
                            </span>
                            <div
                              style={{
                                background: isMe ? 'var(--brand-primary)' : 'var(--bg-surface)',
                                color: isMe ? 'var(--brand-inverse)' : 'var(--text-primary)',
                                padding: '0.55rem 0.85rem',
                                borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                fontSize: '0.85rem',
                                lineHeight: 1.4,
                                maxWidth: '85%',
                                wordBreak: 'break-word',
                                border: isMe ? 'none' : '1px solid var(--border-light)'
                              }}
                            >
                              {msg.content}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Quick Reactions Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 0', borderTop: '1px solid var(--border-light)', marginTop: '0.5rem' }}>
                    {['👏', '🔥', '💡', '🎉', '☕', '💪'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setChatInput(prev => prev ? `${prev} ${emoji}` : emoji);
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        title={`Add ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Message room..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.55rem 0.85rem',
                        fontSize: '0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-light)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || sendingMsg}
                      className="btn btn-primary"
                      style={{ padding: '0.55rem 0.85rem' }}
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              )}

              {/* ─── TAB CONTENT 2: PEOPLE (PEERS & SESSION GOALS) ─── */}
              {rightRailTab === 'people' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', minHeight: 0, paddingRight: '2px' }}>
                  {/* Current User Goal Banner */}
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Your Session Goal
                      </span>
                      <button
                        onClick={() => {
                          setGoalInput(myGoal);
                          setShowGoalModal(true);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--brand-primary)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        {myGoal ? 'Edit' : '+ Set Goal'}
                      </button>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: myGoal ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: myGoal ? 'normal' : 'italic' }}>
                      {myGoal ? `🎯 "${myGoal}"` : 'No goal set yet. Set a goal so your peers know what you are studying!'}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Peers in Room ({participantsList.length})
                  </div>

                  {/* List of Connected Peers */}
                  {participantsList.map((p, idx) => {
                    const isMe = p.userId === currentUserId;
                    const isPeerHost = p.userId === room.hostUserId;
                    
                    // Derive dynamic live status
                    let statusLabel = '🟢 Online';
                    let statusColor = '#10b981';
                    if (stageState === 'live_question' || stageState === 'checkpoint') {
                      statusLabel = '⚔️ In Arena';
                      statusColor = '#ef4444';
                    } else if (pomodoroRunning && pomodoroPhase === 'WORK') {
                      statusLabel = '🎯 Focusing';
                      statusColor = '#3b82f6';
                    } else if (pomodoroRunning && pomodoroPhase === 'BREAK') {
                      statusLabel = '☕ Break';
                      statusColor = '#10b981';
                    }

                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '0.75rem',
                          borderRadius: '8px',
                          background: isMe ? 'rgba(255, 255, 255, 0.07)' : 'var(--bg-surface)',
                          border: isMe ? '1px solid var(--border-strong)' : '1px solid var(--border-light)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: isMe ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.12)',
                              color: isMe ? 'var(--brand-inverse)' : 'var(--text-primary)',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {p.userName ? p.userName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>{p.userName}</span>
                                {isMe && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>(You)</span>}
                                {isPeerHost && <Crown size={12} style={{ color: '#f59e0b' }} />}
                              </div>
                            </div>
                          </div>

                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: statusColor
                          }}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* Peer Session Goal */}
                        <div style={{
                          fontSize: '0.76rem',
                          color: p.goal ? 'var(--text-secondary)' : 'var(--text-muted)',
                          fontStyle: p.goal ? 'italic' : 'normal',
                          background: 'rgba(0, 0, 0, 0.15)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          lineHeight: 1.3
                        }}>
                          {p.goal ? `🎯 "${p.goal}"` : 'No goal set'}
                        </div>

                        {/* Host Moderation for other peers */}
                        {isHost && !isMe && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
                            <button
                              onClick={() => handleTransferHost(p.userId)}
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--border-light)',
                                color: 'var(--text-secondary)',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                fontSize: '0.68rem',
                                cursor: 'pointer'
                              }}
                              title="Make room host"
                            >
                              Make Host
                            </button>
                            <button
                              onClick={() => handleKickUser(p.userId)}
                              style={{
                                background: 'transparent',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#ef4444',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                fontSize: '0.68rem',
                                cursor: 'pointer'
                              }}
                              title="Remove peer from room"
                            >
                              Kick
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            </>
          )}
        </div>
      </div>

      {/* ─── MODAL: PEER PRESENCE SHEET (OPENED VIA HEADER BADGE) ─── */}
      {showPeersModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowPeersModal(false); }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '420px', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  Active Peers ({participantsList.length} Online)
                </h3>
              </div>
              <button onClick={() => setShowPeersModal(false)} className="icon-btn" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {participantsList.map((p, idx) => {
                const isMe = p.userId === currentUserId;
                const isPeerHost = p.userId === room.hostUserId;

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: isMe ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-surface)',
                      border: isMe ? '1px solid var(--border-strong)' : '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isMe ? 'var(--text-primary)' : 'rgba(255, 255, 255, 0.15)',
                        color: isMe ? 'var(--bg-primary)' : 'var(--text-primary)',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {p.userName ? p.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{p.userName}</span>
                          {isMe && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(You)</span>}
                        </div>
                        {p.goal ? (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
                            🎯 &ldquo;{p.goal}&rdquo;
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                            Connected
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isPeerHost && (
                        <span title="Room Host" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', marginRight: '4px' }}>
                          <Crown size={16} />
                        </span>
                      )}

                      {isMe && (
                        <button
                          onClick={() => {
                            setGoalInput(myGoal);
                            setShowPeersModal(false);
                            setShowGoalModal(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                        >
                          Edit Goal
                        </button>
                      )}

                      {isHost && !isMe && (
                        <>
                          <button
                            onClick={() => handleTransferHost(p.userId)}
                            className="btn btn-secondary"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                            title="Make room host"
                          >
                            Make Host
                          </button>
                          <button
                            onClick={() => handleKickUser(p.userId)}
                            style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer' }}
                            title="Remove from room"
                          >
                            Kick
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CONFIGURE NEW ARENA CHALLENGE (EXACT DESIGN MATCH) ─── */}
      {showCreateChallengeModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateChallengeModal(false); }}
        >
          <div
            style={{
              width: '96%',
              maxWidth: '940px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '1.85rem 2.25rem',
              borderRadius: '20px',
              animation: 'fadeIn 0.2s ease-out',
              boxSizing: 'border-box',
              background: '#0d1117',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.85)',
              color: '#ffffff'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                {/* Amber lightning badge */}
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Zap size={22} fill="#f59e0b" style={{ color: '#f59e0b' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#9ca3af',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase'
                  }}>
                    NEW ARENA CHALLENGE
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '2px', maxWidth: '100%' }}>
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="IoT week 1 Sprint"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: '1.55rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        padding: 0,
                        margin: 0,
                        width: `${Math.max(10, (customTitle || 'IoT week 1 Sprint').length + 1)}ch`,
                        maxWidth: 'calc(100% - 40px)',
                        letterSpacing: '-0.02em'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => titleInputRef.current?.focus()}
                      title="Edit sprint name"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f59e0b',
                        transition: 'all 0.15s ease',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'; e.currentTarget.style.borderColor = '#d97706'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
                    >
                      <Pencil size={17} />
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateChallengeModal(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* 2-Column Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1.18fr 1fr',
                gap: '2rem',
                alignItems: 'start'
              }}>

                {/* ─── LEFT COLUMN: ARENA MODES + PACE ─── */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  
                  {/* ARENA Header */}
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
                    ARENA
                  </div>

                  {/* 2x2 Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {[
                      { id: 'STANDARD', label: 'OA Blitz', desc: 'Free-for-all. Speed and accuracy set the ranking.', badge: 'Solo OK', badgeColor: '#f59e0b', icon: Zap },
                      { id: 'BOSS', label: 'Co-op Boss', desc: "Everyone's correct answers drain one boss HP bar.", badge: 'Needs 2+ peers', badgeColor: '#9ca3af', icon: Users },
                      { id: 'SURVIVAL', label: 'Survival', desc: "One wrong answer and you're out. Last one standing wins.", badge: 'Needs 2+ peers', badgeColor: '#9ca3af', icon: Shield },
                      { id: 'TEAMS', label: 'Squad Battle', desc: 'Two teams, combined score. Teams are auto-balanced.', badge: 'Needs 4+ peers', badgeColor: '#9ca3af', icon: Flag }
                    ].map(m => {
                      const ModeIcon = m.icon;
                      const isSelected = gameMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setGameMode(m.id)}
                          style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            textAlign: 'left',
                            border: isSelected ? '1.5px solid #d97706' : '1px solid rgba(255, 255, 255, 0.07)',
                            background: isSelected ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                            boxShadow: isSelected ? '0 0 16px -4px rgba(245, 158, 11, 0.25)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: '112px',
                            transition: 'all 0.15s ease',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isSelected ? '#f59e0b' : '#9ca3af'
                            }}>
                              <ModeIcon size={17} />
                            </div>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: m.badgeColor,
                              background: isSelected && m.badgeColor === '#f59e0b' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              {m.badge}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', marginBottom: '3px' }}>
                              {m.label}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#9ca3af', lineHeight: 1.35 }}>
                              {m.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Negative Marking Toggle Card */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.15rem',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    marginTop: '10px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                        Negative marking
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#9ca3af', marginTop: '2px' }}>
                        Deduct 25 points for each wrong answer
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={negativeMarking}
                      onClick={() => setNegativeMarking(!negativeMarking)}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        background: negativeMarking ? '#d97706' : 'rgba(255, 255, 255, 0.15)',
                        border: 'none',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        padding: '2px',
                        flexShrink: 0
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        transform: negativeMarking ? 'translateX(20px)' : 'translateX(0px)',
                        transition: 'transform 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      }} />
                    </button>
                  </div>

                  {/* PACE Section */}
                  <div style={{ marginTop: '1.4rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      PACE
                    </div>

                    {/* Questions */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>
                        Questions
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                        {[5, 10, 15, 20].map(cnt => {
                          const isSel = !isCustomQCount && challengeQCount === cnt;
                          return (
                            <button
                              key={cnt}
                              type="button"
                              onClick={() => {
                                setIsCustomQCount(false);
                                setChallengeQCount(cnt);
                              }}
                              style={{
                                padding: '0.55rem 0',
                                borderRadius: '8px',
                                fontSize: '0.86rem',
                                fontWeight: 700,
                                border: isSel ? '1.5px solid #d97706' : '1px solid rgba(255, 255, 255, 0.08)',
                                background: isSel ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                color: isSel ? '#f59e0b' : '#d1d5db',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {cnt}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setIsCustomQCount(true)}
                          style={{
                            padding: '0.55rem 0',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            border: isCustomQCount ? '1.5px solid #d97706' : '1px solid rgba(255, 255, 255, 0.08)',
                            background: isCustomQCount ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                            color: isCustomQCount ? '#f59e0b' : '#d1d5db',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Custom
                        </button>
                      </div>
                      {isCustomQCount && (
                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={customQCountInput}
                            onChange={(e) => setCustomQCountInput(e.target.value)}
                            placeholder="10"
                            style={{
                              width: '80px',
                              padding: '0.4rem 0.6rem',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid #d97706',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontSize: '0.85rem',
                              fontWeight: 700
                            }}
                          />
                          <span style={{ fontSize: '0.76rem', color: '#9ca3af' }}>questions total</span>
                        </div>
                      )}
                    </div>

                    {/* Row with Time per question & Start */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>
                          Time per question
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                          {[30, 45, 60].map(sec => {
                            const isSel = !isCustomPacing && challengePacing === sec;
                            return (
                              <button
                                key={sec}
                                type="button"
                                onClick={() => {
                                  setIsCustomPacing(false);
                                  setChallengePacing(sec);
                                }}
                                style={{
                                  padding: '0.55rem 0',
                                  borderRadius: '8px',
                                  fontSize: '0.84rem',
                                  fontWeight: 700,
                                  border: isSel ? '1.5px solid #d97706' : '1px solid rgba(255, 255, 255, 0.08)',
                                  background: isSel ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                  color: isSel ? '#f59e0b' : '#d1d5db',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {sec}s
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => setIsCustomPacing(true)}
                            style={{
                              padding: '0.55rem 0',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              border: isCustomPacing ? '1.5px solid #d97706' : '1px solid rgba(255, 255, 255, 0.08)',
                              background: isCustomPacing ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                              color: isCustomPacing ? '#f59e0b' : '#d1d5db',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Custom
                          </button>
                        </div>
                        {isCustomPacing && (
                          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="number"
                              min="5"
                              max="300"
                              value={customPacingInput}
                              onChange={(e) => setCustomPacingInput(e.target.value)}
                              placeholder="30"
                              style={{
                                width: '80px',
                                padding: '0.4rem 0.6rem',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid #d97706',
                                borderRadius: '6px',
                                color: '#ffffff',
                                fontSize: '0.85rem',
                                fontWeight: 700
                              }}
                            />
                            <span style={{ fontSize: '0.76rem', color: '#9ca3af' }}>seconds / Q</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>
                          Start
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                          {[
                            { id: 'instant', label: 'Start now' },
                            { id: 'lobby', label: '30s lobby' }
                          ].map(sm => {
                            const isSel = challengeStartMode === sm.id;
                            return (
                              <button
                                key={sm.id}
                                type="button"
                                onClick={() => setChallengeStartMode(sm.id)}
                                style={{
                                  padding: '0.55rem 0',
                                  borderRadius: '8px',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  border: isSel ? '1.5px solid #d97706' : '1px solid rgba(255, 255, 255, 0.08)',
                                  background: isSel ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                  color: isSel ? '#f59e0b' : '#d1d5db',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {sm.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── RIGHT COLUMN: QUESTION SOURCE + VAULT DOCS + UPLOAD ─── */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  
                  {/* QUESTION SOURCE Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      QUESTION SOURCE
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = exams.map(e => e.id || e._id);
                          setSelectedExamIds(allIds);
                          if (allIds.length === 1) {
                            setCustomTitle(`${exams[0]?.title || 'Vault'} Sprint`);
                          } else if (allIds.length > 1) {
                            setCustomTitle(`Multi-Vault Sprint (${allIds.length} Docs)`);
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedExamIds([])}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Search Box */}
                  <input
                    type="text"
                    placeholder="Search vault documents"
                    value={examSearchQuery}
                    onChange={(e) => setExamSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.95rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box',
                      marginBottom: '10px',
                      outline: 'none'
                    }}
                  />

                  {/* Document List */}
                  <div style={{
                    maxHeight: '230px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingRight: '2px'
                  }}>
                    {exams.length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.82rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
                        No vault documents found. Click below to upload one.
                      </div>
                    ) : (
                      exams
                        .filter(ex => !examSearchQuery.trim() || (ex.title || '').toLowerCase().includes(examSearchQuery.toLowerCase()))
                        .map(ex => {
                          const examId = ex.id || ex._id;
                          const isSelected = selectedExamIds.includes(examId);
                          return (
                            <div
                              key={examId}
                              onClick={() => {
                                setSelectedExamIds(prev => {
                                  const exists = prev.includes(examId);
                                  const next = exists ? prev.filter(x => x !== examId) : [...prev, examId];
                                  if (next.length === 1) {
                                    const single = exams.find(e => (e.id || e._id) === next[0]);
                                    if (single) setCustomTitle(single.title + ' Sprint');
                                  } else if (next.length > 1) {
                                    setCustomTitle(`Multi-Vault Sprint (${next.length} Docs)`);
                                  }
                                  return next;
                                });
                              }}
                              style={{
                                padding: '0.85rem 1rem',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: isSelected ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                                border: isSelected ? '1.5px solid #d97706' : '1px solid rgba(255, 255, 255, 0.06)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                {/* Amber Checkbox */}
                                <div style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '5px',
                                  background: isSelected ? '#d97706' : 'transparent',
                                  border: isSelected ? 'none' : '1.5px solid rgba(255, 255, 255, 0.25)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {isSelected && <Check size={13} style={{ color: '#000000', strokeWidth: 3 }} />}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    color: '#ffffff',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {ex.title}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '2px' }}>
                                    In vault
                                  </div>
                                </div>
                              </div>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', flexShrink: 0, marginLeft: '12px' }}>
                                {ex.totalQuestions || '10'} Qs
                              </span>
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* Document Action Buttons: Upload Document + Parse Document */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.pdf,.docx,.txt,.csv"
                      onChange={handleUploadDocumentChange}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      disabled={isUploadingDoc}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '0.75rem 0.85rem',
                        borderRadius: '12px',
                        border: '1px dashed rgba(255, 255, 255, 0.15)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        color: '#d1d5db',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: isUploadingDoc ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d97706'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.color = '#d1d5db'; }}
                    >
                      {isUploadingDoc ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={15} />
                          <span>Upload document</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={pasteProcessing}
                      onClick={() => setShowPasteModal(true)}
                      style={{
                        padding: '0.75rem 0.85rem',
                        borderRadius: '12px',
                        border: '1px dashed rgba(255, 255, 255, 0.15)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        color: '#d1d5db',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: pasteProcessing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d97706'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.color = '#d1d5db'; }}
                    >
                      {pasteProcessing ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Parsing...</span>
                        </>
                      ) : (
                        <>
                          <ClipboardPaste size={15} />
                          <span>Parse document</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Summary line */}
                  {(() => {
                    const selectedDocs = exams.filter(ex => selectedExamIds.includes(ex.id || ex._id));
                    const pooledCount = selectedDocs.reduce((acc, cur) => acc + (cur.totalQuestions || 10), 0);
                    return (
                      <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#9ca3af', fontWeight: 500 }}>
                        {selectedExamIds.length} selected · ~{pooledCount} questions pooled
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* ─── BOTTOM ROW: SUMMARY LINE & ACTION BUTTONS ─── */}
              {(() => {
                const effectiveQ = isCustomQCount ? (parseInt(customQCountInput, 10) || 10) : challengeQCount;
                const effectiveP = isCustomPacing ? (parseInt(customPacingInput, 10) || 30) : challengePacing;
                const estMin = Math.ceil((effectiveQ * effectiveP) / 60);
                const modeLabel = gameMode === 'STANDARD' ? 'OA Blitz' : gameMode === 'BOSS' ? 'Co-op Boss' : gameMode === 'SURVIVAL' ? 'Survival' : 'Squad Battle';
                const penaltyText = (gameMode === 'SURVIVAL' || gameMode === 'BOSS') ? 'No penalty' : negativeMarking ? '-25 penalty' : 'No penalty';
                const startText = challengeStartMode === 'instant' ? 'Starts now' : '30s lobby';
                const onlineCount = (room?.participants?.length || 1);

                return (
                  <div style={{
                    marginTop: '1.75rem',
                    padding: '0.9rem 1.4rem',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        fontSize: '2.1rem',
                        fontWeight: 900,
                        color: '#ffffff',
                        lineHeight: 1,
                        letterSpacing: '-0.03em'
                      }}>
                        {estMin} min
                      </div>
                      <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '14px' }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#d1d5db' }}>
                          {effectiveQ} questions, {effectiveP}s each
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#9ca3af', marginTop: '2px' }}>
                          {modeLabel} · {penaltyText} · {startText} · {onlineCount} online
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setShowCreateChallengeModal(false)}
                        style={{
                          padding: '0.65rem 1.35rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: '#d1d5db',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={creatingChallenge || (selectedExamIds.length === 0 && !selectedExamId)}
                        style={{
                          padding: '0.65rem 1.5rem',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#ffffff',
                          color: '#000000',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: (creatingChallenge || (selectedExamIds.length === 0 && !selectedExamId)) ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 14px rgba(255, 255, 255, 0.2)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Send size={16} style={{ color: '#000000' }} />
                        <span>{creatingChallenge ? 'Broadcasting...' : 'Broadcast challenge'}</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DOCUMENT NAME PROMPT FOR UPLOAD & PARSE ─── */}
      {pendingUpload && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { setPendingUpload(null); setUploadName(''); } }}
        >
          <div
            style={{
              width: '92%',
              maxWidth: '440px',
              padding: '1.75rem',
              borderRadius: '16px',
              background: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Name this Document</h3>
                <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '2px 0 0 0' }}>Give this uploaded document a title for your arena pool</p>
              </div>
            </div>

            <input
              type="text"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && uploadName.trim()) confirmDocumentUpload(); }}
              placeholder="e.g. IoT Week 1, Operating Systems"
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: 600,
                boxSizing: 'border-box',
                margin: '1rem 0 1.25rem 0',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { setPendingUpload(null); setUploadName(''); }}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#d1d5db',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDocumentUpload}
                disabled={!uploadName.trim()}
                style={{
                  padding: '0.6rem 1.4rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ffffff',
                  color: '#000000',
                  fontWeight: 800,
                  cursor: !uploadName.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                Upload & Parse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PASTE & PARSE QUESTIONS (SAME AS FOCUS TEST) ─── */}
      {showPasteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !pasteProcessing) {
              setShowPasteModal(false);
            }
          }}
        >
          <div
            style={{
              width: '92%',
              maxWidth: '640px',
              padding: '1.75rem',
              borderRadius: '16px',
              background: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardPaste size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Parse Document / Paste Questions</h3>
                  <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '2px 0 0 0' }}>Paste questions or raw JSON. Single-choice MCQs will be extracted and saved to your vault.</p>
                </div>
              </div>
              <button
                type="button"
                disabled={pasteProcessing}
                onClick={() => setShowPasteModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: pasteProcessing ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d1d5db', marginBottom: '6px', display: 'block' }}>
              Document / Test Name
            </label>
            <input
              type="text"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="e.g. Java Collections, Computer Networks, IoT Week 1..."
              disabled={pasteProcessing}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 600,
                outline: 'none',
                marginBottom: '1rem',
                boxSizing: 'border-box'
              }}
            />

            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d1d5db', marginBottom: '6px', display: 'block' }}>
              Paste Questions or JSON
            </label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              disabled={pasteProcessing}
              placeholder={`Example:\n\n1. What is the capital of France?\n   a) London\n   b) Paris (correct)\n   c) Berlin\n   d) Madrid\n\n2. Which protocol operates at the Transport Layer?\n   a) IP\n   b) TCP (correct)\n   c) HTTP\n   d) Ethernet\n\nOr paste JSON format with scenario, options, and answer.`}
              style={{
                width: '100%',
                minHeight: '230px',
                flex: 1,
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#f3f4f6',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                {pasteText.trim().length > 0 ? `${pasteText.trim().split('\n').length} lines · ~${pasteText.length} chars` : 'No questions pasted'}
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  disabled={pasteProcessing}
                  onClick={() => setShowPasteModal(false)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#d1d5db',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: pasteProcessing ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePasteSubmit}
                  disabled={!pasteText.trim() || pasteProcessing}
                  style={{
                    minWidth: '150px',
                    padding: '0.65rem 1.4rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: (!pasteText.trim() || pasteProcessing) ? 'rgba(245, 158, 11, 0.4)' : '#f59e0b',
                    color: '#000000',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: (!pasteText.trim() || pasteProcessing) ? 'not-allowed' : 'pointer',
                    boxShadow: (!pasteText.trim() || pasteProcessing) ? 'none' : '0 4px 12px rgba(245, 158, 11, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {pasteProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Parsing with AI...</span>
                    </>
                  ) : (
                    <>
                      <ClipboardPaste size={16} />
                      <span>Parse Questions</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: SPRINT RESULT & STANDINGS HISTORY (WITH SAVE AS IMAGE) ─── */}
      {viewingPastChallenge && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setViewingPastChallenge(null); }}
        >
          <div className="glass-panel" style={{ width: '92%', maxWidth: '640px', maxHeight: '88vh', overflowY: 'auto', padding: '1.75rem', borderRadius: '16px', animation: 'fadeIn 0.2s ease-out', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                    {viewingPastChallenge.title}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {viewingPastChallenge.gameMode === 'BOSS' ? 'Co-op Boss' : viewingPastChallenge.gameMode === 'SURVIVAL' ? 'Survival' : viewingPastChallenge.gameMode === 'TEAMS' ? 'Squad' : 'OA Blitz'} · {viewingPastChallenge.questionCount || 10} Questions · {viewingPastChallenge.perQuestionSeconds || 30}s/Q
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingPastChallenge(null)} className="icon-btn" style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mode</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {viewingPastChallenge.gameMode === 'BOSS' ? 'Co-op Boss' : viewingPastChallenge.gameMode === 'SURVIVAL' ? 'Survival' : viewingPastChallenge.gameMode === 'TEAMS' ? 'Squad' : 'OA Blitz'}
                </div>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Questions</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {viewingPastChallenge.questionCount || 10} Qs • {viewingPastChallenge.perQuestionSeconds || 30}s
                </div>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed By</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
                  {(viewingPastChallenge.leaderboard || []).length} Participants
                </div>
              </div>
            </div>

            {/* Standings List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Final Standings & Leaderboard
              </div>
              {(!viewingPastChallenge.leaderboard || viewingPastChallenge.leaderboard.length === 0) ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                  No participants completed this challenge.
                </div>
              ) : (
                viewingPastChallenge.leaderboard.map((player, pIdx) => {
                  const isMe = player.userId === currentUserId;
                  return (
                    <div
                      key={pIdx}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        background: isMe ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-surface)',
                        border: isMe ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.25rem', minWidth: '28px' }}>
                          {pIdx === 0 ? '🥇' : pIdx === 1 ? '🥈' : pIdx === 2 ? '🥉' : `#${pIdx + 1}`}
                        </span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                            {player.userName} {isMe && '(You)'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {player.correctCount != null ? `${player.correctCount}/${viewingPastChallenge.questionCount || 10} correct` : 'Completed'} {player.avgSpeedSeconds ? `• ${player.avgSpeedSeconds}s / Q avg` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#f59e0b' }}>
                          {player.score || 0} pts
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action Buttons: Save as Image + Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => handleDownloadResultImage(viewingPastChallenge)}
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.25rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
              >
                <Download size={15} /> Save as Image
              </button>
              <button
                type="button"
                onClick={() => setViewingPastChallenge(null)}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.4rem', fontWeight: 800 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: MULTIPLAYER ARENA MODES INFO (OPENED VIA ⓘ ICON) ─── */}
      {showGameInfoModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1002, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowGameInfoModal(false); }}>
          <div className="glass-panel" style={{ width: '92%', maxWidth: '520px', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Multiplayer Arena Modes</h3>
              <button onClick={() => setShowGameInfoModal(false)} className="icon-btn" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '65vh', overflowY: 'auto' }}>
              <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={15} style={{ color: 'var(--brand-primary)' }} /> OA Blitz (Standard)
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Simulates standard company OA pressure. Every player sees the same question on a 30s-60s strict countdown. Speed bonuses award up to +100 bonus points for rapid accuracy.
                </div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f87171', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flame size={15} style={{ color: '#f87171' }} /> Co-op Boss Battle
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Collaborate against a legendary monster (e.g. Algorithmic Dragon). Every correct answer dealt by any peer in the room deals direct damage to the boss HP bar.
                </div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f59e0b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={15} style={{ color: '#f59e0b' }} /> Survival Mode
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Sudden-death elimination. Answer incorrectly or run out of time and you are moved to spectator mode. The last remaining survivor takes the crown!
                </div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#60a5fa', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users2 size={15} style={{ color: '#60a5fa' }} /> Squad Battle
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Participants are automatically partitioned into Red and Blue squads. Team aggregate scores compete for podium glory.
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button onClick={() => setShowGameInfoModal(false)} className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: SET SESSION GOAL ─── */}
      {showGoalModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1005, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowGoalModal(false); }}>
          <div className="glass-panel" style={{ width: '92%', maxWidth: '480px', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={20} style={{ color: 'var(--brand-primary)' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Set Session Goal</h2>
              </div>
              <button onClick={() => setShowGoalModal(false)} className="icon-btn" style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  What are you focusing on during this session?
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Solve 3 LeetCode DP problems, finish IoT module 2"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.92rem'
                  }}
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Quick suggestions:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    'Solve 3 LeetCode Mediums',
                    'Complete IoT Week 1 sprint',
                    'Deep dive on System Design',
                    'Review 20 Flashcards',
                    'Debug backend microservices'
                  ].map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setGoalInput(sug)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        border: '1px solid var(--border-light)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.5rem', fontWeight: 800 }}
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}




      {/* ─── MODAL: CLOSE ROOM CONFIRM (HOST ONLY, WITH HEADCOUNT) ─── */}
      {showCloseConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowCloseConfirmModal(false); }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '420px', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <AlertTriangle size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              Close Study Room?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              There {participantsList.length === 1 ? 'is' : 'are'} currently <strong>{participantsList.length} participant{participantsList.length !== 1 ? 's' : ''}</strong> inside. Closing the room will terminate the session and disconnect all peers immediately.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowCloseConfirmModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Keep Open
              </button>
              <button
                type="button"
                onClick={handleCloseRoom}
                className="btn btn-primary"
                style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444', color: '#ffffff' }}
              >
                Close Room
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </RoomKnockLoader>
  );
}
