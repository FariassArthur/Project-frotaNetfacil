import React from 'react';

const changelog = [
  ['1.1 — 2026', [
    'Tabela de cidades agora exibe veículos e motoristas vinculados em colunas dinâmicas',
    'Botão "+ Novo" reseta estado corretamente ao abrir formulário',
    'Detalhes da cidade unificados em tabela combinada de veículos e motoristas',
    'Campos tableOnly no config para colunas de exibição sem edição',
    'Nova rota /api/cidades com LEFT JOIN para dados relacionados',
  ]],
  ['1.0 Beta', [
    'Implementação completa do backend em Node.js/Express com SQLite',
    'Módulos: Veículos, CNHs, Manutenções, Multas, Contratos Seguro, Pagamentos Seguro, Mecânicas, Abastecimentos',
    'Upload e visualização de documentos (PDF)',
    'Autenticação JWT com login de usuário',
    'Tema claro/escuro com persistência em localStorage',
    'CRUD genérico para todas as entidades',
    'Separação de manutenções em preventiva e corretiva',
    'Sistema de permissões por usuário',
    'Interface responsiva com React e Vite',
    'Suporte a Electron para desktop',
  ]],
];

export default function VersionPage() {
  return (
    <div className="version-page">
      <h2>Versão 1.1</h2>
      <p className="version-subtitle">Sistema de Gestão de Frota</p>

      <div className="changelog">
        <h3>Log de Mudanças</h3>
        {changelog.map(([version, items]) => (
          <div key={version} className="changelog-version">
            <h4>{version}</h4>
            <ul>
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
