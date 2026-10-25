'use client';
import Link from 'next/link';
import { Users, ChevronRight, KeyRound, Plus } from 'lucide-react';

export default function DashboardStatsGrid({
  examsTakenCount,
  examAvgScore,
  getScoreColor,
  passRate,
  interviews,
  interviewAvgScore,
  userRooms,
  currentUserId,
  onOpenJoinModal,
}) {
  return (
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
            Average score · {passRate || 0}% pass rate
          </div>

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

      {/* Box 3: Joined Room */}
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

        {/* Modal Trigger & Create Link */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            onClick={onOpenJoinModal}
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
  );
}
