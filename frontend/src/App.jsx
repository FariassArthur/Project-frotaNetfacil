import React, { useEffect, useState, useCallback } from 'react';
import LoginForm from './components/LoginForm';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import GenericModule from './components/GenericModule';
import VeiculosPage from './components/VeiculosPage';
import SeguradorasPage from './components/SeguradorasPage';
import CidadesPage from './components/CidadesPage';
import VersionPage from './components/VersionPage';
import ConfiguracoesPage from './components/ConfiguracoesPage';
import Dashboard from './components/Dashboard';
import LogsAuditoria from './components/LogsAuditoria';
import { MODULES, getByKey } from './modules/config';
import { fetchList, logout, setOnUnauthorized } from './api/client';

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

  useEffect(() => {
    if (!token) return;
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        handleLogout();
      }, 30 * 60 * 1000);
    };
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timeout);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [token]);

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
  };

  if (!token) {
    if (sessionLoading) {
      return (
        <div className="login-container">
          <div className="login-box" style={{ textAlign: 'center' }}>
            <p>Verificando sessão...</p>
          </div>
        </div>
      );
    }
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  const currentModule = getByKey(currentKey);

  return (
    <div className="app-container">
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
        <main className="app-content">
          {currentKey === 'dashboard' ? (
            <Dashboard token={token} />
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
          ) : (
            <GenericModule
              moduleConfig={currentModule}
              token={token}
              vehicles={vehicles}
              cidades={cidades}
            />
          )}
        </main>
      </div>
      <footer className="app-footer">
        <span>
          © 2026 <strong>Arthur Farias</strong> — Todos os direitos reservados
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


