import { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, children, wide }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const modal = modalRef.current;
    if (!modal) return;

    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const trap = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', trap);
    first?.focus();

    return () => document.removeEventListener('keydown', trap);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}
      style={{ background: 'rgba(0,0,0,0.5)', animation: 'fadeIn 0.15s ease' }} onClick={onClose}>
      <div ref={modalRef} className={`w-full ${wide ? 'max-w-5xl' : 'max-w-lg'} max-h-[80vh] flex flex-col rounded-xl border overflow-hidden`}
        onClick={(e) => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)', animation: 'slideUp 0.2s ease' }}>
        {title && (
          <div className="flex items-center justify-between p-4 border-b shrink-0" style={{ borderColor: 'var(--border-light)' }}>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <button className="bg-transparent border-none cursor-pointer text-xl font-bold p-1 leading-none" style={{ color: 'var(--text-muted)' }} onClick={onClose} aria-label="Fechar">✕</button>
          </div>
        )}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
