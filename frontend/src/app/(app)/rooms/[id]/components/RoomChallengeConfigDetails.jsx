'use client';

import React from 'react';
import { Send } from 'lucide-react';
import RoomArenaModePicker from './RoomArenaModePicker';
import RoomQuestionSourcePicker from './RoomQuestionSourcePicker';

export default function RoomChallengeConfigDetails({
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
  exams = [],
  selectedExamIds = [],
  setSelectedExamIds,
  selectedExamId,
  setCustomTitle,
  examSearchQuery,
  setExamSearchQuery,
  fileInputRef,
  handleUploadDocumentChange,
  isUploadingDoc,
  pasteProcessing,
  setShowPasteModal,
  setShowCreateChallengeModal,
  creatingChallenge,
  room
}) {
  const effectiveQ = isCustomQCount ? (parseInt(customQCountInput, 10) || 10) : challengeQCount;
  const effectiveP = isCustomPacing ? (parseInt(customPacingInput, 10) || 30) : challengePacing;
  const estMin = Math.ceil((effectiveQ * effectiveP) / 60);
  const modeLabel =
    gameMode === 'STANDARD'
      ? 'OA Blitz'
      : gameMode === 'BOSS'
      ? 'Co-op Boss'
      : gameMode === 'SURVIVAL'
      ? 'Survival'
      : 'Squad Battle';
  const penaltyText =
    gameMode === 'SURVIVAL' || gameMode === 'BOSS'
      ? 'No penalty'
      : negativeMarking
      ? '-25 penalty'
      : 'No penalty';
  const startText = challengeStartMode === 'instant' ? 'Starts now' : '30s lobby';
  const onlineCount = room?.participants?.length || 1;

  return (
    <>
      {/* 2-Column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.18fr 1fr',
          gap: '2rem',
          alignItems: 'start'
        }}
      >
        {/* ─── LEFT COLUMN: ARENA MODES + PACE ─── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <RoomArenaModePicker
            gameMode={gameMode}
            setGameMode={setGameMode}
            negativeMarking={negativeMarking}
            setNegativeMarking={setNegativeMarking}
          />

          {/* PACE Section */}
          <div style={{ marginTop: '1.4rem' }}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#9ca3af',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '0.75rem'
              }}
            >
              PACE
            </div>

            {/* Questions count presets */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>
                Questions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {[5, 10, 15, 20].map(cnt => {
                  const isSel = !isCustomQCount && challengeQCount === cnt;
                  return (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => {
                        setIsCustomQCount(false);
                        setChallengeQCount(cnt);
                      }}
                      style={{
                        padding: '0.55rem 0',
                        borderRadius: '8px',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        border: isSel ? '1.5px solid #d97706' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSel ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        color: isSel ? '#f59e0b' : '#d1d5db',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cnt}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setIsCustomQCount(true)}
                  style={{
                    padding: '0.55rem 0',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: isCustomQCount ? '1.5px solid #d97706' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isCustomQCount ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    color: isCustomQCount ? '#f59e0b' : '#d1d5db',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Custom
                </button>
              </div>
              {isCustomQCount && (
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={customQCountInput}
                    onChange={e => setCustomQCountInput(e.target.value)}
                    placeholder="10"
                    style={{
                      width: '80px',
                      padding: '0.4rem 0.6rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid #d97706',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}
                  />
                  <span style={{ fontSize: '0.76rem', color: '#9ca3af' }}>questions total</span>
                </div>
              )}
            </div>

            {/* Row with Time per question & Start */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>
                  Time per question
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[30, 45, 60].map(sec => {
                    const isSel = !isCustomPacing && challengePacing === sec;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          setIsCustomPacing(false);
                          setChallengePacing(sec);
                        }}
                        style={{
                          padding: '0.55rem 0',
                          borderRadius: '8px',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          border: isSel ? '1.5px solid #d97706' : '1px solid rgba(255, 255, 255, 0.08)',
                          background: isSel ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          color: isSel ? '#f59e0b' : '#d1d5db',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {sec}s
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setIsCustomPacing(true)}
                    style={{
                      padding: '0.55rem 0',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: isCustomPacing ? '1.5px solid #d97706' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isCustomPacing ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      color: isCustomPacing ? '#f59e0b' : '#d1d5db',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Custom
                  </button>
                </div>
                {isCustomPacing && (
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={customPacingInput}
                      onChange={e => setCustomPacingInput(e.target.value)}
                      placeholder="30"
                      style={{
                        width: '80px',
                        padding: '0.4rem 0.6rem',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid #d97706',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    />
                    <span style={{ fontSize: '0.76rem', color: '#9ca3af' }}>seconds / Q</span>
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>
                  Start
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'instant', label: 'Start now' },
                    { id: 'lobby', label: '30s lobby' }
                  ].map(sm => {
                    const isSel = challengeStartMode === sm.id;
                    return (
                      <button
                        key={sm.id}
                        type="button"
                        onClick={() => setChallengeStartMode(sm.id)}
                        style={{
                          padding: '0.55rem 0',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          border: isSel ? '1.5px solid #d97706' : '1px solid rgba(255, 255, 255, 0.08)',
                          background: isSel ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          color: isSel ? '#f59e0b' : '#d1d5db',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {sm.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: QUESTION SOURCE + VAULT DOCS + UPLOAD ─── */}
        <RoomQuestionSourcePicker
          exams={exams}
          selectedExamIds={selectedExamIds}
          setSelectedExamIds={setSelectedExamIds}
          setCustomTitle={setCustomTitle}
          examSearchQuery={examSearchQuery}
          setExamSearchQuery={setExamSearchQuery}
          fileInputRef={fileInputRef}
          handleUploadDocumentChange={handleUploadDocumentChange}
          isUploadingDoc={isUploadingDoc}
          pasteProcessing={pasteProcessing}
          setShowPasteModal={setShowPasteModal}
        />
      </div>

      {/* ─── BOTTOM ROW: SUMMARY LINE & ACTION BUTTONS ─── */}
      <div
        style={{
          marginTop: '1.75rem',
          padding: '0.9rem 1.4rem',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              fontSize: '2.1rem',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1,
              letterSpacing: '-0.03em'
            }}
          >
            {estMin} min
          </div>
          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '14px' }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#d1d5db' }}>
              {effectiveQ} questions, {effectiveP}s each
            </div>
            <div style={{ fontSize: '0.76rem', color: '#9ca3af', marginTop: '2px' }}>
              {modeLabel} · {penaltyText} · {startText} · {onlineCount} online
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowCreateChallengeModal(false)}
            style={{
              padding: '0.65rem 1.35rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#d1d5db',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creatingChallenge || (selectedExamIds.length === 0 && !selectedExamId)}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: '10px',
              border: 'none',
              background: '#ffffff',
              color: '#000000',
              fontSize: '0.9rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor:
                creatingChallenge || (selectedExamIds.length === 0 && !selectedExamId)
                  ? 'not-allowed'
                  : 'pointer',
              boxShadow: '0 4px 14px rgba(255, 255, 255, 0.2)',
              transition: 'all 0.15s ease'
            }}
          >
            <Send size={16} style={{ color: '#000000' }} />
            <span>{creatingChallenge ? 'Broadcasting...' : 'Broadcast challenge'}</span>
          </button>
        </div>
      </div>
    </>
  );
}
