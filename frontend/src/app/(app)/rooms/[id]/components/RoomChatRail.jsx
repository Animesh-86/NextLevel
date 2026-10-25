'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import RoomLeaderboard from './RoomLeaderboard';
import RoomChatFeed from './RoomChatFeed';

export default function RoomChatRail(props) {
  const {
    isMobile,
    activeTab,
    isChatCollapsed,
    chat,
    gameplay,
    challengeConfig,
    roomData,
    proctoring,
    pomodoro,
    stageState: propStageState
  } = props;

  // Resolve grouped or direct props
  const stageState = propStageState || gameplay?.stageState || props.stageState;
  const setChatCollapsedManually = chat?.setChatCollapsedManually || props.setChatCollapsedManually;
  const chatWidth = chat?.chatWidth ?? props.chatWidth ?? 360;
  const isDraggingSplitter = chat?.isDraggingSplitter ?? props.isDraggingSplitter ?? false;
  const handleSplitterMouseDown = chat?.handleSplitterMouseDown || props.handleSplitterMouseDown;
  const messages = chat?.messages || props.messages || [];

  // Leaderboard props
  const proctorWarnings = proctoring?.proctorWarnings ?? props.proctorWarnings ?? 0;
  const handleCancelChallenge = challengeConfig?.handleCancelChallenge || props.handleCancelChallenge;
  const userScore = gameplay?.userScore ?? props.userScore ?? 0;
  const qTimeLeft = gameplay?.qTimeLeft ?? props.qTimeLeft ?? 30;
  const room = roomData?.room || props.room;
  const currentLeaderboard = room?.activeChallenge?.leaderboard || props.currentLeaderboard || [];
  const currentUserId = roomData?.currentUserId || props.currentUserId;
  const currentUserName = roomData?.currentUserName || props.currentUserName;
  const currentQIdx = gameplay?.currentQIdx ?? props.currentQIdx ?? 0;
  const gameQuestions = gameplay?.gameQuestions || props.gameQuestions || [];
  const participantsList = roomData?.participantsList || props.participantsList || [];
  const handleAdvanceQuestion = gameplay?.handleAdvanceQuestion || props.handleAdvanceQuestion;
  const selectedOption = gameplay?.selectedOption ?? props.selectedOption ?? null;
  const isEliminated = gameplay?.isEliminated ?? props.isEliminated ?? false;

  // Chat Feed props
  const rightRailTab = chat?.rightRailTab || props.rightRailTab || 'chat';
  const setRightRailTab = chat?.setRightRailTab || props.setRightRailTab;
  const chatBottomRef = chat?.chatBottomRef || props.chatBottomRef;
  const isChallengeActive = stageState === 'live_question' || stageState === 'checkpoint';
  const lobbyCountdown = challengeConfig?.lobbyCountdown ?? props.lobbyCountdown ?? null;
  const handleStartChallenge = gameplay?.handleStartChallenge || props.handleStartChallenge;
  const setIsFullscreenActive = proctoring?.setIsFullscreenActive || props.setIsFullscreenActive;
  const chatInput = chat?.chatInput ?? props.chatInput ?? '';
  const setChatInput = chat?.setChatInput || props.setChatInput;
  const handleSendMessage = chat?.handleSendMessage || props.handleSendMessage;
  const sendingMsg = chat?.sendingMsg ?? props.sendingMsg ?? false;
  const myGoal = roomData?.myGoal || props.myGoal || '';
  const setGoalInput = roomData?.setGoalInput || props.setGoalInput;
  const setShowGoalModal = roomData?.setShowGoalModal || props.setShowGoalModal;
  const pomodoroRunning = pomodoro?.pomodoroRunning ?? props.pomodoroRunning ?? false;
  const pomodoroPhase = pomodoro?.pomodoroPhase || props.pomodoroPhase || 'WORK';
  const isHost = roomData?.isHost ?? props.isHost ?? false;
  const handleTransferHost = roomData?.handleTransferHost || props.handleTransferHost;
  const handleKickUser = roomData?.handleKickUser || props.handleKickUser;

  return (
    <>
      {/* Draggable Divider Splitter */}
      {!isChatCollapsed && !isMobile && (
        <div
          onMouseDown={handleSplitterMouseDown}
          style={{
            width: '8px',
            cursor: 'col-resize',
            background: isDraggingSplitter ? 'var(--brand-primary)' : 'transparent',
            borderRadius: '4px',
            margin: '0 1px',
            transition: 'background 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            userSelect: 'none'
          }}
          title="Drag left/right to resize room chat"
        >
          <div style={{ width: '3px', height: '36px', background: 'var(--border-light)', borderRadius: '2px' }} />
        </div>
      )}

      {/* ─── RIGHT STAGE: LIVE LEADERBOARD (UPPER) + CHAT (LOWER) ─── */}
      <div
        style={{
          display: isMobile && activeTab !== 'chat' ? 'none' : 'flex',
          width: isMobile ? '100%' : (isChatCollapsed ? '46px' : `${Math.max(chatWidth, 340)}px`),
          minWidth: isMobile ? '100%' : (isChatCollapsed ? '46px' : '280px'),
          maxWidth: isMobile ? '100%' : (isChatCollapsed ? '46px' : '580px'),
          flex: isMobile ? '1 1 100%' : 'none',
          height: '100%',
          minHeight: 0,
          flexDirection: 'column',
          gap: (stageState === 'live_question' && !isChatCollapsed) ? '0.75rem' : '0',
          transition: isDraggingSplitter ? 'none' : 'width 0.2s ease'
        }}
      >
        {isChatCollapsed ? (
          <div
            onClick={() => setChatCollapsedManually && setChatCollapsedManually(false)}
            style={{
              height: '100%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '0.5rem 0',
              gap: '8px'
            }}
            title="Click to expand chat"
          >
            <MessageSquare size={16} style={{ color: 'var(--text-muted)' }} />
            <span
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.05em'
              }}
            >
              CHAT ({messages?.length || 0})
            </span>
          </div>
        ) : (
          <>
            <RoomLeaderboard
              stageState={stageState}
              proctorWarnings={proctorWarnings}
              handleCancelChallenge={handleCancelChallenge}
              userScore={userScore}
              questionTimeRemaining={qTimeLeft}
              currentChallengeDuration={room?.activeChallenge?.perQuestionSeconds || 30}
              currentLeaderboard={currentLeaderboard}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              currentQIdx={currentQIdx}
              gameQuestions={gameQuestions}
              participantsList={participantsList}
              handleAdvanceQuestion={handleAdvanceQuestion}
              selectedOption={selectedOption}
              isEliminated={isEliminated}
            />

            <RoomChatFeed
              rightRailTab={rightRailTab}
              setRightRailTab={setRightRailTab}
              stageState={stageState}
              setChatCollapsedManually={setChatCollapsedManually}
              chatBottomRef={chatBottomRef}
              messages={messages}
              room={room}
              isChallengeActive={isChallengeActive}
              lobbyCountdown={lobbyCountdown}
              handleStartChallenge={handleStartChallenge}
              setIsFullscreenActive={setIsFullscreenActive}
              currentUserId={currentUserId}
              chatInput={chatInput}
              setChatInput={setChatInput}
              handleSendMessage={handleSendMessage}
              sendingMsg={sendingMsg}
              myGoal={myGoal}
              setGoalInput={setGoalInput}
              setShowGoalModal={setShowGoalModal}
              participantsList={participantsList}
              pomodoroRunning={pomodoroRunning}
              pomodoroPhase={pomodoroPhase}
              isHost={isHost}
              handleTransferHost={handleTransferHost}
              handleKickUser={handleKickUser}
            />
          </>
        )}
      </div>
    </>
  );
}
