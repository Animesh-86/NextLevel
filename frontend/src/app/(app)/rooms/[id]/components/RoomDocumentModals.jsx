'use client';

import React from 'react';
import { Upload, ClipboardPaste, X, Loader2 } from 'lucide-react';

export function RoomUploadDocumentModal({
  pendingUpload,
  setPendingUpload,
  uploadName,
  setUploadName,
  confirmDocumentUpload
}) {
  if (!pendingUpload) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) {
          setPendingUpload(null);
          setUploadName('');
        }
      }}
    >
      <div
        style={{
          width: '92%',
          maxWidth: '440px',
          padding: '1.75rem',
          borderRadius: '16px',
          background: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Upload size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              Name this Document
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '2px 0 0 0' }}>
              Give this uploaded document a title for your arena pool
            </p>
          </div>
        </div>

        <input
          type="text"
          value={uploadName}
          onChange={e => setUploadName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && uploadName.trim()) confirmDocumentUpload();
          }}
          placeholder="e.g. IoT Week 1, Operating Systems"
          autoFocus
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            fontSize: '0.92rem',
            fontWeight: 600,
            boxSizing: 'border-box',
            margin: '1rem 0 1.25rem 0',
            outline: 'none'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              setPendingUpload(null);
              setUploadName('');
            }}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#d1d5db',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDocumentUpload}
            disabled={!uploadName.trim()}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: '8px',
              border: 'none',
              background: '#ffffff',
              color: '#000000',
              fontWeight: 800,
              cursor: !uploadName.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            Upload & Parse
          </button>
        </div>
      </div>
    </div>
  );
}

export function RoomPasteQuestionsModal({
  showPasteModal,
  setShowPasteModal,
  pasteProcessing,
  pasteTitle,
  setPasteTitle,
  pasteText,
  setPasteText,
  handlePasteSubmit
}) {
  if (!showPasteModal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)'
      }}
      onClick={e => {
        if (e.target === e.currentTarget && !pasteProcessing) {
          setShowPasteModal(false);
        }
      }}
    >
      <div
        style={{
          width: '92%',
          maxWidth: '640px',
          padding: '1.75rem',
          borderRadius: '16px',
          background: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ClipboardPaste size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Parse Document / Paste Questions
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '2px 0 0 0' }}>
                Paste questions or raw JSON. Single-choice MCQs will be extracted and saved to your vault.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={pasteProcessing}
            onClick={() => setShowPasteModal(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: pasteProcessing ? 'not-allowed' : 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <label
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#d1d5db',
            marginBottom: '6px',
            display: 'block'
          }}
        >
          Document / Test Name
        </label>
        <input
          type="text"
          value={pasteTitle}
          onChange={e => setPasteTitle(e.target.value)}
          placeholder="e.g. Java Collections, Computer Networks, IoT Week 1..."
          disabled={pasteProcessing}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#ffffff',
            fontSize: '0.9rem',
            fontWeight: 600,
            outline: 'none',
            marginBottom: '1rem',
            boxSizing: 'border-box'
          }}
        />

        <label
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#d1d5db',
            marginBottom: '6px',
            display: 'block'
          }}
        >
          Paste Questions or JSON
        </label>
        <textarea
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          disabled={pasteProcessing}
          placeholder={`Example:\n\n1. What is the capital of France?\n   a) London\n   b) Paris (correct)\n   c) Berlin\n   d) Madrid\n\n2. Which protocol operates at the Transport Layer?\n   a) IP\n   b) TCP (correct)\n   c) HTTP\n   d) Ethernet\n\nOr paste JSON format with scenario, options, and answer.`}
          style={{
            width: '100%',
            minHeight: '230px',
            flex: 1,
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            color: '#f3f4f6',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.25rem'
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            {pasteText.trim().length > 0
              ? `${pasteText.trim().split('\n').length} lines · ~${pasteText.length} chars`
              : 'No questions pasted'}
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              disabled={pasteProcessing}
              onClick={() => setShowPasteModal(false)}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#d1d5db',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: pasteProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePasteSubmit}
              disabled={!pasteText.trim() || pasteProcessing}
              style={{
                minWidth: '150px',
                padding: '0.65rem 1.4rem',
                borderRadius: '8px',
                border: 'none',
                background:
                  !pasteText.trim() || pasteProcessing
                    ? 'rgba(245, 158, 11, 0.4)'
                    : '#f59e0b',
                color: '#000000',
                fontSize: '0.88rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: !pasteText.trim() || pasteProcessing ? 'not-allowed' : 'pointer',
                boxShadow:
                  !pasteText.trim() || pasteProcessing
                    ? 'none'
                    : '0 4px 12px rgba(245, 158, 11, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              {pasteProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Parsing with AI...</span>
                </>
              ) : (
                <>
                  <ClipboardPaste size={16} />
                  <span>Parse Questions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
