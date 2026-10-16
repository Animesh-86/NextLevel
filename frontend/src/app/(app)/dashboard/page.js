'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/useAuth';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import {
  Flame, Target, BookOpen, Clock, Play, Map, FolderOpen,
  CalendarDays, Inbox, ChevronRight, CheckCircle2,
  Circle, Mic, Award, Users, Plus, ArrowRight, Sparkles, Radio,
  Activity, Zap, Trophy, BarChart3, ExternalLink, X, KeyRound, Trash2
} from 'lucide-react';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { useCurrentContext } from '@/lib/CurrentContext';

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { setActiveContext } = useCurrentContext();

  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [digest, setDigest] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [focusStats, setFocusStats] = useState({ minutes: 0, sessions: 0 });
  const [interviews, setInterviews] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [results, setResults] = useState([]);
  const [activityFilter, setActivityFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Quick action states
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    setActiveContext("The user is viewing their main Dashboard, including daily briefing, focus today, practice exams, AI interviews, and study rooms.");
    return () => setActiveContext("");
  }, [setActiveContext]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const localDateKey = () => {
          const d = new Date();
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        const todayStr = localDateKey();

        const [statsR, profileR, analyticsR, digestR, tasksR, sessionsR, interviewsR, roomsR, resultsR] = await Promise.all([
          apiFetch('/api/stats').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/user/profile').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/analytics').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/digest/today').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch(`/api/planner?start=${todayStr}&end=${todayStr}`).then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/study/sessions').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/interviews').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/rooms').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/results?limit=10').then(r => r.json()).catch(() => ({ success: false })),
        ]);

        if (statsR.success) setStats(statsR.data);
        if (profileR.success) setProfile(profileR.data);
        if (analyticsR.success) setAnalytics(analyticsR.data);
        if (digestR.success) setDigest(digestR.data);
        if (tasksR.success) setTodayTasks(tasksR.data || []);
        if (interviewsR.success && Array.isArray(interviewsR.data)) setInterviews(interviewsR.data);
        if (roomsR.success && Array.isArray(roomsR.data)) setRooms(roomsR.data);
        if (resultsR.success && resultsR.data) {
          const list = Array.isArray(resultsR.data.data)
            ? resultsR.data.data
            : Array.isArray(resultsR.data.results)
              ? resultsR.data.results
              : Array.isArray(resultsR.data)
                ? resultsR.data
                : [];
          setResults(list);
        }

        if (sessionsR.success) {
          const list = sessionsR.data || [];
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          const todaySessions = list.filter(s => new Date(s.createdAt || s.startTime) >= startOfDay);
          const mins = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
          setFocusStats({ minutes: mins, sessions: todaySessions.length });
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Format relative timestamps
  function formatRelativeTime(date) {
    if (!date) return '';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Calculate dynamic metrics
  const streak = profile?.streak || stats?.streak || digest?.streak || analytics?.streak || 2;
  const userName = profile?.name?.split(' ')[0] || session?.user?.name?.split(' ')[0] || 'Student';
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();

  const interviewAvgScore = useMemo(() => {
    if (!interviews || interviews.length === 0) return 0;
    const scored = interviews.filter(i => (i.scorecard?.overallScore || 0) > 0);
    if (scored.length === 0) return 0;
    return Math.round(scored.reduce((s, i) => s + (i.scorecard?.overallScore || 0), 0) / scored.length);
  }, [interviews]);

  const examsTakenCount = stats?.totalExamsTaken != null ? stats.totalExamsTaken : (profile?.totalExams || 1);
  const examAvgScore = stats?.avgScore != null ? stats.avgScore : 1;

  // Score color follows the number: --red below 40, --amber at 40–70, --green above 70
  const getScoreColor = (score) => {
    if (score == null) return 'var(--text-muted)';
    if (score < 40) return 'var(--red)';
    if (score <= 70) return 'var(--amber)';
    return 'var(--green)';
  };

  // Filter joined or hosted rooms
  const currentUserId = profile?.id || session?.user?.id;
  const userRooms = useMemo(() => {
    if (!rooms || rooms.length === 0) return [];
    const joined = rooms.filter(r => 
      r.hostUserId === currentUserId || 
      (r.participants && r.participants.some(p => p.userId === currentUserId))
    );
    // If user hasn't explicitly joined any room yet, show the most recent active room so they can rejoin or join
    return joined.length > 0 ? joined : rooms.slice(0, 2);
  }, [rooms, currentUserId]);

  // Combined real activity feed across exams and mock interviews
  const combinedActivity = useMemo(() => {
    const items = [];
    
    if (Array.isArray(results)) {
      results.forEach(r => {
        items.push({
          id: `exam-${r.id || r._id}`,
          type: 'exam',
          title: r.exam?.title || r.examTitle || 'Practice Assessment',
          score: r.scorePercent != null ? Math.round(r.scorePercent) : null,
          correctCount: r.correctCount,
          totalCount: r.totalCount,
          passed: r.passed,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
          link: `/results/${r.id || r._id}`
        });
      });
    }

    if (Array.isArray(interviews)) {
      interviews.forEach(i => {
        items.push({
          id: `interview-${i.id}`,
          type: 'interview',
          title: i.role ? `${i.role} Mock Interview` : 'Technical Mock Interview',
          score: i.scorecard?.overallScore != null ? Math.round(i.scorecard.overallScore) : null,
          verdict: i.scorecard?.verdict,
          status: i.status,
          durationMinutes: i.durationMinutes,
          createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
          link: `/interview/${i.id}/scorecard`
        });
      });
    }

    // Sort by date descending
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return items;
  }, [results, interviews]);

  const filteredActivity = useMemo(() => {
    if (activityFilter === 'exams') return combinedActivity.filter(a => a.type === 'exam');
    if (activityFilter === 'interviews') return combinedActivity.filter(a => a.type === 'interview');
    return combinedActivity;
  }, [combinedActivity, activityFilter]);

  // Handle quick task creation
  async function submitNewTask(title) {
    if (!title) return;
    setIsAddingTask(true);
    try {
      const todayIso = new Date().toISOString();
      const res = await apiFetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          scheduledDate: todayIso,
          category: 'Personal',
          status: 'todo',
          priority: 'medium'
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTodayTasks(prev => [...prev, data.data]);
        setNewTaskInput('');
        toast.success('Task added to today');
      } else {
        toast.error(data.error || 'Failed to add task');
      }
    } catch (err) {
      toast.error('Network error creating task');
    } finally {
      setIsAddingTask(false);
    }
  }

  function handleQuickAddTask(e) {
    if (e.key === 'Enter' && newTaskInput.trim()) {
      e.preventDefault();
      submitNewTask(newTaskInput.trim());
    }
  }

  function handleQuickAddTaskClick() {
    if (newTaskInput.trim()) {
      submitNewTask(newTaskInput.trim());
    }
  }

  // Handle task delete
  async function handleDeleteTask(taskId, e) {
    if (e) e.stopPropagation();
    try {
      const res = await apiFetch(`/api/planner/${taskId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTodayTasks(prev => prev.filter(t => (t.id || t._id) !== taskId));
        toast.success('Task removed');
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }

  // Handle task checkbox toggle
  async function handleToggleTask(taskId, currentStatus) {
    const nextStatus = currentStatus === 'done' ? 'todo' : 'done';
    try {
      const res = await apiFetch(`/api/planner/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        setTodayTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  }

  // Handle join room by code
  async function handleJoinRoom(e) {
    if (e) e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const code = joinCodeInput.trim().toUpperCase();
    setIsJoining(true);
    try {
      const res = await apiFetch(`/api/rooms/${code}/join`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data?.id) {
        setShowJoinModal(false);
        router.push(`/rooms/${data.data.id}`);
      } else {
        toast.error(data.error || 'Room not found or code invalid');
      }
    } catch (err) {
      toast.error('Failed to join room');
    } finally {
      setIsJoining(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem' }}>
        <SkeletonCard height="120px" />
        <SkeletonCard height="160px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <SkeletonCard height="140px" />
          <SkeletonCard height="140px" />
          <SkeletonCard height="140px" />
        </div>
      </div>
    );
  }  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', width: '100%', paddingBottom: '3.5rem', background: 'var(--bg)' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
            {dateFormatted}
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.04em', margin: 0, color: 'var(--text)' }}>
            {greeting}, {userName}
          </h1>
        </div>

        {/* Header Right Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Flame Streak Pill */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '7px', 
            background: 'var(--amber-tint)', 
            border: '1px solid var(--amber-border)', 
            color: 'var(--amber)', 
            padding: '6px 14px', 
            borderRadius: '999px',
            fontSize: '0.86rem',
            fontWeight: 700
          }}>
            <Flame size={15} style={{ color: 'var(--amber)' }} />
            <span>{streak}-day streak</span>
          </div>

          {/* Level Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-strong)',
            color: 'var(--text)',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.86rem',
            fontWeight: 700
          }}>
            <Award size={15} style={{ color: 'var(--text-muted)' }} />
            <span>Level {profile?.level || 1} • {profile?.xp || 55} XP</span>
          </div>

          {/* Practice Exam Button */}
          <Link
            href="/test"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text)',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.84rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            <Target size={14} style={{ color: 'var(--text-muted)' }} />
            <span>Practice Exam</span>
          </Link>
        </div>
      </header>

      {/* Row 1: Daily Briefing + Focus Today */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '1rem' }}>
        {/* Left: Daily Briefing Card */}
        <div style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          borderRadius: '16px', 
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
              <Sparkles size={13} style={{ color: 'var(--text-muted)' }} />
              <span>DAILY BRIEFING</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, margin: '0 0 0.5rem 0' }}>
              {digest?.message ? digest.message.split('.')[0] + '.' : 'Keep your streak alive. Add one small task today to build momentum.'}
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0', lineHeight: 1.45 }}>
              {digest?.message && digest.message.includes('.') 
                ? digest.message.split('.').slice(1).join('.').trim() || 'Nothing is planned yet, so the quickest win is a plan for the day.'
                : 'Nothing is planned yet, so the quickest win is a plan for the day.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link 
              href="/planner" 
              className="dash-btn-primary"
              style={{ 
                background: 'var(--btn-bg)', 
                color: 'var(--btn-text)', 
                fontWeight: 700, 
                fontSize: '0.84rem', 
                padding: '0.55rem 1.15rem', 
                borderRadius: '8px', 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              Plan my day
            </Link>
            <Link 
              href={userRooms.length > 0 ? `/rooms/${userRooms[0].id}` : '/rooms'} 
              className="dash-btn-ghost"
              style={{ 
                background: 'transparent', 
                border: '1px solid var(--border-strong)', 
                color: 'var(--text)', 
                fontWeight: 600, 
                fontSize: '0.84rem', 
                padding: '0.55rem 1.15rem', 
                borderRadius: '8px', 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Clock size={14} style={{ color: 'var(--text-muted)' }} />
              <span>Start 25m focus</span>
            </Link>
          </div>
        </div>

        {/* Right: Focus Today Card */}
        <div style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          borderRadius: '16px', 
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          {/* Circular Progress Ring */}
          <div style={{ position: 'relative', width: '70px', height: '70px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="70" height="70" viewBox="0 0 70 70" style={{ transform: 'rotate(-90deg)' }}>
              <circle 
                cx="35" cy="35" r="28" 
                stroke="var(--surface-2)" 
                strokeWidth="5" 
                fill="none" 
              />
              <circle 
                cx="35" cy="35" r="28" 
                stroke="var(--amber)" 
                strokeWidth="5" 
                fill="none" 
                strokeDasharray={175.9} 
                strokeDashoffset={175.9 - (175.9 * Math.min(1, (focusStats.minutes || 0) / 25))} 
                strokeLinecap="round" 
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <span style={{ position: 'absolute', fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>
              {focusStats.minutes}m
            </span>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              FOCUS TODAY
            </span>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
              {focusStats.minutes} of 25 min
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              {focusStats.sessions} {focusStats.sessions === 1 ? 'session' : 'sessions'} so far
            </span>
            <Link 
              href={userRooms.length > 0 ? `/rooms/${userRooms[0].id}` : '/rooms'} 
              className="dash-link"
              style={{ 
                color: 'var(--text-muted)', 
                fontSize: '0.82rem', 
                fontWeight: 700, 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Open Focus Timer
            </Link>
          </div>
        </div>
      </div>

      {/* Row 2: 3 Cards (Practice Exams, AI Interviews, Joined Room) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
        {/* Box 1: Practice Exams */}
        <div style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          borderRadius: '16px', 
          padding: '1.35rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                PRACTICE EXAMS
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {examsTakenCount} taken
              </span>
            </div>

            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getScoreColor(examAvgScore), letterSpacing: '-0.04em', lineHeight: 1 }}>
              {examAvgScore}%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0 0.85rem 0' }}>
              Average score · {stats?.passRate || 0}% pass rate
            </div>

            {/* Score progress bar */}
            <div style={{ height: '4px', background: 'var(--surface-2)', borderRadius: '999px', overflow: 'hidden', marginBottom: '1.25rem' }}>
              <div style={{ height: '100%', width: `${Math.max(2, examAvgScore)}%`, background: 'var(--amber)', borderRadius: '999px' }} />
            </div>
          </div>

          <Link 
            href="/test" 
            className="dash-btn-ghost"
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--border-strong)', 
              color: 'var(--text)', 
              fontSize: '0.82rem', 
              fontWeight: 600, 
              padding: '0.55rem', 
              borderRadius: '8px', 
              textAlign: 'center',
              textDecoration: 'none'
            }}
          >
            Take a practice exam
          </Link>
        </div>

        {/* Box 2: AI Interviews */}
        <div style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          borderRadius: '16px', 
          padding: '1.35rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                AI INTERVIEWS
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {interviews.length} taken
              </span>
            </div>

            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getScoreColor(interviewAvgScore), letterSpacing: '-0.04em', lineHeight: 1 }}>
              {interviewAvgScore}%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0 0.85rem 0' }}>
              Average score · {interviews[0]?.scorecard?.verdict ? interviews[0].scorecard.verdict.replace(/_/g, ' ') : 'Ready for mock'}
            </div>

            {/* Score progress bar */}
            <div style={{ height: '4px', background: 'var(--surface-2)', borderRadius: '999px', overflow: 'hidden', marginBottom: '1.25rem' }}>
              <div style={{ height: '100%', width: `${Math.max(2, interviewAvgScore)}%`, background: 'var(--amber)', borderRadius: '999px' }} />
            </div>
          </div>

          <Link 
            href="/interview" 
            className="dash-btn-ghost"
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--border-strong)', 
              color: 'var(--text)', 
              fontSize: '0.82rem', 
              fontWeight: 600, 
              padding: '0.55rem', 
              borderRadius: '8px', 
              textAlign: 'center',
              textDecoration: 'none'
            }}
          >
            Start a mock interview
          </Link>
        </div>

        {/* Box 3: Joined Room & Join a Room Modal Trigger */}
        <div style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          borderRadius: '16px', 
          padding: '1.35rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                  STUDY ROOMS
                </span>
              </div>
              <Link href="/rooms" className="dash-link" style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                <span>Browse</span> <ChevronRight size={12} />
              </Link>
            </div>

            {/* Room Preview or Info */}
            {userRooms.length > 0 ? (
              (() => {
                const room = userRooms[0];
                const isHost = room.hostUserId === currentUserId;
                return (
                  <Link 
                    href={`/rooms/${room.id}`}
                    style={{
                      textDecoration: 'none',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '0.75rem 0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      transition: 'background 0.2s',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>{room.name || room.title}</span>
                        <span style={{ 
                          background: isHost ? 'var(--amber-tint)' : 'var(--surface)', 
                          color: isHost ? 'var(--amber)' : 'var(--text-muted)', 
                          fontSize: '0.62rem', 
                          fontWeight: 700, 
                          padding: '1px 5px', 
                          borderRadius: '4px' 
                        }}>
                          {isHost ? 'Host' : 'Member'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--green)', fontWeight: 600 }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)' }} />
                        <span>Live</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>
                      {room.description || 'Collaborative focus space with synchronized Pomodoro & sprint arena. Click to enter.'}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', paddingTop: '2px' }}>
                      <span style={{ fontFamily: 'monospace', color: 'var(--text)', letterSpacing: '0.04em' }}>{room.roomCode}</span>
                      <span>{room.participantCount || 1} of {room.maxParticipants || 25} online</span>
                    </div>
                  </Link>
                );
              })()
            ) : (
              <Link 
                href="/rooms"
                style={{ 
                  textDecoration: 'none',
                  display: 'block',
                  padding: '0.75rem 0.85rem', 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '12px',
                  marginBottom: '0.5rem'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.86rem', marginBottom: '3px' }}>Collaborative Focus Spaces</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>
                  Study with peers, compete in OA Blitz sprints, and share deep work timers. Click to explore.
                </p>
              </Link>
            )}
          </div>

          {/* Join a room? Modal Trigger & Create Link */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => setShowJoinModal(true)}
              className="dash-btn-ghost"
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid var(--border-strong)',
                color: 'var(--text)',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.52rem 0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <KeyRound size={13} style={{ color: 'var(--text-muted)' }} />
              <span>Join a room?</span>
            </button>

            <Link
              href="/rooms"
              className="dash-btn-ghost"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-strong)',
                color: 'var(--text)',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.52rem 0.9rem',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={13} style={{ color: 'var(--text-muted)' }} />
              <span>Create</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3: 2 Big Boxes (Recent Activity, Tasks) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)', gap: '1rem' }}>
        {/* Left Big Box: Recent Activity & Performance */}
        <div style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          borderRadius: '16px', 
          padding: '1.35rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '320px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={15} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                  RECENT ACTIVITY & PERFORMANCE
                </span>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-2)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {['all', 'exams', 'interviews'].map(f => (
                  <button
                    key={f}
                    onClick={() => setActivityFilter(f)}
                    style={{
                      background: activityFilter === f ? 'var(--surface)' : 'transparent',
                      border: activityFilter === f ? '1px solid var(--border-strong)' : 'none',
                      color: activityFilter === f ? 'var(--text)' : 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {f === 'all' ? 'All' : f === 'exams' ? 'Exams' : 'Interviews'}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity List */}
            {filteredActivity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {filteredActivity.slice(0, 4).map(item => {
                  const isExam = item.type === 'exam';
                  const scoreColor = getScoreColor(item.score);
                  
                  return (
                    <div 
                      key={item.id} 
                      style={{ 
                        background: 'var(--surface-2)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '12px', 
                        padding: '0.8rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                        <div style={{ 
                          width: '36px', height: '36px', borderRadius: '10px', 
                          background: 'var(--surface)', 
                          border: '1px solid var(--border)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-muted)',
                          flexShrink: 0
                        }}>
                          {isExam ? <Target size={16} /> : <Mic size={16} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.title}
                            </span>
                            {item.verdict && (
                              <span style={{ 
                                background: 'var(--surface)', 
                                border: '1px solid var(--border)',
                                color: item.verdict.includes('HIRE') ? 'var(--green)' : 'var(--red)', 
                                fontSize: '0.62rem', 
                                fontWeight: 700, 
                                padding: '1px 5px', 
                                borderRadius: '4px',
                                textTransform: 'uppercase'
                              }}>
                                {item.verdict.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {item.type === 'exam' 
                              ? `${item.correctCount != null && item.totalCount != null ? `${item.correctCount}/${item.totalCount} correct · ` : ''}${formatRelativeTime(item.createdAt)}`
                              : `${item.durationMinutes ? `${item.durationMinutes}m interview · ` : ''}${formatRelativeTime(item.createdAt)}`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
                        {item.score != null && (
                          <div style={{ 
                            fontSize: '0.92rem', 
                            fontWeight: 800, 
                            color: scoreColor,
                            background: 'var(--surface)',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)'
                          }}>
                            {item.score}%
                          </div>
                        )}
                        <Link 
                          href={item.link}
                          className="dash-link"
                          style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            textDecoration: 'none',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            padding: '5px 10px',
                            borderRadius: '6px'
                          }}
                        >
                          <span>{isExam ? 'Review' : 'Scorecard'}</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ 
                padding: '2rem 1rem', 
                background: 'var(--surface-2)', 
                border: '1px solid var(--border)',
                borderRadius: '12px', 
                textAlign: 'center', 
                color: 'var(--text-muted)', 
                fontSize: '0.85rem' 
              }}>
                <p style={{ margin: '0 0 1rem 0' }}>No recent evaluations found. Complete a practice exam or mock interview to track progress.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                  <Link href="/test" className="dash-btn-ghost" style={{ border: '1px solid var(--border-strong)', color: 'var(--text)', padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
                    Practice Exams
                  </Link>
                  <Link href="/interview" className="dash-btn-ghost" style={{ border: '1px solid var(--border-strong)', color: 'var(--text)', padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
                    AI Mock Interview
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div style={{ paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Showing latest assessments & mock rounds
            </span>
            <Link href="/profile" className="dash-link" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              View full learning profile <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Right Big Box: Tasks For Today */}
        <div style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          borderRadius: '16px', 
          padding: '1.35rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '320px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                  TASKS FOR TODAY
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {todayTasks.filter(t => t.status === 'done').length}/{todayTasks.length} completed
                </span>
                <Link href="/planner" className="dash-link" style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                  <span>Planner</span> <ChevronRight size={12} />
                </Link>
              </div>
            </div>

            {/* Task Progress Bar */}
            {todayTasks.length > 0 && (
              <div style={{ height: '4px', background: 'var(--surface-2)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${(todayTasks.filter(t => t.status === 'done').length / todayTasks.length) * 100}%`, 
                  background: 'var(--amber)', 
                  borderRadius: '999px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            )}

            {/* Task Items List */}
            {todayTasks.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.35rem 0' }}>
                  Nothing planned yet
                </h3>
                <p style={{ fontSize: '0.82rem', margin: 0 }}>
                  Add the main goal or concept you want to conquer today.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '190px', overflowY: 'auto', paddingRight: '4px' }}>
                {todayTasks.map(task => {
                  const isDone = task.status === 'done';
                  const taskId = task.id || task._id;
                  return (
                    <div 
                      key={taskId} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        gap: '8px'
                      }}
                    >
                      <div 
                        onClick={() => handleToggleTask(taskId, task.status)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, minWidth: 0 }}
                      >
                        <div style={{ 
                          width: '16px', height: '16px', borderRadius: '4px', 
                          border: isDone ? 'none' : '1px solid var(--border-strong)', 
                          background: isDone ? 'var(--amber)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isDone && <CheckCircle2 size={13} style={{ color: 'var(--btn-text)' }} />}
                        </div>
                        <span style={{ 
                          fontSize: '0.84rem',
                          color: isDone ? 'var(--text-muted)' : 'var(--text)',
                          textDecoration: isDone ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {task.title}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteTask(taskId, e)}
                        title="Delete task"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Add Task Input */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
            <input 
              type="text" 
              placeholder="Add a task for today and press Enter..." 
              value={newTaskInput}
              onChange={e => setNewTaskInput(e.target.value)}
              onKeyDown={handleQuickAddTask}
              disabled={isAddingTask}
              style={{ 
                flex: 1, 
                background: 'var(--surface-2)', 
                border: '1px solid var(--border)', 
                color: 'var(--text)', 
                fontSize: '0.82rem', 
                padding: '0.6rem 0.9rem', 
                borderRadius: '8px', 
                outline: 'none'
              }} 
            />
            <button
              onClick={handleQuickAddTaskClick}
              disabled={isAddingTask || !newTaskInput.trim()}
              style={{
                background: newTaskInput.trim() ? 'var(--btn-bg)' : 'var(--surface-2)',
                border: newTaskInput.trim() ? 'none' : '1px solid var(--border)',
                color: newTaskInput.trim() ? 'var(--btn-text)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.82rem',
                padding: '0.6rem 0.95rem',
                borderRadius: '8px',
                cursor: newTaskInput.trim() ? 'pointer' : 'default',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                opacity: isAddingTask ? 0.6 : 1
              }}
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div 
          onClick={() => setShowJoinModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: '16px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} style={{ color: 'var(--text-muted)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>Join Study Room</h3>
              </div>
              <button 
                onClick={() => setShowJoinModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0', lineHeight: 1.45 }}>
              Enter the unique 6-character room code to join your peers in real-time focus & arena sprints.
            </p>

            <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  ROOM CODE
                </label>
                <input 
                  type="text" 
                  placeholder="NL-0000" 
                  autoFocus
                  value={joinCodeInput}
                  onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                  style={{ 
                    width: '100%', 
                    background: 'var(--surface-2)', 
                    border: '1px solid var(--border)', 
                    color: 'var(--text)', 
                    fontSize: '1.25rem', 
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    padding: '0.75rem 1rem', 
                    borderRadius: '10px',
                    outline: 'none',
                    letterSpacing: '0.1em',
                    textAlign: 'center',
                    boxSizing: 'border-box'
                  }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowJoinModal(false)}
                  className="dash-btn-ghost"
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid var(--border-strong)', 
                    color: 'var(--text)', 
                    fontSize: '0.84rem', 
                    fontWeight: 600, 
                    padding: '0.65rem 1.15rem', 
                    borderRadius: '8px', 
                    cursor: 'pointer' 
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isJoining || !joinCodeInput.trim()}
                  className="dash-btn-primary"
                  style={{ 
                    background: 'var(--btn-bg)', 
                    border: 'none', 
                    color: 'var(--btn-text)', 
                    fontSize: '0.84rem', 
                    fontWeight: 700, 
                    padding: '0.65rem 1.4rem', 
                    borderRadius: '8px', 
                    cursor: isJoining ? 'not-allowed' : 'pointer',
                    opacity: isJoining || !joinCodeInput.trim() ? 0.6 : 1
                  }}
                >
                  {isJoining ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Bar: Jump To */}
      <footer style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        flexWrap: 'wrap', 
        paddingTop: '1.25rem',
        borderTop: '1px solid var(--border)'
      }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
          JUMP TO
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { href: '/captures', label: 'Capture Hub', icon: Inbox },
            { href: '/vault', label: 'File Vault', icon: FolderOpen },
            { href: '/planner', label: 'Planner', icon: CalendarDays },
            { href: '/journey', label: 'Learning Journey', icon: Map },
            { href: '/test', label: 'Assessments', icon: Target },
            { href: '/interview', label: 'Mock Interview', icon: Mic }
          ].map(item => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--border-strong)', 
                  borderRadius: '999px', 
                  padding: '0.45rem 1rem', 
                  fontSize: '0.82rem', 
                  fontWeight: 600, 
                  color: 'var(--text)',
                  textDecoration: 'none'
                }}
              >
                <Icon size={14} style={{ color: 'var(--text-muted)' }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
