import React, { useState } from 'react';
import { changePassword } from '../api/client';

export default function Header({ user, token, theme, onToggleTheme, onLogout, currentModule, onToggleMenu, menuOpen }) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    if (newPassword !== confirmPassword) {
      setPassError('As senhas não conferem');
      return;
    }
    if (newPassword.length < 3) {
      setPassError('A nova senha deve ter pelo menos 3 caracteres');
      return;
    }
    setPassLoading(true);
    try {
      const result = await changePassword(currentPassword, newPassword, token);
      if (result.ok) {
        setPassSuccess('Senha alterada com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setShowPasswordModal(false), 1500);
      } else {
        setPassError(result.error || 'Erro ao alterar senha');
      }
    } catch (err) {
      setPassError('Erro ao conectar com o servidor');
    } finally {
      setPassLoading(false);
    }
  };

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
        <button className="btn-change-password" onClick={() => { setShowPasswordModal(true); setPassError(''); setPassSuccess(''); }} title="Alterar Senha">
          🔑
        </button>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Alterar Senha</h3>
            {passError && <div className="module-error">{passError}</div>}
            {passSuccess && <div className="module-success">{passSuccess}</div>}
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Senha Atual</label>
                <input
                  className="form-input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <input
                  className="form-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar Nova Senha</label>
                <input
                  className="form-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={passLoading}>
                  {passLoading ? 'Salvando...' : 'Salvar'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowPasswordModal(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
