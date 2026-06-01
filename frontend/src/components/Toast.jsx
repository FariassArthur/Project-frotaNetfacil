import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';

const ToastContext = createContext(null);

const MAX_TOASTS = 5;

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({ toast, onRemove }) {
  const timerRef = useRef(null);
  const isPaused = useRef(false);

  const startTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    if (!isPaused.current) {
      timerRef.current = setTimeout(() => onRemove(toast.id), 4000);
    }
  }, [toast.id, onRemove]);

  useEffect(() => {
    startTimer();
    return () => clearTimeout(timerRef.current);
  }, [startTimer]);

  const handleMouseEnter = () => {
    isPaused.current = true;
    clearTimeout(timerRef.current);
  };

  const handleMouseLeave = () => {
    isPaused.current = false;
    startTimer();
  };

  const bgColor =
    toast.type === 'success'
      ? 'var(--toast-bg-success)'
      : toast.type === 'error'
        ? 'var(--toast-bg-error)'
        : 'var(--toast-bg-info)';

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="toast-item"
      style={{
        background: bgColor,
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        fontSize: '0.9rem',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '280px',
        maxWidth: '420px',
        animation: 'toast-in 0.3s ease',
        pointerEvents: 'auto',
      }}
    >
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Fechar notificação"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.8)',
          cursor: 'pointer',
          fontSize: '1.1rem',
          padding: '0 2px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        &times;
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });
  }, []);

  const toast = useMemo(() => ({
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  }), [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-label="Notificações"
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
