'use client';

import React from 'react';
import RoomCreateChallengeModal from './RoomCreateChallengeModal';
import { RoomUploadDocumentModal, RoomPasteQuestionsModal } from './RoomDocumentModals';
import {
  RoomPeerPresenceModal,
  RoomSessionGoalModal,
  RoomCloseConfirmModal,
  RoomDisqualifiedModal
} from './RoomSessionModals';
import { RoomSprintResultModal, RoomModesInfoModal } from './RoomPastResultModals';

export default function RoomAllModals(props) {
  const {
    challengeConfig,
    upload,
    roomData,
    proctoring,
    gameplay,
    goalModal,
    closeConfirm,
    isMobile: propIsMobile
  } = props;

  // Resolve grouped or direct
  const cfg = challengeConfig || props;
  const upl = upload || props;
  const rd = roomData || props;
  const pr = proctoring || props;
  const gm = gameplay || props;
  const isMobile = propIsMobile ?? rd?.isMobile ?? props.isMobile ?? false;

  const showGoalModal = goalModal?.showGoalModal ?? props.showGoalModal;
  const setShowGoalModal = goalModal?.setShowGoalModal ?? props.setShowGoalModal;
  const handleSaveGoal = goalModal?.handleSaveGoal || props.handleSaveGoal;
  const goalInput = goalModal?.goalInput ?? props.goalInput;
  const setGoalInput = goalModal?.setGoalInput || props.setGoalInput;

  const showCloseConfirmModal = closeConfirm?.showCloseConfirmModal ?? props.showCloseConfirmModal;
  const setShowCloseConfirmModal = closeConfirm?.setShowCloseConfirmModal ?? props.setShowCloseConfirmModal;
  const handleCloseRoom = closeConfirm?.handleCloseRoom || props.handleCloseRoom;

  return (
    <>
      <RoomCreateChallengeModal
        showCreateChallengeModal={cfg.showCreateChallengeModal}
        setShowCreateChallengeModal={cfg.setShowCreateChallengeModal}
        customTitle={upl.customTitle}
        setCustomTitle={upl.setCustomTitle}
        titleInputRef={cfg.titleInputRef}
        handleCreateChallenge={cfg.handleCreateChallenge}
        isMobile={isMobile}
        gameMode={cfg.gameMode}
        setGameMode={cfg.setGameMode}
        negativeMarking={cfg.negativeMarking}
        setNegativeMarking={cfg.setNegativeMarking}
        challengeQCount={cfg.challengeQCount}
        setChallengeQCount={cfg.setChallengeQCount}
        isCustomQCount={cfg.isCustomQCount}
        setIsCustomQCount={cfg.setIsCustomQCount}
        customQCountInput={cfg.customQCountInput}
        setCustomQCountInput={cfg.setCustomQCountInput}
        challengePacing={cfg.challengePacing}
        setChallengePacing={cfg.setChallengePacing}
        isCustomPacing={cfg.isCustomPacing}
        setIsCustomPacing={cfg.setIsCustomPacing}
        customPacingInput={cfg.customPacingInput}
        setCustomPacingInput={cfg.setCustomPacingInput}
        challengeStartMode={cfg.challengeStartMode}
        setChallengeStartMode={cfg.setChallengeStartMode}
        exams={upl.exams}
        selectedExamIds={upl.selectedExamIds}
        setSelectedExamIds={upl.setSelectedExamIds}
        selectedExamId={upl.selectedExamId}
        examSearchQuery={upl.examSearchQuery}
        setExamSearchQuery={upl.setExamSearchQuery}
        fileInputRef={upl.fileInputRef}
        handleUploadDocumentChange={upl.handleUploadDocumentChange}
        isUploadingDoc={upl.isUploadingDoc}
        pasteProcessing={upl.pasteProcessing}
        setShowPasteModal={upl.setShowPasteModal}
        creatingChallenge={cfg.creatingChallenge}
        room={rd.room}
      />

      <RoomUploadDocumentModal
        pendingUpload={upl.pendingUpload}
        setPendingUpload={upl.setPendingUpload}
        uploadName={upl.uploadName}
        setUploadName={upl.setUploadName}
        confirmDocumentUpload={upl.confirmDocumentUpload}
      />

      <RoomPasteQuestionsModal
        showPasteModal={upl.showPasteModal}
        setShowPasteModal={upl.setShowPasteModal}
        pasteProcessing={upl.pasteProcessing}
        pasteTitle={upl.pasteTitle}
        setPasteTitle={upl.setPasteTitle}
        pasteText={upl.pasteText}
        setPasteText={upl.setPasteText}
        handlePasteSubmit={upl.handlePasteSubmit}
      />

      <RoomPeerPresenceModal
        showPeersModal={props.showPeersModal}
        setShowPeersModal={props.setShowPeersModal}
        participantsList={rd.participantsList || rd.room?.participants}
        currentUserId={rd.currentUserId}
        room={rd.room}
        setGoalInput={setGoalInput}
        myGoal={rd.myGoal}
        setShowGoalModal={setShowGoalModal}
        isHost={rd.isHost}
        handleTransferHost={rd.handleTransferHost}
        handleKickUser={rd.handleKickUser}
      />

      <RoomSprintResultModal
        viewingPastChallenge={cfg.viewingPastChallenge}
        setViewingPastChallenge={cfg.setViewingPastChallenge}
        currentUserId={rd.currentUserId}
        handleDownloadResultImage={props.handleDownloadResultImage}
      />

      <RoomModesInfoModal
        showGameInfoModal={cfg.showGameInfoModal}
        setShowGameInfoModal={cfg.setShowGameInfoModal}
      />

      <RoomSessionGoalModal
        showGoalModal={showGoalModal}
        setShowGoalModal={setShowGoalModal}
        handleSaveGoal={handleSaveGoal}
        goalInput={goalInput}
        setGoalInput={setGoalInput}
      />

      <RoomCloseConfirmModal
        showCloseConfirmModal={showCloseConfirmModal}
        setShowCloseConfirmModal={setShowCloseConfirmModal}
        participantsList={rd.participantsList || rd.room?.participants}
        handleCloseRoom={handleCloseRoom}
      />

      <RoomDisqualifiedModal
        disqualifiedReason={pr.disqualifiedReason}
        setDisqualifiedReason={pr.setDisqualifiedReason}
        proctorWarningsRef={pr.proctorWarningsRef}
        lastInfractionTimeRef={pr.lastInfractionTimeRef}
        setProctorWarnings={pr.setProctorWarnings}
      />
    </>
  );
}
