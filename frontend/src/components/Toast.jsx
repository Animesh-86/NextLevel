'use client';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X, Loader2 } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000, id = null) => {
    const toastId = id || (Date.now() + Math.random().toString());
    setToasts((prev) => {
      const existing = prev.find(t => t.id === toastId);
      if (existing) {
        return prev.map(t => t.id === toastId ? { ...t, message, type, duration } : t);
      }
      return [...prev, { id: toastId, message, type, duration }];
    });
    return toastId;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, opts) => addToast(msg, 'success', 4000, opts?.id),
    error: (msg, opts) => addToast(msg, 'error', 4000, opts?.id),
    info: (msg, opts) => addToast(msg, 'info', 4000, opts?.id),
    warning: (msg, opts) => addToast(msg, 'warning', 4000, opts?.id),
    loading: (msg, opts) => addToast(msg, 'loading', 999999, opts?.id),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <style>{`@keyframes spinToast { 100% { transform: rotate(360deg); } }`}</style>
      <div className="toast-container">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const icons = {
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    info: <Info size={18} />,
    warning: <AlertTriangle size={18} />,
    loading: <Loader2 size={18} style={{ animation: 'spinToast 1s linear infinite' }} />,
  };

  return (
    <div className={`toast toast-${toast.type}`} style={{ animation: 'toastSlideIn 0.3s ease-out' }}>
      <span className="toast-icon">{icons[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={() => onRemove(toast.id)}>
        <X size={14} />
      </button>
    </div>
  );
}
