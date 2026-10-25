'use client';

import RoomArenaChooser from './RoomArenaChooser';
import RoomFocusTimer from './RoomFocusTimer';
import RoomRecentSprints from './RoomRecentSprints';

export default function RoomIdleStage({
  activeTab,
  stageState,
  isTimerExpanded,
  setIsTimerExpanded,
  isMobile,
  participantsList,
  setGameMode,
  setShowCreateChallengeModal,
  timerMode,
  setTimerMode,
  showCustomFocusInput,
  setShowCustomFocusInput,
  customFocusInput,
  setCustomFocusInput,
  pomodoroDurationMinutes,
  setPomodoroDurationMinutes,
  pomodoroSeconds,
  setPomodoroSeconds,
  pomodoroRunning,
  setPomodoroRunning,
  pomodoroPhase,
  setPomodoroPhase,
  soundPlaying,
  activeSound,
  handleSelectSound,
  showAudioPopover,
  setShowAudioPopover,
  room,
  viewingPastChallenge,
  setViewingPastChallenge,
  toast
}) {
  if (activeTab !== 'challenge' || stageState !== 'idle') return null;

  return (
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
      <RoomArenaChooser
        isTimerExpanded={isTimerExpanded}
        isMobile={isMobile}
        participantsList={participantsList}
        setGameMode={setGameMode}
        setShowCreateChallengeModal={setShowCreateChallengeModal}
        toast={toast}
      />

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isTimerExpanded ? '0' : '1.75rem',
        alignItems: 'stretch',
        flex: 1,
        minHeight: isTimerExpanded ? '460px' : '340px',
        transition: 'gap 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <RoomFocusTimer
          isTimerExpanded={isTimerExpanded}
          setIsTimerExpanded={setIsTimerExpanded}
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
          toast={toast}
        />

        <RoomRecentSprints
          isTimerExpanded={isTimerExpanded}
          room={room}
          viewingPastChallenge={viewingPastChallenge}
          setViewingPastChallenge={setViewingPastChallenge}
        />
      </div>
    </div>
  );
}
