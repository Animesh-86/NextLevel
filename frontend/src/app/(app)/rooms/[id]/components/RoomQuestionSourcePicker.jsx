'use client';

import React from 'react';
import {
  Check,
  Loader2,
  Plus,
  ClipboardPaste
} from 'lucide-react';

export default function RoomQuestionSourcePicker({
  exams = [],
  selectedExamIds = [],
  setSelectedExamIds,
  setCustomTitle,
  examSearchQuery,
  setExamSearchQuery,
  fileInputRef,
  handleUploadDocumentChange,
  isUploadingDoc,
  pasteProcessing,
  setShowPasteModal
}) {
  const selectedDocs = exams.filter(ex => selectedExamIds.includes(ex.id || ex._id));
  const pooledCount = selectedDocs.reduce((acc, cur) => acc + (cur.totalQuestions || 10), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* QUESTION SOURCE Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.65rem'
        }}
      >
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: '#9ca3af',
            letterSpacing: '0.06em',
            textTransform: 'uppercase'
          }}
        >
          QUESTION SOURCE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => {
              const allIds = exams.map(e => e.id || e._id);
              setSelectedExamIds(allIds);
              if (allIds.length === 1) {
                setCustomTitle(`${exams[0]?.title || 'Vault'} Sprint`);
              } else if (allIds.length > 1) {
                setCustomTitle(`Multi-Vault Sprint (${allIds.length} Docs)`);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0
            }}
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setSelectedExamIds([])}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search Box */}
      <input
        type="text"
        placeholder="Search vault documents"
        value={examSearchQuery}
        onChange={e => setExamSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '0.65rem 0.95rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          color: '#ffffff',
          fontSize: '0.84rem',
          boxSizing: 'border-box',
          marginBottom: '10px',
          outline: 'none'
        }}
      />

      {/* Document List */}
      <div
        style={{
          maxHeight: '230px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '2px'
        }}
      >
        {exams.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '0.82rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '10px'
            }}
          >
            No vault documents found. Click below to upload one.
          </div>
        ) : (
          exams
            .filter(
              ex =>
                !examSearchQuery.trim() ||
                (ex.title || '').toLowerCase().includes(examSearchQuery.toLowerCase())
            )
            .map(ex => {
              const examId = ex.id || ex._id;
              const isSelected = selectedExamIds.includes(examId);
              return (
                <div
                  key={examId}
                  onClick={() => {
                    setSelectedExamIds(prev => {
                      const exists = prev.includes(examId);
                      const next = exists ? prev.filter(x => x !== examId) : [...prev, examId];
                      if (next.length === 1) {
                        const single = exams.find(e => (e.id || e._id) === next[0]);
                        if (single) setCustomTitle(single.title + ' Sprint');
                      } else if (next.length > 1) {
                        setCustomTitle(`Multi-Vault Sprint (${next.length} Docs)`);
                      }
                      return next;
                    });
                  }}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isSelected ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1.5px solid #d97706' : '1px solid rgba(255, 255, 255, 0.06)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {/* Amber Checkbox */}
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '5px',
                        background: isSelected ? '#d97706' : 'transparent',
                        border: isSelected ? 'none' : '1.5px solid rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {isSelected && <Check size={13} style={{ color: '#000000', strokeWidth: 3 }} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {ex.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '2px' }}>
                        In vault
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#f59e0b',
                      flexShrink: 0,
                      marginLeft: '12px'
                    }}
                  >
                    {ex.totalQuestions || '10'} Qs
                  </span>
                </div>
              );
            })
        )}
      </div>

      {/* Document Action Buttons: Upload Document + Parse Document */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.pdf,.docx,.txt,.csv"
          onChange={handleUploadDocumentChange}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          disabled={isUploadingDoc}
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '0.75rem 0.85rem',
            borderRadius: '12px',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            background: 'rgba(255, 255, 255, 0.02)',
            color: '#d1d5db',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: isUploadingDoc ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#d97706';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.color = '#d1d5db';
          }}
        >
          {isUploadingDoc ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Plus size={15} />
              <span>Upload document</span>
            </>
          )}
        </button>

        <button
          type="button"
          disabled={pasteProcessing}
          onClick={() => setShowPasteModal(true)}
          style={{
            padding: '0.75rem 0.85rem',
            borderRadius: '12px',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            background: 'rgba(255, 255, 255, 0.02)',
            color: '#d1d5db',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: pasteProcessing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#d97706';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.color = '#d1d5db';
          }}
        >
          {pasteProcessing ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Parsing...</span>
            </>
          ) : (
            <>
              <ClipboardPaste size={15} />
              <span>Parse document</span>
            </>
          )}
        </button>
      </div>

      {/* Summary line */}
      <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#9ca3af', fontWeight: 500 }}>
        {selectedExamIds.length} selected · ~{pooledCount} questions pooled
      </div>
    </div>
  );
}
