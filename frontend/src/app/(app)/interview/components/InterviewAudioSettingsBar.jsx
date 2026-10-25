'use client';
import { Volume2, Play } from 'lucide-react';
import { VOICE_SPEEDS } from './interviewConstants';

export default function InterviewAudioSettingsBar({
  selectedVoiceUri,
  handleVoiceChange,
  availableVoices,
  previewVoiceSample,
  voiceSpeed,
  handleSpeedChange,
}) {
  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-md)',
        flexWrap: 'wrap',
        gap: '1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Volume2 size={18} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
          Interviewer Audio Settings
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        {/* Voice Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>AI Voice:</span>
          <select
            value={selectedVoiceUri}
            onChange={(e) => handleVoiceChange(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
              maxWidth: '220px'
            }}
          >
            {availableVoices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI} style={{ background: '#101014', color: '#f4f4f6' }}>
                {v.name.replace(/Microsoft|Google|English/gi, '').trim().substring(0, 22) || v.name.substring(0, 22)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={previewVoiceSample}
            style={{
              padding: '0.42rem 0.75rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#f4f4f6',
              borderRadius: '6px'
            }}
            title="Test selected voice"
          >
            <Play size={12} fill="#f4f4f6" color="#f4f4f6" /> Test
          </button>
        </div>

        {/* Speed Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Speed:</span>
          {VOICE_SPEEDS.map((sp) => (
            <button
              key={sp.value}
              type="button"
              onClick={() => handleSpeedChange(sp.value)}
              style={{
                padding: '0.32rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: voiceSpeed === sp.value ? '1px solid var(--accent, #f5a623)' : '1px solid var(--border-light)',
                background: voiceSpeed === sp.value ? 'rgba(245, 166, 35, 0.15)' : 'transparent',
                color: voiceSpeed === sp.value ? 'var(--accent, #f5a623)' : 'var(--text-muted)'
              }}
            >
              {sp.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
