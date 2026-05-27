import React from 'react';
import { MODULES } from '../modules/config';

function canViewModule(moduleKey, user) {
  if (!user || user.role === 'root') return true;
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
  const visibleModules = MODULES.filter((m) => canViewModule(m.key, user));
  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onToggleMobile} />}
      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        <nav className="sidebar-nav">
          {visibleModules.map((module) => (
            <button
              key={module.key}
              className={`sidebar-btn${currentKey === module.key ? ' active' : ''}`}
              onClick={() => { onModuleSelect(module.key); if (mobileOpen) onToggleMobile(); }}
            >
              {module.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
