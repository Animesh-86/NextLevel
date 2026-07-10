'use client';

import { useState, useEffect } from 'react';
import { X, Download, Loader2, FileText } from 'lucide-react';

export default function FileViewer({ file, isOpen, onClose }) {
  const [openFiles, setOpenFiles] = useState([]);
  const [filesData, setFilesData] = useState({});
  const [loadingFiles, setLoadingFiles] = useState({});

  // Sync prop changes into the side-by-side array
  useEffect(() => {
    if (!isOpen) {
      setOpenFiles([]);
      setFilesData({});
      return;
    }
    
    if (file) {
      const fId = file.id || file._id;
      if (fId && !openFiles.some(f => (f.id || f._id) === fId)) {
        setOpenFiles(prev => [...prev, file]);
      }
    }
  }, [isOpen, file]);

  // Load metadata for any open files that aren't loaded yet
  useEffect(() => {
    if (!isOpen) return;
    openFiles.forEach(f => {
      const fId = f.id || f._id;
      if (fId && !filesData[fId] && !loadingFiles[fId]) {
        fetchFileData(f);
      }
    });
  }, [openFiles, filesData, loadingFiles, isOpen]);

  async function fetchFileData(f) {
    const fId = f.id || f._id;
    setLoadingFiles(prev => ({ ...prev, [fId]: true }));
    try {
      const res = await fetch(`/api/files/${fId}`);
      const data = await res.json();
      if (data.success) {
        let fileObj = data.data;
        // Direct stream URL from the backend download endpoint (with inline=true)
        fileObj.objectUrl = `/api/files/${fId}/download?inline=true`;
        setFilesData(prev => ({ ...prev, [fId]: fileObj }));
      }
    } catch (err) {
      console.error(`Failed to load file ${fId}:`, err);
    } finally {
      setLoadingFiles(prev => ({ ...prev, [fId]: false }));
    }
  }

  const handleCloseFile = (fId) => {
    const remaining = openFiles.filter(f => (f.id || f._id) !== fId);
    setOpenFiles(remaining);
    
    if (remaining.length === 0) {
      onClose(); // Close viewer when all files are closed
    }
  };

  const handleCloseAll = () => {
    setOpenFiles([]);
    setFilesData({});
    onClose();
  };

  const handleDownload = (fId) => {
    const link = document.createElement('a');
    link.href = `/api/files/${fId}/download`;
    // We fetch metadata for name
    const fData = filesData[fId];
    link.download = fData?.fileName || 'download';
    link.click();
  };

  if (!isOpen || openFiles.length === 0) return null;

  return (
    <div className="dialog-overlay" onClick={handleCloseAll} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div 
        className="file-viewer-workspace" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          width: '95vw', 
          height: '90vh', 
          maxWidth: '1800px', 
          maxHeight: '1000px',
          background: 'var(--bg-surface-dark)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Workspace Main Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '1rem 1.5rem', 
          borderBottom: '1px solid var(--border-light)',
          background: 'rgba(255,255,255,0.01)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--brand)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              File Comparison Workspace ({openFiles.length} open)
            </h3>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={handleCloseAll}
            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
          >
            Close Workspace
          </button>
        </div>

        {/* Side-by-Side Flex Panels */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'row', 
          overflowX: 'auto', 
          background: 'rgba(0,0,0,0.1)',
          gap: '1px' // clean separation line
        }}>
          {openFiles.map((f, index) => {
            const fId = f.id || f._id;
            const fData = filesData[fId];
            const isLoading = loadingFiles[fId];
            
            return (
              <div 
                key={fId} 
                style={{ 
                  flex: '1 1 0%', 
                  minWidth: '380px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  background: 'var(--bg-surface)',
                  borderRight: index < openFiles.length - 1 ? '1px solid var(--border-light)' : 'none',
                  height: '100%'
                }}
              >
                {/* Column Header */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '0.75rem 1rem', 
                  borderBottom: '1px solid var(--border-light)',
                  background: 'rgba(255,255,255,0.02)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', flex: 1, marginRight: '10px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.title || f.fileName}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {f.fileType || 'file'} • {f.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button className="icon-btn" onClick={() => handleDownload(fId)} title="Download">
                      <Download size={14} />
                    </button>
                    <button className="icon-btn" onClick={() => handleCloseFile(fId)} title="Close file">
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Column Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: '#0e0e0e' }}>
                  {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px' }}>
                      <Loader2 size={28} className="spin" style={{ color: 'var(--brand)' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading file...</span>
                    </div>
                  ) : fData?.objectUrl ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      {fData.fileType === 'pdf' ? (
                        <iframe
                          style={{ border: 'none', width: '100%', height: '100%', flex: 1, background: '#ffffff' }}
                          src={fData.objectUrl}
                          title={fData.fileName}
                        />
                      ) : fData.fileType === 'image' ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflow: 'auto' }}>
                          <img
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
                            src={fData.objectUrl}
                            alt={fData.fileName}
                          />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px', textAlign: 'center', padding: '2rem' }}>
                          <FileText size={40} strokeWidth={1} />
                          <span style={{ fontSize: '0.85rem' }}>Preview not available.</span>
                          <button className="btn btn-secondary" onClick={() => handleDownload(fId)} style={{ marginTop: '5px' }}>
                            <Download size={14} style={{ marginRight: '5px' }} /> Download to view
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--urgency-critical)', fontSize: '0.85rem' }}>
                      Failed to load file.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
