'use client';

import dynamic from 'next/dynamic';
import { Volume2 } from 'lucide-react';

const InterviewerAvatar3D = dynamic(() => import('@/components/InterviewerAvatar3D'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: '#0d0d12' }} />
  )
});

export default function InterviewAiStage({
  totalQuestionsAsked,
  isAiSpeaking,
  sendingAnswer,
  audioLevel,
  transcript,
  speechPulse,
  currentQuestion,
  speakText
}) {
  return (
    <div
      style={{
        padding: '1.5rem',
        borderRadius: '16px',
        background: 'var(--surface-1, #101014)',
        border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '520px'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--ai, #a78bfa)',
                boxShadow: '0 0 6px #a78bfa'
              }}
            />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ai, #a78bfa)' }}>
              AI Technical Interviewer
            </span>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted, #a1a1ad)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.2rem 0.55rem',
              borderRadius: '4px'
            }}
          >
            Question {totalQuestionsAsked}
          </span>
        </div>

        {/* 3D Avatar Centerpiece */}
        <div style={{ padding: '0.75rem 0 1rem', display: 'flex', justifyContent: 'center' }}>
          <InterviewerAvatar3D
            state={
              isAiSpeaking
                ? 'speaking'
                : sendingAnswer
                ? 'thinking'
                : (audioLevel > 14 || (transcript && transcript.trim().length > 0))
                ? 'listening'
                : 'idle'
            }
            speechRhythm={speechPulse}
            audioLevel={audioLevel}
          />
        </div>
      </div>

      {/* Current Question Well */}
      <div
        style={{
          padding: '1.25rem',
          borderRadius: '12px',
          background: '#09090d',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          marginTop: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted, #a1a1ad)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Current Question
          </span>

          <button
            onClick={() => speakText(currentQuestion)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #a1a1ad)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.72rem',
              padding: '0.15rem'
            }}
            title="Repeat question"
          >
            <Volume2 size={14} /> Repeat
          </button>
        </div>

        <div
          style={{
            fontSize: '1.02rem',
            lineHeight: 1.6,
            color: 'var(--text, #f4f4f6)',
            fontWeight: 500
          }}
        >
          {currentQuestion}
        </div>
      </div>
    </div>
  );
}
