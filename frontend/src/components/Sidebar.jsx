import React, { useRef, useCallback, useEffect } from 'react';
import { MODULES } from '../modules/config';

function canViewModule(moduleKey, user) {
  if (!user) return false;
  const mod = MODULES.find((m) => m.key === moduleKey);
  if (mod?.adminOnly) {
    return user.role === 'root' || user.role === 'admin';
  }
  if (user.role === 'root') return true;
  if (!user.permissoes) return true;
  if (user.permissoes === 'all') return true;
  try {
    const perms = typeof user.permissoes === 'string' ? JSON.parse(user.permissoes) : user.permissoes;
    return Array.isArray(perms) && perms.includes(moduleKey);
  } catch (_) {
    return true;
  }
}

export default function Sidebar({ currentKey, onModuleSelect, user, mobileOpen, onToggleMobile }) {
  const navRef = useRef(null);
  const visibleModules = MODULES.filter((m) => !m.sidebarHidden && canViewModule(m.key, user));
  const currentIndex = visibleModules.findIndex((m) => m.key === currentKey);

  useEffect(() => {
    if (mobileOpen) {
      const timer = setTimeout(() => {
        const active = navRef.current?.querySelector('.sidebar-btn.active');
        if (active) active.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mobileOpen]);

  const handleKeyDown = useCallback((e) => {
    const btns = navRef.current?.querySelectorAll('.sidebar-btn');
    if (!btns || btns.length === 0) return;
    const currentIdx = Array.from(btns).indexOf(document.activeElement);
    if (currentIdx < 0) return;

    let nextIdx;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = (currentIdx + 1) % btns.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = (currentIdx - 1 + btns.length) % btns.length;
    } else {
      return;
    }

    btns[nextIdx].focus();
  }, []);

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={onToggleMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}
        aria-label="Navegação principal"
      >
        <button
          className="sidebar-close"
          onClick={onToggleMobile}
          aria-label="Fechar menu"
        >
          &times;
        </button>
        <nav
          ref={navRef}
          className="sidebar-nav"
          role="navigation"
          aria-label="Módulos"
          onKeyDown={handleKeyDown}
        >
          {visibleModules.map((module, idx) => (
            <button
              key={module.key}
              className={`sidebar-btn${currentKey === module.key ? ' active' : ''}`}
              onClick={() => { onModuleSelect(module.key); if (mobileOpen) onToggleMobile(); }}
              aria-current={currentKey === module.key ? 'page' : undefined}
              aria-label={`${module.label}${idx === currentIndex ? ' (ativo)' : ''}`}
            >
              <span className="mr-2" aria-hidden="true">{module.icon || '📄'}</span>
              {module.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
