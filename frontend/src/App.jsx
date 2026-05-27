import React, { useEffect, useState } from 'react';
import LoginForm from './components/LoginForm';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import GenericModule from './components/GenericModule';
import VersionPage from './components/VersionPage';
import ConfiguracoesPage from './components/ConfiguracoesPage';
import Dashboard from './components/Dashboard';
import LogsAuditoria from './components/LogsAuditoria';
import { MODULES, getByKey } from './modules/config';
import { fetchList, logout } from './api/client';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentKey, setCurrentKey] = useState('dashboard');
  const [vehicles, setVehicles] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (token) loadVehicles();
  }, [token]);

  const loadVehicles = async () => {
    try {
      const data = await fetchList('/api/veiculos', token);
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar veículos:', err);
    }
  };

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  const handleLoginSuccess = (newToken, userData) => {
    setToken(newToken);
    setUser(userData || { username: 'admin' });
    setCurrentKey('dashboard');
  };

  const handleLogout = () => {
    logout(token).catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setCurrentKey('dashboard');
  };

  if (!token) {
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
          ) : (
            <GenericModule
              moduleConfig={currentModule}
              token={token}
              vehicles={vehicles}
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


