'use client';
import { useState, useEffect } from 'react';
import { X, Download, Loader2, FileText, Sparkles } from 'lucide-react';

export default function FileViewer({ file, isOpen, onClose }) {
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && file) {
      loadFileData();
    } else {
      setFileData(null);
    }
  }, [isOpen, file]);

  async function loadFileData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/files/${file._id}`);
      const data = await res.json();
      if (data.success) {
        setFileData(data.data);
      }
    } catch (err) {
      console.error('Failed to load file:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!fileData?.fileData) return;
    const link = document.createElement('a');
    link.href = fileData.fileData;
    link.download = fileData.fileName;
    link.click();
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="file-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="file-viewer-header">
          <div className="file-viewer-title-row">
            <FileText size={18} />
            <h3 className="file-viewer-title">{file?.title || file?.fileName}</h3>
          </div>
          <div className="file-viewer-header-actions">
            <button className="btn btn-secondary" onClick={handleDownload}>
              <Download size={14} /> Download
            </button>
            <button className="icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {file?.summary && (
          <div className="file-viewer-summary">
            <Sparkles size={14} />
            <p>{file.summary}</p>
          </div>
        )}

        <div className="file-viewer-content">
          {loading ? (
            <div className="file-viewer-loading">
              <Loader2 size={32} className="spin" />
              <p>Loading file...</p>
            </div>
          ) : fileData?.fileData ? (
            <>
              {fileData.fileType === 'pdf' ? (
                <iframe
                  className="file-viewer-iframe"
                  src={fileData.fileData}
                  title={fileData.fileName}
                />
              ) : fileData.fileType === 'image' ? (
                <img
                  className="file-viewer-image"
                  src={fileData.fileData}
                  alt={fileData.fileName}
                />
              ) : (
                <div className="file-viewer-unsupported">
                  <FileText size={48} strokeWidth={1} />
                  <p>Preview not available for this file type.</p>
                  <button className="btn btn-primary" onClick={handleDownload}>
                    <Download size={16} /> Download to view
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="file-viewer-unsupported">
              <p>Failed to load file</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
