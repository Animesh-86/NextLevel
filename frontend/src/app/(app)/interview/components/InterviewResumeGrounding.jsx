'use client';
import { FileText, Upload } from 'lucide-react';

export default function InterviewResumeGrounding({
  resumeMode,
  setResumeMode,
  vaultFiles,
  selectedFileId,
  setSelectedFileId,
  setResumeText,
  uploadedFileName,
  resumeText,
  handleFileUpload,
  uploadingResume,
}) {
  return (
    <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-xs)' }}>
        <FileText size={18} />
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Resume Grounding</h2>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem', lineHeight: 1.4 }}>
        The AI automatically extracts your real project names and metrics to ask tailored technical architecture questions.
      </p>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { mode: 'vault', label: `From Vault (${vaultFiles.length})`, flex: 1 },
          { mode: 'upload', label: 'Upload File', flex: 1 },
          { mode: 'none', label: 'Skip Resume', flex: 0.8 }
        ].map(({ mode, label, flex }) => (
          <button
            key={mode}
            type="button"
            onClick={() => setResumeMode(mode)}
            style={{
              flex,
              padding: '0.65rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              border: resumeMode === mode ? '1px solid var(--accent-border, rgba(245, 166, 35, 0.4))' : '1px solid var(--border-light)',
              background: resumeMode === mode ? 'var(--accent-tint, rgba(245, 166, 35, 0.1))' : 'transparent',
              color: resumeMode === mode ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
          >{label}</button>
        ))}
      </div>

      {resumeMode === 'vault' && (
        <div>
          {vaultFiles.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              No files found in Vault. Switch to Upload File tab to upload your resume.
            </p>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Resume Document
              </label>
              <select
                value={selectedFileId}
                onChange={(e) => { setSelectedFileId(e.target.value); setResumeText(''); }}
                style={{
                  width: '100%', padding: '0.85rem 1rem',
                  background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
                  borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
                }}
              >
                <option value="">-- Choose a document --</option>
                {vaultFiles.map(f => (
                  <option key={f.id || f._id} value={f.id || f._id}>
                    {f.fileName || f.title} ({f.fileType})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {resumeMode === 'upload' && (
        <div>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '1.75rem', border: '1px dashed var(--accent-border, rgba(245, 166, 35, 0.4))', borderRadius: '8px',
            background: 'var(--accent-tint, rgba(245, 166, 35, 0.08))', cursor: 'pointer'
          }}>
            <Upload size={24} style={{ color: 'var(--accent, #f5a623)', marginBottom: '0.5rem' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {uploadedFileName ? uploadedFileName : 'Upload Resume (PDF, DOCX, TXT)'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {resumeText ? '✓ Text extracted & ready for grounding' : 'Text is extracted in memory for AI project verification'}
            </span>
            <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploadingResume} />
          </label>
        </div>
      )}

      {resumeMode === 'none' && (
        <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Standard industry questions will be generated for the role without project grounding.
          </p>
        </div>
      )}
    </section>
  );
}
