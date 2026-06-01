import React, { useState, useEffect, useRef } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { login, changePassword } from '../api/client';

export default function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const usernameRef = useRef(null);
  const currentPasswordRef = useRef(null);

  useEffect(() => {
    (showChangePassword ? currentPasswordRef : usernameRef).current?.focus();
  }, [showChangePassword]);

  const handleCapsLock = (e) => {
    setCapsLock(e.getModifierState?.('CapsLock') ?? false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login(username, password);
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user || { username }));
        onLoginSuccess(response.token, response.user);
      } else {
        setError(response.error || 'Falha na autenticação');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }
    setLoading(true);
    try {
      const loginRes = await login(username, currentPassword);
      if (!loginRes.token) {
        setError(loginRes.error || 'Usuário ou senha atual incorretos');
        setLoading(false);
        return;
      }
      const res = await changePassword(currentPassword, newPassword, loginRes.token);
      if (res.ok) {
        setSuccessMsg('Senha alterada com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowChangePassword(false);
          setSuccessMsg('');
        }, 2500);
      } else {
        setError(res.error || 'Erro ao alterar senha');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setShowChangePassword((v) => !v);
    setError('');
    setSuccessMsg('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: 'var(--login-bg)' }}>
      <div className="w-full max-w-[420px] p-12 rounded-[18px] border" style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--border-light)',
        boxShadow: 'var(--card-shadow)',
      }}>
        <h1 className="m-0 mb-2 text-center text-[1.8rem] font-bold" style={{ color: 'var(--orange)' }}>GestaoFrota</h1>
        {!showChangePassword ? (
          <>
            <p className="text-center text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Faça login para continuar</p>
            <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }} htmlFor="username">Usuário</label>
                <input
                  ref={usernameRef}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }} htmlFor="password">Senha</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleCapsLock}
                    autoComplete="current-password"
                    required
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)',
                      paddingRight: '36px',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
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
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
              </div>
              {capsLock && (
                <div className="text-sm p-2.5 rounded-lg flex items-center gap-2" style={{
                  background: 'var(--warning-bg)',
                  color: '#b8860b',
                  border: '1px solid rgba(255,193,7,0.3)',
                }}>
                  &#9888; Caps Lock está ativado
                </div>
              )}
              {error && (
                <div role="alert" className="text-sm p-2.5 rounded-lg" style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(220,53,69,0.2)',
                }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg font-semibold text-sm text-white border-none cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'var(--orange)' }}
                onMouseEnter={(e) => !loading && (e.target.style.background = 'var(--orange-hover)')}
                onMouseLeave={(e) => e.target.style.background = 'var(--orange)'}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              <button
                type="button"
                className="w-full text-xs py-2 rounded-lg border cursor-pointer transition-colors"
                style={{
                  background: 'transparent',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                onClick={toggleMode}
              >
                Alterar senha
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-center text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Altere sua senha</p>
            {successMsg && (
              <div className="text-sm p-2.5 rounded-lg mb-4" style={{
                background: 'var(--success-bg)',
                color: 'var(--success)',
                border: '1px solid rgba(40,167,69,0.2)',
              }}>
                {successMsg}
              </div>
            )}
            <form onSubmit={handleChangePassword} autoComplete="off" className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }} htmlFor="change-username">Usuário</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                  id="change-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }} htmlFor="current-password">Senha atual</label>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={currentPasswordRef}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                    id="current-password"
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    onKeyDown={handleCapsLock}
                    autoComplete="current-password"
                    required
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)',
                      paddingRight: '36px',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }} htmlFor="new-password">Nova senha</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }} htmlFor="confirm-password">Confirmar nova senha</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--input-focus-border)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
                />
              </div>
              {capsLock && (
                <div className="text-sm p-2.5 rounded-lg flex items-center gap-2" style={{
                  background: 'var(--warning-bg)',
                  color: '#b8860b',
                  border: '1px solid rgba(255,193,7,0.3)',
                }}>
                  &#9888; Caps Lock está ativado
                </div>
              )}
              {error && (
                <div role="alert" className="text-sm p-2.5 rounded-lg" style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(220,53,69,0.2)',
                }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg font-semibold text-sm text-white border-none cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'var(--orange)' }}
                onMouseEnter={(e) => !loading && (e.target.style.background = 'var(--orange-hover)')}
                onMouseLeave={(e) => e.target.style.background = 'var(--orange)'}
              >
                {loading ? 'Alterando...' : 'Alterar senha'}
              </button>
              <button
                type="button"
                className="w-full text-xs py-2 rounded-lg border cursor-pointer transition-colors"
                style={{
                  background: 'transparent',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                onClick={toggleMode}
              >
                Voltar ao login
              </button>
            </form>
          </>
        )}
      </div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
        &copy; 2026 <strong style={{ color: 'var(--orange)' }}>Arthur Farias</strong> &mdash;{' '}
        <a
          href="https://github.com/FariassArthur/Project-frotaNetfacil"
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline font-semibold"
          style={{ color: 'var(--orange)' }}
        >
          GitHub
        </a>
      </div>
    </div>
  );
}
