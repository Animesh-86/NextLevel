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
        if (data.data.fileType === 'pdf' && data.data.fileData.startsWith('data:')) {
          try {
            const base64Data = data.data.fileData.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
              const slice = byteCharacters.slice(offset, offset + 512);
              const byteNumbers = new Array(slice.length);
              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              byteArrays.push(byteArray);
            }
            const blob = new Blob(byteArrays, { type: 'application/pdf' });
            data.data.objectUrl = URL.createObjectURL(blob);
          } catch (e) {
            console.error('Failed to convert base64 to blob', e);
          }
        }
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
                  src={fileData.objectUrl || fileData.fileData}
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
