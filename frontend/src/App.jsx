import React, { useEffect, useState, useCallback, lazy, Suspense, useRef } from 'react';
import LoginForm from './components/LoginForm';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { MODULES, getByKey } from './modules/config';
import { fetchList, logout, setOnUnauthorized } from './api/client';

const Dashboard = lazy(() => import('./components/Dashboard'));
const GenericModule = lazy(() => import('./components/GenericModule'));
const VeiculosPage = lazy(() => import('./components/VeiculosPage'));
const SeguradorasPage = lazy(() => import('./components/SeguradorasPage'));
const CidadesPage = lazy(() => import('./components/CidadesPage'));
const VersionPage = lazy(() => import('./components/VersionPage'));
const ConfiguracoesPage = lazy(() => import('./components/ConfiguracoesPage'));
const LogsAuditoria = lazy(() => import('./components/LogsAuditoria'));
const ViagensPage = lazy(() => import('./components/ViagensPage'));
const VistoriaChecklist = lazy(() => import('./components/VistoriaChecklist'));
const PneusPage = lazy(() => import('./components/PneusPage'));

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 60 * 1000;

function LoadingFallback() {
  return (
    <div className="flex items-center gap-2 py-12 justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
      <span className="inline-block w-4 h-4 border-2 border-[var(--orange)] border-t-transparent rounded-full animate-[spin_0.6s_linear_infinite]" />
      Carregando...
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [sessionLoading, setSessionLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [currentKey, setCurrentKey] = useState('dashboard');
  const [vehicles, setVehicles] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sessionWarn, setSessionWarn] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const timeoutRef = useRef(null);
  const warnRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (token) {
      loadVehicles();
      loadCidades();
    }
    setOnUnauthorized(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setCurrentKey('dashboard');
    });
  }, [token]);

  useEffect(() => {
    if (!token) {
      setSessionLoading(true);
      fetch('/api/me', { credentials: 'include' })
        .then((r) => r.json())
        .then((data) => {
          if (data.username) {
            setUser({ username: data.username, role: data.role });
            const t = data.token || localStorage.getItem('token');
            if (t) setToken(t);
            else setSessionLoading(false);
          } else {
            setSessionLoading(false);
          }
        })
        .catch((err) => {
          console.error('Erro ao verificar sessão:', err);
          setSessionLoading(false);
        });
    }
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await fetchList('/api/veiculos', token);
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar veículos:', err);
    }
  };

  const loadCidades = async () => {
    try {
      const data = await fetchList('/api/cidades', token);
      setCidades(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar cidades:', err);
    }
  };

  const clearTimers = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearTimeout(warnRef.current);
  }, []);

  const resetTimers = useCallback(() => {
    clearTimers();
    setSessionWarn(false);
    warnRef.current = setTimeout(() => setSessionWarn(true), SESSION_TIMEOUT_MS - WARNING_BEFORE_MS);
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, SESSION_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (!token) return;
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, resetTimers));
    resetTimers();
    return () => {
      clearTimers();
      events.forEach((e) => window.removeEventListener(e, resetTimers));
    };
  }, [token, resetTimers]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const current = getByKey(currentKey);
    document.title = current?.label ? `GestaoFrota — ${current.label}` : 'GestaoFrota';
  }, [currentKey]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  const handleLoginSuccess = (newToken, userData) => {
    setToken(newToken);
    setUser(userData || { username: 'admin' });
    setCurrentKey('dashboard');
    loadVehicles();
    loadCidades();
  };

  const handleLogout = () => {
    logout(token).catch((err) => console.error('Erro ao fazer logout:', err));
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setCurrentKey('dashboard');
    setSessionWarn(false);
  };

  if (!token) {
    if (sessionLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'var(--login-bg)' }}>
          <div className="w-full max-w-[420px] p-12 rounded-[18px] border text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)', boxShadow: 'var(--card-shadow)' }}>
            <p style={{ color: 'var(--text-muted)' }}>Verificando sessão...</p>
          </div>
        </div>
      );
    }
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  const currentModule = getByKey(currentKey);

  return (
    <div className="app-container">
      <a href="#main-content" className="skip-link">Pular para o conteúdo</a>

      {sessionWarn && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10000,
            background: 'var(--warning)',
            color: '#333',
            textAlign: 'center',
            padding: '8px 16px',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <span>Sua sessão expirará em 1 minuto por inatividade.</span>
          <button
            onClick={() => { setSessionWarn(false); resetTimers(); }}
            style={{
              background: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            Continuar sessão
          </button>
        </div>
      )}

      {!isOnline && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10000,
            background: 'var(--danger)',
            color: 'white',
            textAlign: 'center',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          Sem conexão com a internet. Alguns recursos podem não funcionar.
        </div>
      )}

      <Header
        user={user}
        token={token}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        currentModule={currentModule?.label}
        onToggleMenu={() => setMobileSidebarOpen((v) => !v)}
        menuOpen={mobileSidebarOpen}
      />
      <div className="app-main">
        <Sidebar
          currentKey={currentKey}
          onModuleSelect={setCurrentKey}
          user={user}
          mobileOpen={mobileSidebarOpen}
          onToggleMobile={() => setMobileSidebarOpen(false)}
        />
        <main className="app-content" id="main-content" ref={contentRef}>
          <Suspense fallback={<LoadingFallback />}>
            {currentKey === 'dashboard' ? (
              <Dashboard token={token} onModuleSelect={setCurrentKey} />
            ) : currentKey === 'versao' ? (
              <VersionPage />
            ) : currentKey === 'logs-auditoria' ? (
              <LogsAuditoria token={token} user={user} />
            ) : currentKey === 'configuracoes' ? (
              <ConfiguracoesPage token={token} user={user} />
            ) : currentKey === 'veiculos' ? (
              <VeiculosPage
                moduleConfig={currentModule}
                token={token}
                vehicles={vehicles}
                cidades={cidades}
              />
            ) : currentKey === 'seguradoras' ? (
              <SeguradorasPage
                moduleConfig={currentModule}
                token={token}
                vehicles={vehicles}
                cidades={cidades}
              />
            ) : currentKey === 'cidades' ? (
              <CidadesPage
                moduleConfig={currentModule}
                token={token}
                vehicles={vehicles}
                cidades={cidades}
              />
            ) : currentKey === 'viagens' ? (
              <ViagensPage
                token={token}
                vehicles={vehicles}
              />
            ) : currentKey === 'vistorias' ? (
              <VistoriaChecklist
                token={token}
              />
            ) : currentKey === 'pneus' ? (
              <PneusPage
                token={token}
              />
            ) : (
              <GenericModule
                moduleConfig={currentModule}
                token={token}
                vehicles={vehicles}
                cidades={cidades}
              />
            )}
          </Suspense>
        </main>
      </div>
      <footer className="app-footer">
        <span>
          &copy; 2026 <strong>Arthur Farias</strong> &mdash; Todos os direitos reservados
        </span>
        <a
          href="https://github.com/FariassArthur/Project-frotaNetfacil"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
