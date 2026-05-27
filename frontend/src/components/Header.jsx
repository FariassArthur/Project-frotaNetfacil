import React from 'react';

export default function Header({ user, token, theme, onToggleTheme, onLogout, currentModule, onToggleMenu, menuOpen }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <button className="hamburger" onClick={onToggleMenu} title="Menu">
          <span className={`hamburger-line${menuOpen ? ' open' : ''}`} />
        </button>
        <div>
          <h2 className="header-title">GestaoFrota</h2>
          <p className="header-module">{currentModule}</p>
        </div>
      </div>
      <div className="header-right">
        <span className="header-user">Usuário: {user?.username || 'Admin'}</span>
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
