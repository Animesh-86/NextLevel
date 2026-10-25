'use client';
import {
  Clock,
  Play,
  Flag,
  Trophy,
  CalendarDays,
  Volume2,
  VolumeX,
} from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import ExamResultsHistory from '@/components/ExamResultsHistory';
import ScheduleTaskModal from '@/components/ScheduleTaskModal';
import AssessmentPreloader from '@/components/AssessmentPreloader';
import TestDocumentSources from './TestDocumentSources';

export default function TestConfigView({
  showPreloader,
  finishStartTest,
  showScheduleModal,
  setShowScheduleModal,
  selectedExams,
  setSelectedExams,
  exams,
  questionCount,
  setQuestionCount,
  timeMinutes,
  setTimeMinutes,
  deleteExamId,
  setDeleteExamId,
  confirmDeleteExam,
  activeTab,
  setActiveTab,
  router,
  mode,
  setMode,
  isOaBlitz,
  isStudy,
  perQuestionSeconds,
  setPerQuestionSeconds,
  soundEnabled,
  setSoundEnabled,
  configLoading,
  startTest,
  setShowPasteModal,
  setShowFormatGuide,
  handleUploadQuestions,
  sourceSearch,
  setSourceSearch,
  historySearch,
  setHistorySearch,
  handleDeleteExam,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Kinetic Typography Assessment Preloader */}
      <AssessmentPreloader
        active={showPreloader}
        onComplete={finishStartTest}
      />

      {/* Schedule Exam in Planner Modal */}
      <ScheduleTaskModal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        defaultTitle={`Practice Exam: ${selectedExams.includes('all') ? 'Global Question Bank' : (exams.find(e => (e.id || e._id) === selectedExams[0])?.title || 'Custom Test')}`}
        defaultDescription={`Timed assessment practice session (${questionCount} questions, ${timeMinutes} minutes).`}
        defaultCategory="practice-exam"
        defaultDuration={timeMinutes}
      />

      <ConfirmModal
        open={!!deleteExamId}
        onCancel={() => setDeleteExamId(null)}
        onConfirm={confirmDeleteExam}
        title="Delete this document?"
        message="This will permanently delete this document and all its questions. This action cannot be undone."
        confirmText="Delete Document"
      />

      {/* Glass Header Banner with Integrated Tabs */}
      <header className="glass-panel" style={{ padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 'var(--space-xs)' }}>
              Assessment Hub
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px' }}>
              {activeTab === 'test' 
                ? 'Configure your test parameters, load documents, or schedule an exam.'
                : 'Review your full exam performance history, pass rates, and detailed scorecards.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--border-light)'
          }}>
            <button
              type="button"
              onClick={() => { setActiveTab('test'); router.push('/test', { scroll: false }); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: activeTab === 'test' ? '#fafafa' : 'transparent',
                color: activeTab === 'test' ? '#09090b' : 'var(--text-muted, #a1a1ad)',
                boxShadow: activeTab === 'test' ? '0 2px 8px rgba(0, 0, 0, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Play size={15} style={{ fill: activeTab === 'test' ? '#09090b' : 'none', color: activeTab === 'test' ? '#09090b' : 'currentColor' }} /> Practice Exam
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('results'); router.push('/test?tab=results', { scroll: false }); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: activeTab === 'results' ? '#fafafa' : 'transparent',
                color: activeTab === 'results' ? '#09090b' : 'var(--text-muted, #a1a1ad)',
                boxShadow: activeTab === 'results' ? '0 2px 8px rgba(0, 0, 0, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Trophy size={15} style={{ color: activeTab === 'results' ? '#09090b' : 'currentColor' }} /> Exam Results & History
            </button>
          </div>
        </div>
      </header>

      {/* ─── TAB CONTENT ─── */}
      {activeTab === 'results' ? (
        <ExamResultsHistory onTakeTest={() => { setActiveTab('test'); router.push('/test', { scroll: false }); }} />
      ) : (
        <>
          {/* Row 1: Session Mode + Parameters side by side */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: 'var(--space-md)' 
          }}>
            {/* Session Mode */}
            <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                <Flag size={18} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Session Mode</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setMode('simulation')}
                  className={`btn ${mode === 'simulation' ? 'btn-primary' : ''}`}
                  style={{
                    padding: '0.8rem 0.5rem',
                    background: mode === 'simulation' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                    color: mode === 'simulation' ? 'var(--brand-inverse)' : 'var(--text-primary)',
                    border: mode === 'simulation' ? 'none' : '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Simulation</span>
                  <span style={{ fontSize: '0.68rem', opacity: 0.75 }}>Full Exam Timer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('oa_blitz')}
                  className={`btn ${mode === 'oa_blitz' ? 'btn-primary' : ''}`}
                  style={{
                    padding: '0.8rem 0.5rem',
                    background: mode === 'oa_blitz' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                    color: mode === 'oa_blitz' ? 'var(--brand-inverse)' : 'var(--text-primary)',
                    border: mode === 'oa_blitz' ? 'none' : '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>OA Blitz</span>
                  <span style={{ fontSize: '0.68rem', opacity: 0.75 }}>Timed Questions</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('study')}
                  className={`btn ${mode === 'study' ? 'btn-primary' : ''}`}
                  style={{
                    padding: '0.8rem 0.5rem',
                    background: mode === 'study' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                    color: mode === 'study' ? 'var(--brand-inverse)' : 'var(--text-primary)',
                    border: mode === 'study' ? 'none' : '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Study (SRS)</span>
                  <span style={{ fontSize: '0.68rem', opacity: 0.75 }}>Instant Feedback</span>
                </button>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '1rem' }}>
                {mode === 'oa_blitz'
                  ? 'OA Blitz Mode: Mimics corporate online assessments (AMCAT, Mercer Mettl, HackerRank). Each question has a strict countdown timer and auto-locks on timeout. Backtracking is disabled!'
                  : mode === 'simulation'
                  ? 'Simulation mode runs a timed test mimicking a real exam environment with tab infraction proctoring.'
                  : 'Study (SRS) mode uses Spaced Repetition System to help you memorize effectively, repeating harder questions more frequently.'}
              </p>
            </section>

            {/* Parameters */}
            <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                <Clock size={18} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Parameters</h2>
              </div>

              {isOaBlitz ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Timer Per Question
                      </label>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {perQuestionSeconds >= 60 ? `${(perQuestionSeconds / 60).toFixed(1).replace('.0', '')} min / question` : `${perQuestionSeconds} sec / question`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {[30, 45, 60, 90, 120, 180].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setPerQuestionSeconds(sec)}
                          style={{
                            flex: 1,
                            minWidth: '50px',
                            padding: '0.5rem 0.25rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            border: perQuestionSeconds === sec ? '1px solid var(--text-primary)' : '1px solid var(--border-light)',
                            background: perQuestionSeconds === sec ? 'var(--text-primary)' : 'var(--bg-surface)',
                            color: perQuestionSeconds === sec ? 'var(--bg-primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Questions
                      </label>
                      <input
                        type="number"
                        className="input"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                        min={1}
                        max={200}
                        style={{ fontSize: '0.95rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Total Est. Time
                      </label>
                      <div style={{
                        height: '42px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 1rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)'
                      }}>
                        ~{Math.ceil((questionCount * perQuestionSeconds) / 60)} minutes
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {soundEnabled ? <Volume2 size={15} style={{ color: 'var(--text-primary)' }} /> : <VolumeX size={15} />}
                      <span>Audio Tick in Final 5 Seconds</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSoundEnabled(prev => !prev)}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        background: soundEnabled ? 'var(--text-primary)' : 'rgba(255, 255, 255, 0.08)',
                        color: soundEnabled ? 'var(--bg-primary)' : 'var(--text-muted)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {soundEnabled ? 'Enabled' : 'Muted'}
                    </button>
                  </div>
                </div>
              ) : isStudy ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Questions</label>
                    <input type="number" className="input" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value) || 20)} min={1} max={200} style={{ fontSize: '0.95rem' }} />
                  </div>
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <Clock size={16} style={{ color: '#818cf8', flexShrink: 0 }} />
                    <span><strong>Untimed Practice:</strong> SRS Study Mode is self-paced with zero timer bounding. Take your time reviewing options and learning from instant solutions.</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time (min)</label>
                    <input type="number" className="input" value={timeMinutes} onChange={(e) => setTimeMinutes(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={360} style={{ fontSize: '0.95rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Questions</label>
                    <input type="number" className="input" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value) || 20)} min={1} max={200} style={{ fontSize: '0.95rem' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={startTest}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    padding: '0.9rem',
                    fontSize: '1rem',
                  }}
                  disabled={configLoading}
                >
                  <Play size={18} style={{ marginRight: '0.5rem' }} />
                  Begin {isOaBlitz ? 'OA Blitz' : isStudy ? 'Study Session' : 'Assessment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="btn btn-secondary"
                  style={{ padding: '0.9rem 1.15rem', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Schedule this exam in Planner"
                >
                  <CalendarDays size={18} /> Schedule
                </button>
              </div>
            </section>
          </div>

          {/* Row 2: Document Source (full width) & Document History */}
          <TestDocumentSources
            selectedExams={selectedExams}
            setSelectedExams={setSelectedExams}
            exams={exams}
            sourceSearch={sourceSearch}
            setSourceSearch={setSourceSearch}
            historySearch={historySearch}
            setHistorySearch={setHistorySearch}
            setShowPasteModal={setShowPasteModal}
            setShowFormatGuide={setShowFormatGuide}
            handleUploadQuestions={handleUploadQuestions}
            handleDeleteExam={handleDeleteExam}
          />
        </>
      )}
    </div>
  );
}
