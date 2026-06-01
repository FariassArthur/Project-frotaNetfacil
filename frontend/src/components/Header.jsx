import React, { useState, useEffect, useRef, useCallback } from 'react';
import { changePassword } from '../api/client';

export default function Header({ user, token, theme, onToggleTheme, onLogout, currentModule, onToggleMenu, menuOpen }) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  const openModal = useCallback(() => {
    setShowPasswordModal(true);
    setPassError('');
    setPassSuccess('');
    setCapsLock(false);
  }, []);

  const closeModal = useCallback(() => {
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setCapsLock(false);
  }, []);

  useEffect(() => {
    if (showPasswordModal) {
      const timer = setTimeout(() => firstInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [showPasswordModal]);

  useEffect(() => {
    if (!showPasswordModal) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showPasswordModal, closeModal]);

  const handleCapsLock = (e) => {
    setCapsLock(e.getModifierState?.('CapsLock') ?? false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    if (newPassword !== confirmPassword) {
      setPassError('As senhas não conferem');
      return;
    }
    if (newPassword.length < 8) {
      setPassError('A nova senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPassError('A nova senha deve conter pelo menos uma letra maiúscula');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setPassError('A nova senha deve conter pelo menos uma letra minúscula');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPassError('A nova senha deve conter pelo menos um número');
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
        setTimeout(() => closeModal(), 1500);
      } else {
        setPassError(result.error || 'Erro ao alterar senha');
      }
    } catch (err) {
      setPassError('Erro ao conectar com o servidor');
    } finally {
      setPassLoading(false);
    }
  };

  const btnBase = 'border-none cursor-pointer rounded-lg text-sm font-semibold transition-colors';
  const inputBase = 'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors';

  return (
    <header className="app-header">
      <div className="header-brand">
        <button className="hamburger" onClick={onToggleMenu} aria-label="Abrir menu" title="Menu">
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
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer text-base transition-transform hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--header-text)' }}
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
          aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer text-base transition-transform hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
          onClick={openModal}
          title="Alterar Senha"
          aria-label="Alterar senha"
        >
          🔑
        </button>
        <button
          className={`${btnBase} px-4 py-2`}
          style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'var(--header-text)' }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
          onClick={onLogout}
        >
          Logout
        </button>
      </div>

      {showPasswordModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Alterar senha"
          ref={modalRef}
          onClick={closeModal}
          onKeyDown={handleCapsLock}
        >
          <div
            className="modal-content p-8 rounded-[18px] w-full max-w-[440px] border"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--border-light)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <h3 className="m-0 mb-6 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Alterar Senha</h3>
            {passError && (
              <div role="alert" className="mb-4 p-2.5 rounded-lg text-sm" style={{
                background: 'var(--orange-bg)',
                color: 'var(--danger)',
                border: '1px solid var(--border-light)',
              }}>
                {passError}
              </div>
            )}
            {passSuccess && (
              <div role="status" className="mb-4 p-2.5 rounded-lg text-sm" style={{
                background: 'rgba(40,167,69,0.1)',
                color: 'var(--success)',
                border: '1px solid rgba(40,167,69,0.2)',
              }}>
                {passSuccess}
              </div>
            )}
            {capsLock && (
              <div role="alert" className="mb-4 p-2.5 rounded-lg text-sm flex items-center gap-2" style={{
                background: 'var(--warning-bg)',
                color: 'var(--warning)',
                border: '1px solid rgba(255,193,7,0.3)',
              }}>
                &#9888; Caps Lock está ativado
              </div>
            )}
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="header-current-password" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Senha Atual</label>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={firstInputRef}
                    id="header-current-password"
                    className={inputBase}
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)',
                      paddingRight: '36px',
                    }}
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    onKeyDown={handleCapsLock}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showCurrent ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      padding: '2px',
                    }}
                    onClick={() => setShowCurrent((v) => !v)}
                  >
                    {showCurrent ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="header-new-password" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Nova Senha</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="header-new-password"
                    className={inputBase}
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)',
                      paddingRight: '36px',
                    }}
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyDown={handleCapsLock}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showNew ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      padding: '2px',
                    }}
                    onClick={() => setShowNew((v) => !v)}
                  >
                    {showNew ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="header-confirm-password" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Confirmar Nova Senha</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="header-confirm-password"
                    className={inputBase}
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)',
                      paddingRight: '36px',
                    }}
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={handleCapsLock}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      padding: '2px',
                    }}
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="px-5 py-2.5 rounded-[12px] font-semibold text-sm text-white border-none cursor-pointer shadow-lg disabled:opacity-60"
                  style={{
                    background: 'var(--orange)',
                    boxShadow: '0 8px 20px rgba(255, 125, 40, 0.2)',
                  }}
                >
                  {passLoading ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-[12px] font-semibold text-sm border cursor-pointer"
                  style={{
                    background: 'var(--orange-bg)',
                    color: 'var(--orange-dark)',
                    borderColor: 'var(--border-light)',
                  }}
                  onClick={closeModal}
                >
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
