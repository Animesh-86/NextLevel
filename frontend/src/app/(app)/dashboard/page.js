'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/useAuth';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { useCurrentContext } from '@/lib/CurrentContext';
import DashboardHeader from './components/DashboardHeader';
import DashboardBriefingRow from './components/DashboardBriefingRow';
import DashboardStatsGrid from './components/DashboardStatsGrid';
import DashboardRecentActivity from './components/DashboardRecentActivity';
import DashboardTodayTasks from './components/DashboardTodayTasks';
import DashboardJoinRoomModal from './components/DashboardJoinRoomModal';
import DashboardJumpToBar from './components/DashboardJumpToBar';

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

  const getScoreColor = (score) => {
    if (score == null) return 'var(--text-muted)';
    if (score < 40) return 'var(--red)';
    if (score <= 70) return 'var(--amber)';
    return 'var(--green)';
  };

  const currentUserId = profile?.id || session?.user?.id;
  const userRooms = useMemo(() => {
    if (!rooms || rooms.length === 0) return [];
    const joined = rooms.filter(r => 
      r.hostUserId === currentUserId || 
      (r.participants && r.participants.some(p => p.userId === currentUserId))
    );
    return joined.length > 0 ? joined : rooms.slice(0, 2);
  }, [rooms, currentUserId]);

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

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return items;
  }, [results, interviews]);

  const filteredActivity = useMemo(() => {
    if (activityFilter === 'exams') return combinedActivity.filter(a => a.type === 'exam');
    if (activityFilter === 'interviews') return combinedActivity.filter(a => a.type === 'interview');
    return combinedActivity;
  }, [combinedActivity, activityFilter]);

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
    } catch {
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
    } catch {
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
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', width: '100%', paddingBottom: '3.5rem', background: 'var(--bg)' }}>
      {/* Top Header */}
      <DashboardHeader
        dateFormatted={dateFormatted}
        greeting={greeting}
        userName={userName}
        streak={streak}
        profile={profile}
      />

      {/* Row 1: Daily Briefing + Focus Today */}
      <DashboardBriefingRow
        digest={digest}
        focusStats={focusStats}
        userRooms={userRooms}
      />

      {/* Row 2: 3 Cards (Practice Exams, AI Interviews, Joined Room) */}
      <DashboardStatsGrid
        examsTakenCount={examsTakenCount}
        examAvgScore={examAvgScore}
        getScoreColor={getScoreColor}
        passRate={stats?.passRate}
        interviews={interviews}
        interviewAvgScore={interviewAvgScore}
        userRooms={userRooms}
        currentUserId={currentUserId}
        onOpenJoinModal={() => setShowJoinModal(true)}
      />

      {/* Row 3: 2 Big Boxes (Recent Activity, Tasks) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)', gap: '1rem' }}>
        <DashboardRecentActivity
          activityFilter={activityFilter}
          setActivityFilter={setActivityFilter}
          filteredActivity={filteredActivity}
          getScoreColor={getScoreColor}
          formatRelativeTime={formatRelativeTime}
        />

        <DashboardTodayTasks
          todayTasks={todayTasks}
          handleToggleTask={handleToggleTask}
          handleDeleteTask={handleDeleteTask}
          newTaskInput={newTaskInput}
          setNewTaskInput={setNewTaskInput}
          handleQuickAddTask={handleQuickAddTask}
          handleQuickAddTaskClick={handleQuickAddTaskClick}
          isAddingTask={isAddingTask}
        />
      </div>

      {/* Join Room Modal */}
      <DashboardJoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        joinCodeInput={joinCodeInput}
        setJoinCodeInput={setJoinCodeInput}
        handleJoinRoom={handleJoinRoom}
        isJoining={isJoining}
      />

      {/* Bottom Bar: Jump To */}
      <DashboardJumpToBar />
    </div>
  );
}
