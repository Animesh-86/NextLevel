'use client';

import React from 'react';
import { Zap, Pencil, X } from 'lucide-react';
import RoomChallengeConfigDetails from './RoomChallengeConfigDetails';

export default function RoomCreateChallengeModal({
  showCreateChallengeModal,
  setShowCreateChallengeModal,
  customTitle,
  setCustomTitle,
  titleInputRef,
  handleCreateChallenge,
  // Props for Details
  isMobile,
  gameMode,
  setGameMode,
  negativeMarking,
  setNegativeMarking,
  challengeQCount,
  setChallengeQCount,
  isCustomQCount,
  setIsCustomQCount,
  customQCountInput,
  setCustomQCountInput,
  challengePacing,
  setChallengePacing,
  isCustomPacing,
  setIsCustomPacing,
  customPacingInput,
  setCustomPacingInput,
  challengeStartMode,
  setChallengeStartMode,
  exams,
  selectedExamIds,
  setSelectedExamIds,
  selectedExamId,
  examSearchQuery,
  setExamSearchQuery,
  fileInputRef,
  handleUploadDocumentChange,
  isUploadingDoc,
  pasteProcessing,
  setShowPasteModal,
  creatingChallenge,
  room
}) {
  if (!showCreateChallengeModal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        padding: '1rem'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) setShowCreateChallengeModal(false);
      }}
    >
      <div
        style={{
          width: '96%',
          maxWidth: '940px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '1.85rem 2.25rem',
          borderRadius: '20px',
          animation: 'fadeIn 0.2s ease-out',
          boxSizing: 'border-box',
          background: '#0d1117',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.85)',
          color: '#ffffff'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
            {/* Amber lightning badge */}
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Zap size={22} fill="#f59e0b" style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#9ca3af',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}
              >
                NEW ARENA CHALLENGE
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '2px',
                  maxWidth: '100%'
                }}
              >
                <input
                  ref={titleInputRef}
                  type="text"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  placeholder="IoT week 1 Sprint"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '1.55rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    padding: 0,
                    margin: 0,
                    width: `${Math.max(10, (customTitle || 'IoT week 1 Sprint').length + 1)}ch`,
                    maxWidth: 'calc(100% - 40px)',
                    letterSpacing: '-0.02em'
                  }}
                />
                <button
                  type="button"
                  onClick={() => titleInputRef.current?.focus()}
                  title="Edit sprint name"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)';
                    e.currentTarget.style.borderColor = '#d97706';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  }}
                >
                  <Pencil size={17} />
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateChallengeModal(false)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreateChallenge} style={{ display: 'flex', flexDirection: 'column' }}>
          <RoomChallengeConfigDetails
            isMobile={isMobile}
            gameMode={gameMode}
            setGameMode={setGameMode}
            negativeMarking={negativeMarking}
            setNegativeMarking={setNegativeMarking}
            challengeQCount={challengeQCount}
            setChallengeQCount={setChallengeQCount}
            isCustomQCount={isCustomQCount}
            setIsCustomQCount={setIsCustomQCount}
            customQCountInput={customQCountInput}
            setCustomQCountInput={setCustomQCountInput}
            challengePacing={challengePacing}
            setChallengePacing={setChallengePacing}
            isCustomPacing={isCustomPacing}
            setIsCustomPacing={setIsCustomPacing}
            customPacingInput={customPacingInput}
            setCustomPacingInput={setCustomPacingInput}
            challengeStartMode={challengeStartMode}
            setChallengeStartMode={setChallengeStartMode}
            exams={exams}
            selectedExamIds={selectedExamIds}
            setSelectedExamIds={setSelectedExamIds}
            selectedExamId={selectedExamId}
            setCustomTitle={setCustomTitle}
            examSearchQuery={examSearchQuery}
            setExamSearchQuery={setExamSearchQuery}
            fileInputRef={fileInputRef}
            handleUploadDocumentChange={handleUploadDocumentChange}
            isUploadingDoc={isUploadingDoc}
            pasteProcessing={pasteProcessing}
            setShowPasteModal={setShowPasteModal}
            setShowCreateChallengeModal={setShowCreateChallengeModal}
            creatingChallenge={creatingChallenge}
            room={room}
          />
        </form>
      </div>
    </div>
  );
}
