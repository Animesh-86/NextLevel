'use client';

import RoomStageSwitcher from './RoomStageSwitcher';
import RoomNotesStage from './RoomNotesStage';
import RoomIdleStage from './RoomIdleStage';
import RoomLobbyStage from './RoomLobbyStage';
import RoomLiveQuestionStage from './RoomLiveQuestionStage';
import RoomCheckpointStage from './RoomCheckpointStage';
import RoomFinalStage from './RoomFinalStage';

export default function RoomLeftStage(props) {
  const {
    isMobile,
    activeTab,
    setActiveTab,
    isChatCollapsed,
    isChallengeActive,
    messagesCount,
    stageState: propStageState,
    scratchpad,
    pomodoro,
    audio,
    roomData,
    challengeConfig,
    gameplay,
    setIsFullscreenActive: propSetIsFullscreenActive,
    toast
  } = props;

  const stageState = propStageState || gameplay?.stageState || props.stageState;
  const room = roomData?.room || props.room;
  const activeChallenge = room?.activeChallenge || props.activeChallenge;
  const participantsList = roomData?.participantsList || props.participantsList || room?.participants || [];
  const currentUserId = roomData?.currentUserId || props.currentUserId;
  const currentLeaderboard = activeChallenge?.leaderboard || props.currentLeaderboard || [];
  const setIsFullscreenActive = propSetIsFullscreenActive || props.setIsFullscreenActive;

  // Scratchpad
  const scratchpadView = scratchpad?.scratchpadView || props.scratchpadView || 'split';
  const setScratchpadView = scratchpad?.setScratchpadView || props.setScratchpadView;
  const sharedNotes = scratchpad?.sharedNotes || props.sharedNotes || '';
  const setSharedNotes = scratchpad?.setSharedNotes || props.setSharedNotes;

  // Idle stage
  const setGameMode = challengeConfig?.setGameMode || props.setGameMode;
  const setShowCreateChallengeModal = challengeConfig?.setShowCreateChallengeModal || props.setShowCreateChallengeModal;
  const viewingPastChallenge = challengeConfig?.viewingPastChallenge || props.viewingPastChallenge;
  const setViewingPastChallenge = challengeConfig?.setViewingPastChallenge || props.setViewingPastChallenge;

  // Pomodoro
  const isTimerExpanded = pomodoro?.isTimerExpanded ?? props.isTimerExpanded;
  const setIsTimerExpanded = pomodoro?.setIsTimerExpanded || props.setIsTimerExpanded;
  const timerMode = pomodoro?.timerMode || props.timerMode;
  const setTimerMode = pomodoro?.setTimerMode || props.setTimerMode;
  const showCustomFocusInput = pomodoro?.showCustomFocusInput ?? props.showCustomFocusInput;
  const setShowCustomFocusInput = pomodoro?.setShowCustomFocusInput || props.setShowCustomFocusInput;
  const customFocusInput = pomodoro?.customFocusInput ?? props.customFocusInput;
  const setCustomFocusInput = pomodoro?.setCustomFocusInput || props.setCustomFocusInput;
  const pomodoroDurationMinutes = pomodoro?.pomodoroDurationMinutes ?? props.pomodoroDurationMinutes;
  const setPomodoroDurationMinutes = pomodoro?.setPomodoroDurationMinutes || props.setPomodoroDurationMinutes;
  const pomodoroSeconds = pomodoro?.pomodoroSeconds ?? props.pomodoroSeconds;
  const setPomodoroSeconds = pomodoro?.setPomodoroSeconds || props.setPomodoroSeconds;
  const pomodoroRunning = pomodoro?.pomodoroRunning ?? props.pomodoroRunning;
  const setPomodoroRunning = pomodoro?.setPomodoroRunning || props.setPomodoroRunning;
  const pomodoroPhase = pomodoro?.pomodoroPhase || props.pomodoroPhase;
  const setPomodoroPhase = pomodoro?.setPomodoroPhase || props.setPomodoroPhase;

  // Audio
  const soundPlaying = audio?.soundPlaying ?? props.soundPlaying;
  const activeSound = audio?.activeSound || props.activeSound;
  const handleSelectSound = audio?.handleSelectSound || props.handleSelectSound;
  const showAudioPopover = audio?.showAudioPopover ?? props.showAudioPopover;
  const setShowAudioPopover = audio?.setShowAudioPopover || props.setShowAudioPopover;

  // Lobby
  const lobbyCountdown = challengeConfig?.lobbyCountdown ?? props.lobbyCountdown;
  const handleStartChallenge = gameplay?.handleStartChallenge || props.handleStartChallenge;
  const handleCancelChallenge = challengeConfig?.handleCancelChallenge || props.handleCancelChallenge;

  // Live Gameplay
  const gameQuestions = gameplay?.gameQuestions || props.gameQuestions || [];
  const currentQIdx = gameplay?.currentQIdx ?? props.currentQIdx ?? 0;
  const bossHp = gameplay?.bossHp ?? props.bossHp;
  const bossMaxHp = gameplay?.bossMaxHp ?? props.bossMaxHp;
  const teamAlphaScore = gameplay?.teamAlphaScore ?? props.teamAlphaScore;
  const teamBetaScore = gameplay?.teamBetaScore ?? props.teamBetaScore;
  const selectedOption = gameplay?.selectedOption ?? props.selectedOption;
  const isAnswerEvaluated = gameplay?.isAnswerEvaluated ?? props.isAnswerEvaluated;
  const isEliminated = gameplay?.isEliminated ?? props.isEliminated;
  const handleOptionClick = gameplay?.handleOptionClick || props.handleOptionClick;
  const handleAdvanceQuestion = gameplay?.handleAdvanceQuestion || props.handleAdvanceQuestion;

  // Checkpoint
  const checkpointNextIdx = gameplay?.checkpointNextIdx ?? props.checkpointNextIdx;
  const userScore = gameplay?.userScore ?? props.userScore;
  const resumeFromCheckpoint = gameplay?.resumeFromCheckpoint || props.resumeFromCheckpoint;

  // Final Stage
  const correctCount = gameplay?.correctCount ?? props.correctCount;
  const showPostSprintReview = gameplay?.showPostSprintReview ?? props.showPostSprintReview;
  const setShowPostSprintReview = gameplay?.setShowPostSprintReview || props.setShowPostSprintReview;
  const questionAnswersRecord = gameplay?.questionAnswersRecord || props.questionAnswersRecord;
  const handleSaveMissedToVault = gameplay?.handleSaveMissedToVault || props.handleSaveMissedToVault;
  const savingVault = gameplay?.savingVault ?? props.savingVault;
  const handleShareVictoryCard = gameplay?.handleShareVictoryCard || props.handleShareVictoryCard;
  const copiedVictoryCard = gameplay?.copiedVictoryCard ?? props.copiedVictoryCard;
  const handleDownloadResultImage = props.handleDownloadResultImage;
  const handleBackToMainRoom = challengeConfig?.handleBackToMainRoom || props.handleBackToMainRoom;

  return (
    <div
      style={{
        display: isMobile && activeTab === 'chat' ? 'none' : 'flex',
        flex: isMobile ? '1 1 100%' : isChatCollapsed ? '1 1 96%' : '1 1 65%',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: 0,
        height: '100%',
        transition: 'flex 0.25s ease'
      }}
    >
      <RoomStageSwitcher
        isChallengeActive={isChallengeActive}
        isMobile={isMobile}
        messagesCount={messagesCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <RoomNotesStage
        activeTab={activeTab}
        scratchpadView={scratchpadView}
        setScratchpadView={setScratchpadView}
        sharedNotes={sharedNotes}
        setSharedNotes={setSharedNotes}
        toast={toast}
      />

      <RoomIdleStage
        activeTab={activeTab}
        stageState={stageState}
        isTimerExpanded={isTimerExpanded}
        setIsTimerExpanded={setIsTimerExpanded}
        isMobile={isMobile}
        participantsList={participantsList}
        setGameMode={setGameMode}
        setShowCreateChallengeModal={setShowCreateChallengeModal}
        timerMode={timerMode}
        setTimerMode={setTimerMode}
        showCustomFocusInput={showCustomFocusInput}
        setShowCustomFocusInput={setShowCustomFocusInput}
        customFocusInput={customFocusInput}
        setCustomFocusInput={setCustomFocusInput}
        pomodoroDurationMinutes={pomodoroDurationMinutes}
        setPomodoroDurationMinutes={setPomodoroDurationMinutes}
        pomodoroSeconds={pomodoroSeconds}
        setPomodoroSeconds={setPomodoroSeconds}
        pomodoroRunning={pomodoroRunning}
        setPomodoroRunning={setPomodoroRunning}
        pomodoroPhase={pomodoroPhase}
        setPomodoroPhase={setPomodoroPhase}
        soundPlaying={soundPlaying}
        activeSound={activeSound}
        handleSelectSound={handleSelectSound}
        showAudioPopover={showAudioPopover}
        setShowAudioPopover={setShowAudioPopover}
        room={room}
        viewingPastChallenge={viewingPastChallenge}
        setViewingPastChallenge={setViewingPastChallenge}
        toast={toast}
      />

      <RoomLobbyStage
        stageState={stageState}
        activeChallenge={activeChallenge}
        participantsList={participantsList}
        currentUserId={currentUserId}
        room={room}
        lobbyCountdown={lobbyCountdown}
        isMobile={isMobile}
        setIsFullscreenActive={setIsFullscreenActive}
        handleStartChallenge={handleStartChallenge}
        handleCancelChallenge={handleCancelChallenge}
      />

      <RoomLiveQuestionStage
        stageState={stageState}
        gameQuestions={gameQuestions}
        currentQIdx={currentQIdx}
        activeChallenge={activeChallenge}
        room={room}
        bossHp={bossHp}
        bossMaxHp={bossMaxHp}
        teamAlphaScore={teamAlphaScore}
        teamBetaScore={teamBetaScore}
        selectedOption={selectedOption}
        isAnswerEvaluated={isAnswerEvaluated}
        isEliminated={isEliminated}
        handleOptionClick={handleOptionClick}
        handleAdvanceQuestion={handleAdvanceQuestion}
      />

      <RoomCheckpointStage
        stageState={stageState}
        checkpointNextIdx={checkpointNextIdx}
        currentLeaderboard={currentLeaderboard}
        userScore={userScore}
        currentUserId={currentUserId}
        resumeFromCheckpoint={resumeFromCheckpoint}
      />

      <RoomFinalStage
        stageState={stageState}
        activeChallenge={activeChallenge}
        room={room}
        isEliminated={isEliminated}
        bossHp={bossHp}
        userScore={userScore}
        correctCount={correctCount}
        gameQuestions={gameQuestions}
        showPostSprintReview={showPostSprintReview}
        setShowPostSprintReview={setShowPostSprintReview}
        currentLeaderboard={currentLeaderboard}
        currentUserId={currentUserId}
        questionAnswersRecord={questionAnswersRecord}
        handleSaveMissedToVault={handleSaveMissedToVault}
        savingVault={savingVault}
        handleShareVictoryCard={handleShareVictoryCard}
        copiedVictoryCard={copiedVictoryCard}
        handleDownloadResultImage={handleDownloadResultImage}
        handleBackToMainRoom={handleBackToMainRoom}
      />
    </div>
  );
}
