'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock } from 'lucide-react';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import { useTestUpload } from './hooks/useTestUpload';
import { useTestSession } from './hooks/useTestSession';
import TestConfigView from './components/TestConfigView';
import TestHeaderBar from './components/TestHeaderBar';
import TestQuestionNavigator from './components/TestQuestionNavigator';
import TestQuestionCard from './components/TestQuestionCard';
import {
  FormatGuideModal,
  PasteQuestionsModal,
  UploadNameModal,
  ReviewSubmitModal,
  MobileQuestionNavigatorDrawer,
} from './components/TestModals';

export default function FocusTest() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const urlTab = searchParams.get('tab');
  const [userTab, setUserTab] = useState(null);
  const activeTab = userTab || (urlTab === 'results' ? 'results' : 'test');
  const setActiveTab = setUserTab;
  const [mode, setMode] = useState(
    searchParams.get('mode') === 'study'
      ? 'study'
      : searchParams.get('mode') === 'oa_blitz'
      ? 'oa_blitz'
      : 'simulation'
  );
  const [perQuestionSeconds, setPerQuestionSeconds] = useState(60);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [questionCount, setQuestionCount] = useState(20);
  const [timeMinutes, setTimeMinutes] = useState(60);
  const [phase, setPhase] = useState('config');

  const {
    exams,
    selectedExams,
    setSelectedExams,
    historySearch,
    setHistorySearch,
    sourceSearch,
    setSourceSearch,
    configLoading,
    deleteExamId,
    setDeleteExamId,
    showPasteModal,
    setShowPasteModal,
    pasteText,
    setPasteText,
    pasteTitle,
    setPasteTitle,
    pasteProcessing,
    showFormatGuide,
    setShowFormatGuide,
    pendingUpload,
    setPendingUpload,
    uploadName,
    setUploadName,
    handleDeleteExam,
    confirmDeleteExam,
    handleUploadQuestions,
    confirmUpload,
    handlePasteSubmit,
  } = useTestUpload({ toast, setTimeMinutes });

  const {
    questions,
    currentIdx,
    setCurrentIdx,
    answers,
    flagged,
    checked,
    checkedResults,
    aiExplanations,
    aiLoading,
    timeLeft,
    submitting,
    showExplanation,
    setShowExplanation,
    questionTimeLeft,
    lockedQuestions,
    showMobileNavigator,
    setShowMobileNavigator,
    showExitModal,
    setShowExitModal,
    isFullscreen,
    proctorWarnings,
    showPreloader,
    showScheduleModal,
    setShowScheduleModal,
    isStudy,
    isOaBlitz,
    currentQ,
    toggleOption,
    handleCheck,
    handleAiExplain,
    toggleFlag,
    handleNext,
    handlePrev,
    goToReview,
    handleSubmit,
    handleAdvanceOaQuestion,
    handleCancelExit,
    handleConfirmExit,
    finishStartTest,
    startTest,
    formatTime,
    answeredCount,
    unansweredCount,
    timerWarning,
    timerCritical,
  } = useTestSession({
    router,
    toast,
    mode,
    perQuestionSeconds,
    soundEnabled,
    timeMinutes,
    selectedExams,
    questionCount,
    phase,
    setPhase,
  });

  if (phase === 'config') {
    return (
      <>
        <TestConfigView
          showPreloader={showPreloader}
          finishStartTest={finishStartTest}
          showScheduleModal={showScheduleModal}
          setShowScheduleModal={setShowScheduleModal}
          selectedExams={selectedExams}
          setSelectedExams={setSelectedExams}
          exams={exams}
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          timeMinutes={timeMinutes}
          setTimeMinutes={setTimeMinutes}
          deleteExamId={deleteExamId}
          setDeleteExamId={setDeleteExamId}
          confirmDeleteExam={confirmDeleteExam}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          router={router}
          mode={mode}
          setMode={setMode}
          isOaBlitz={isOaBlitz}
          isStudy={isStudy}
          perQuestionSeconds={perQuestionSeconds}
          setPerQuestionSeconds={setPerQuestionSeconds}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          configLoading={configLoading}
          startTest={startTest}
          setShowPasteModal={setShowPasteModal}
          setShowFormatGuide={setShowFormatGuide}
          handleUploadQuestions={handleUploadQuestions}
          sourceSearch={sourceSearch}
          setSourceSearch={setSourceSearch}
          historySearch={historySearch}
          setHistorySearch={setHistorySearch}
          handleDeleteExam={handleDeleteExam}
        />

        <FormatGuideModal open={showFormatGuide} onClose={() => setShowFormatGuide(false)} />

        <PasteQuestionsModal
          open={showPasteModal}
          onClose={() => setShowPasteModal(false)}
          pasteTitle={pasteTitle}
          setPasteTitle={setPasteTitle}
          pasteText={pasteText}
          setPasteText={setPasteText}
          pasteProcessing={pasteProcessing}
          handlePasteSubmit={handlePasteSubmit}
        />

        <UploadNameModal
          pendingUpload={pendingUpload}
          onClose={() => setPendingUpload(null)}
          uploadName={uploadName}
          setUploadName={setUploadName}
          confirmUpload={confirmUpload}
        />
      </>
    );
  }

  return (
    <div
      id="test-container"
      style={{
        display: 'flex',
        height: '100%',
        gap: '1.5rem',
        animation: 'fadeIn 0.3s ease-out',
        backgroundColor: 'var(--bg-primary)',
        padding: '1.5rem',
        overflow: 'auto',
        position: 'relative'
      }}
      className="test-layout"
    >
      {/* Submit Exam Modal Overlay (rendered inside fullscreen container) */}
      {phase === 'review' && (
        <ReviewSubmitModal
          answeredCount={answeredCount}
          unansweredCount={unansweredCount}
          flaggedCount={flagged.size}
          submitting={submitting}
          onBack={() => setPhase('testing')}
          onSubmit={() => handleSubmit()}
        />
      )}

      {mode !== 'simulation' && (
        <ConfirmModal
          open={showExitModal}
          onCancel={handleCancelExit}
          onConfirm={handleConfirmExit}
          title="Exit Assessment?"
          message={
            isOaBlitz
              ? 'You are currently in an OA Blitz sprint. Exiting now will forfeit the exam and answers will not be recorded.'
              : 'Are you sure you want to exit this practice session? Your current progress will be lost.'
          }
          confirmText="Exit Exam"
          cancelText="Continue Practice"
          danger={true}
        />
      )}

      {/* Fullscreen Security Blackout Guard for Simulation Proctoring only when exit modal triggered */}
      {mode === 'simulation' && showExitModal && phase === 'testing' && !submitting && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9990,
            backgroundColor: 'rgba(5, 5, 8, 0.96)',
            backdropFilter: 'blur(35px)',
            WebkitBackdropFilter: 'blur(35px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-primary)'
          }}
        >
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '460px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
              <Lock size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Exam Security Active</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Assessment questions and options are completely hidden while outside full-screen mode to prevent cheating.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
              <button
                onClick={handleConfirmExit}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Exit Exam
              </button>
              <button
                onClick={handleCancelExit}
                className="btn btn-primary"
                style={{ flex: 1, fontWeight: 700 }}
              >
                Resume Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      <TestHeaderBar
        currentIdx={currentIdx}
        totalQuestions={questions.length}
        isOaBlitz={isOaBlitz}
        questionTimeLeft={questionTimeLeft}
        perQuestionSeconds={perQuestionSeconds}
        timeLeft={timeLeft}
        formatTime={formatTime}
        timerCritical={timerCritical}
        timerWarning={timerWarning}
        timeMinutes={timeMinutes}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        mode={mode}
        proctorWarnings={proctorWarnings}
        setShowMobileNavigator={setShowMobileNavigator}
        setShowExitModal={setShowExitModal}
        isStudy={isStudy}
        goToReview={goToReview}
      >
        <TestQuestionNavigator
          questions={questions}
          currentIdx={currentIdx}
          setCurrentIdx={setCurrentIdx}
          answers={answers}
          flagged={flagged}
          lockedQuestions={lockedQuestions}
          isOaBlitz={isOaBlitz}
          isStudy={isStudy}
          checked={checked}
          checkedResults={checkedResults}
          setShowExplanation={setShowExplanation}
          toast={toast}
          answeredCount={answeredCount}
        />
      </TestHeaderBar>

      <TestQuestionCard
        currentQ={currentQ}
        currentIdx={currentIdx}
        totalQuestions={questions.length}
        mode={mode}
        isStudy={isStudy}
        isOaBlitz={isOaBlitz}
        proctorWarnings={proctorWarnings}
        questionTimeLeft={questionTimeLeft}
        isFlagged={flagged.has(currentIdx)}
        toggleFlag={toggleFlag}
        setShowExitModal={setShowExitModal}
        answers={answers}
        toggleOption={toggleOption}
        isChecked={checked.has(currentQ?.id || currentQ?._id)}
        checkResult={checkedResults[currentQ?.id || currentQ?._id]}
        showExplanation={showExplanation}
        aiExplanations={aiExplanations}
        aiLoading={aiLoading}
        handleAiExplain={handleAiExplain}
        handlePrev={handlePrev}
        handleNext={handleNext}
        handleAdvanceOaQuestion={handleAdvanceOaQuestion}
        handleCheck={handleCheck}
        goToReview={goToReview}
        toast={toast}
        isSecurityActive={mode === 'simulation' && showExitModal}
      />

      <MobileQuestionNavigatorDrawer
        open={showMobileNavigator}
        onClose={() => setShowMobileNavigator(false)}
        answeredCount={answeredCount}
        questions={questions}
        currentIdx={currentIdx}
        setCurrentIdx={setCurrentIdx}
        answers={answers}
        flagged={flagged}
        lockedQuestions={lockedQuestions}
        isOaBlitz={isOaBlitz}
        isStudy={isStudy}
        checked={checked}
        checkedResults={checkedResults}
        toast={toast}
      />
    </div>
  );
}
