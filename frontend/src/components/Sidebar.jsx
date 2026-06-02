import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FaFile, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { MODULES, CATEGORIES, CATEGORY_ORDER } from '../modules/config';

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

const STORAGE_KEY = 'sidebarCollapsed';

function loadCollapsed() {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val ? JSON.parse(val) : {};
  } catch {
    return {};
  }
}

function saveCollapsed(collapsed) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
  } catch { }
}

export default function Sidebar({ currentKey, onModuleSelect, user, mobileOpen, onToggleMobile }) {
  const navRef = useRef(null);
  const [collapsed, setCollapsed] = useState(() => loadCollapsed());

  const visibleModules = MODULES.filter((m) => !m.sidebarHidden && canViewModule(m.key, user));

  const modulesByCategory = {};
  for (const m of visibleModules) {
    const cat = m.category || 'outros';
    if (!modulesByCategory[cat]) modulesByCategory[cat] = [];
    modulesByCategory[cat].push(m);
  }

  const orderedCategories = CATEGORY_ORDER.filter((c) => modulesByCategory[c]?.length > 0);

  const allButtons = [];
  for (const catKey of orderedCategories) {
    allButtons.push({ type: 'category', key: catKey });
    if (!collapsed[catKey]) {
      for (const mod of modulesByCategory[catKey]) {
        allButtons.push({ type: 'module', key: mod.key });
      }
    }
  }

  const currentIndex = allButtons.findIndex((b) => b.type === 'module' && b.key === currentKey);

  useEffect(() => {
    if (mobileOpen) {
      const timer = setTimeout(() => {
        const active = navRef.current?.querySelector('.sidebar-btn.active');
        if (active) active.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mobileOpen]);

  const toggleCategory = useCallback((catKey) => {
    setCollapsed((prev) => {
      const next = { ...prev, [catKey]: !prev[catKey] };
      saveCollapsed(next);
      return next;
    });
  }, []);

  const handleKeyDown = useCallback((e) => {
    const btns = navRef.current?.querySelectorAll('.sidebar-btn, .sidebar-group-header');
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
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const btn = btns[currentIdx];
      if (btn.dataset?.category) {
        e.preventDefault();
        toggleCategory(btn.dataset.category);
      }
      return;
    } else {
      return;
    }

    btns[nextIdx].focus();
  }, [toggleCategory]);

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
          {orderedCategories.map((catKey) => {
            const catConfig = CATEGORIES.find((c) => c.key === catKey);
            const catModules = modulesByCategory[catKey];
            const isCollapsed = collapsed[catKey];
            const CatIcon = catConfig?.icon;

            return (
              <div className="sidebar-group" key={catKey}>
                <button
                  className="sidebar-group-header"
                  onClick={() => toggleCategory(catKey)}
                  data-category={catKey}
                  aria-expanded={!isCollapsed}
                  aria-label={`${catConfig?.label || catKey}${isCollapsed ? ' (recolhido)' : ''}`}
                >
                  <span className="sidebar-group-icon" aria-hidden="true">
                    {CatIcon ? <CatIcon /> : <FaFile />}
                  </span>
                  <span className="sidebar-group-label">{catConfig?.label || catKey}</span>
                  <span className="sidebar-group-chevron" aria-hidden="true">
                    {isCollapsed ? <FaChevronRight /> : <FaChevronDown />}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="sidebar-group-items" role="group" aria-label={catConfig?.label}>
                    {catModules.map((module) => (
                      <button
                        key={module.key}
                        className={`sidebar-btn${currentKey === module.key ? ' active' : ''}`}
                        onClick={() => { onModuleSelect(module.key); if (mobileOpen) onToggleMobile(); }}
                        aria-current={currentKey === module.key ? 'page' : undefined}
                        aria-label={module.label}
                      >
                        <span className="mr-2 sidebar-icon" aria-hidden="true">
                          {module.icon ? <module.icon /> : <FaFile />}
                        </span>
                        {module.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
