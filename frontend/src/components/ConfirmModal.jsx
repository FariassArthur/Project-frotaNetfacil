import { useEffect, useRef } from 'react';

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', danger = false }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{ background: 'rgba(0,0,0,0.5)', animation: 'fadeIn 0.15s ease' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)', animation: 'slideUp 0.2s ease' }}
      >
        <div className="p-5">
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{message}</p>
        </div>
        <div className="flex justify-end gap-3 px-5 py-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
          <button
            className="px-4 py-2 rounded-[12px] font-semibold text-sm border-none cursor-pointer"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            ref={confirmRef}
            className="px-4 py-2 rounded-[12px] font-semibold text-sm border-none cursor-pointer text-white"
            style={{ background: danger ? 'var(--danger)' : 'var(--orange)' }}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
