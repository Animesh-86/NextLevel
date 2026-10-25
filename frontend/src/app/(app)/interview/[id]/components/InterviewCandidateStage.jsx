'use client';

import {
  VideoOff, Mic, RotateCcw, FastForward, HelpCircle,
  Volume2, Loader2, CheckCircle, Send
} from 'lucide-react';

export default function InterviewCandidateStage({
  cameraActive,
  candidateInFrame,
  isAiSpeaking,
  setVideoRef,
  startCameraAndMic,
  answerTimeLeft,
  QUESTION_TIME_LIMIT,
  audioLevel,
  transcript,
  setTranscript,
  recordedAudioChunksRef,
  sendingAnswer,
  isTranscribingAudio,
  autoSubmitCountdown,
  handleSkipQuestion,
  handleRequestHint,
  interruptAiAndAnswer,
  handleSubmitAnswer
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: cameraActive && candidateInFrame ? 'var(--success, #34d399)' : 'var(--danger, #f87171)',
                boxShadow: cameraActive && candidateInFrame ? '0 0 6px #34d399' : 'none'
              }}
            />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#f4f4f6' }}>
              Candidate Answer Stage (Voice-Only)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                background: isAiSpeaking ? 'rgba(167, 139, 250, 0.1)' : 'rgba(52, 211, 153, 0.1)',
                color: isAiSpeaking ? 'var(--ai, #a78bfa)' : 'var(--success, #34d399)',
                border: `1px solid ${isAiSpeaking ? 'rgba(167, 139, 250, 0.25)' : 'rgba(52, 211, 153, 0.25)'}`
              }}
            >
              {isAiSpeaking ? 'AI SPEAKING' : 'MIC ALWAYS ON'}
            </span>
          </div>
        </div>

        {/* Compact Header Grid: Camera Thumbnail + Presence & Timer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: '0.85rem',
            alignItems: 'center',
            padding: '0.65rem 0.85rem',
            borderRadius: '10px',
            background: '#09090d',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            marginBottom: '1rem'
          }}
        >
          {/* Webcam Video Preview */}
          <div
            style={{
              position: 'relative',
              width: '120px',
              height: '75px',
              borderRadius: '6px',
              overflow: 'hidden',
              background: '#000000',
              border: candidateInFrame ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #f87171'
            }}
          >
            <video
              ref={setVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
            {!cameraActive && (
              <button
                type="button"
                onClick={startCameraAndMic}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15, 15, 20, 0.9)',
                  color: '#f4f4f6',
                  border: 'none',
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  zIndex: 3
                }}
                title="Click to reconnect camera hardware"
              >
                <VideoOff size={15} color="#f87171" />
                <span>Reconnect Cam</span>
              </button>
            )}
            <div
              style={{
                position: 'absolute',
                bottom: '4px',
                left: '4px',
                fontSize: '0.6rem',
                fontWeight: 700,
                color: candidateInFrame ? '#34d399' : '#f87171',
                background: 'rgba(0, 0, 0, 0.75)',
                padding: '1px 4px',
                borderRadius: '3px',
                zIndex: 2
              }}
            >
              {candidateInFrame ? '● IN FRAME' : '⚠ OUT OF FRAME'}
            </div>
          </div>

          {/* Status Meters & Answer Timer Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted, #a1a1ad)' }}>Proctor Status</span>
              <span style={{ fontWeight: 700, color: candidateInFrame ? '#34d399' : '#f87171' }}>
                {candidateInFrame ? 'Candidate Present' : 'Candidate Missing!'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted, #a1a1ad)' }}>Answer Window</span>
              <span style={{ fontWeight: 700, color: answerTimeLeft < 20 ? '#f87171' : '#f4f4f6' }}>
                {answerTimeLeft}s
              </span>
            </div>

            <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(answerTimeLeft / QUESTION_TIME_LIMIT) * 100}%`,
                  height: '100%',
                  background: answerTimeLeft < 20 ? 'var(--danger, #f87171)' : 'var(--text, #fafafa)',
                  transition: 'width 1s linear'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Spoken Answer Stage (No Textarea — Anti-Cheat Pure Voice) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem',
          background: '#09090d',
          borderRadius: '12px',
          border: isAiSpeaking
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1.5px solid rgba(52, 211, 153, 0.35)',
          position: 'relative',
          minHeight: '180px',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Mic size={15} style={{ color: isAiSpeaking ? '#a1a1ad' : '#34d399' }} />
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isAiSpeaking ? '#a1a1ad' : '#34d399' }}>
                {isAiSpeaking ? 'Intercom Muted (AI Speaking)' : 'Microphone Listening...'}
              </span>
            </div>

            {!isAiSpeaking && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '14px' }}>
                {[1, 2, 3, 4, 5, 6].map((bar) => {
                  const active = audioLevel > bar * 12;
                  return (
                    <div
                      key={bar}
                      style={{
                        width: '3px',
                        height: active ? `${Math.min(14, 4 + bar * 2)}px` : '4px',
                        background: active ? '#34d399' : 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '2px',
                        transition: 'height 0.1s ease'
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ minHeight: '80px', color: transcript ? '#ffffff' : '#71717a', fontSize: '0.94rem', lineHeight: 1.6, fontStyle: transcript ? 'normal' : 'italic' }}>
            {transcript ? (
              <span>“{transcript}”</span>
            ) : isAiSpeaking ? (
              <span>Listen closely to the interviewer’s question...</span>
            ) : (
              <span>Speak your technical explanation naturally. Your voice is being continuously captured and transcribed...</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <span style={{ fontSize: '0.72rem', color: '#a1a1ad', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Mic size={12} style={{ color: '#34d399' }} /> Hands-Free Voice: Speak naturally. Answers are automatically heard & submitted when you pause.
          </span>

          {transcript && (
            <button
              type="button"
              onClick={() => {
                setTranscript('');
                recordedAudioChunksRef.current = [];
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #a1a1ad)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title="Clear spoken answer to re-record"
            >
              <RotateCcw size={11} /> Clear & Re-speak
            </button>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '0.65rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => handleSkipQuestion('[Candidate skipped question]')}
            disabled={sendingAnswer}
            style={{
              padding: '0.6rem 0.95rem',
              borderRadius: '8px',
              background: 'rgba(245, 166, 35, 0.08)',
              border: '1px solid rgba(245, 166, 35, 0.25)',
              color: 'var(--accent, #f5a623)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: sendingAnswer ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            title="Skip this question and move to the next topic"
          >
            <FastForward size={13} /> Skip
          </button>

          <button
            onClick={handleRequestHint}
            disabled={sendingAnswer}
            style={{
              padding: '0.6rem 0.95rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--text-muted, #a1a1ad)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: sendingAnswer ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <HelpCircle size={13} /> Hint
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {isAiSpeaking ? (
            <button
              type="button"
              onClick={interruptAiAndAnswer}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                background: 'rgba(167, 139, 250, 0.15)',
                border: '1px solid rgba(167, 139, 250, 0.45)',
                color: '#c084fc',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Click or press Spacebar to interrupt AI and answer now"
            >
              <Volume2 size={14} /> AI Speaking (Click to Answer Now)
            </button>
          ) : sendingAnswer || isTranscribingAudio ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fafafa',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              <Loader2 size={14} className="auth-spinner" /> Evaluating your technical answer...
            </div>
          ) : autoSubmitCountdown !== null ? (
            <button
              onClick={() => handleSubmitAnswer()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                background: '#34d399',
                border: 'none',
                color: '#09090b',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(52, 211, 153, 0.3)'
              }}
              title="Pause detected. Submitting now (or click to send immediately)"
            >
              <CheckCircle size={14} /> Submitting in {autoSubmitCountdown}s • Send Now ↵
            </button>
          ) : transcript.trim().length >= 15 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.52rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  color: 'var(--success, #34d399)',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
              >
                <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', animation: 'pulse 1.5s infinite' }} />
                Listening... pause to submit
              </div>
              <button
                onClick={() => handleSubmitAnswer()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.52rem 0.85rem',
                  borderRadius: '8px',
                  background: '#fafafa',
                  border: 'none',
                  color: '#09090b',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(255, 255, 255, 0.15)'
                }}
                title="Or submit immediately without waiting for pause"
              >
                <Send size={12} /> Send Now ↵
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#a1a1ad',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: audioLevel > 14 ? '#34d399' : '#71717a',
                  boxShadow: audioLevel > 14 ? '0 0 6px #34d399' : 'none'
                }}
              />
              {audioLevel > 14 ? 'Hearing your voice...' : 'Auto-Hearing (Speak Naturally)'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
