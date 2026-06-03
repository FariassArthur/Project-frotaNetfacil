import React from 'react';

const changelog = [
  ['1.1.2 — 2026', [
    'Comparativo de veículos: km/L ponderado, km_percorrido, R$/km, ordens de serviço, indicador "Melhor" por campo, barras visuais, formatação pt-BR',
    'Rebranding: Zênite — cores, logo, e-mail, CSV, logs',
    'Suporte a prefers-color-scheme (tema escuro automático do sistema)',
    'Modal reutilizável com focus trap e animação fade/slide',
    'Dashboard: modais de pagamento refatorados com Modal; aviso de exportação acima de 5.000 linhas',
    'Destaque visual de veículos ativos/inativos na tabela (borda verde/opacidade)',
    'Correção: rota /api/veiculos/comparativo registrada antes de /api/veiculos/:placa (404)',
    'Correção: coluna tanque_cheio faltando no SELECT de gastos',
    'Correção: query duplicada de km/L no dashboard',
    'Correção: ternário betterVal (nunca retornava -1)',
    'Correção: memory leak URL.createObjectURL em EntityForm',
    'Correção: vazamento de arquivo temporário no importarCSV (try/finally)',
    'Tratamento de erros: ConsumoVeiculos, CustoKm, MotoristaMultas, ComparativoVeiculos com feedback visual',
    'console.error em todos os catches silenciosos (CalendarioEventos, PneusDashboard, RelatorioCustos, LogsAuditoria, etc.)',
    'Cleanup de setTimeout em Header, LoginForm e EntityForm (segurança em unmount)',
    'Migração de fetch() cru para fetchList() compartilhado em 7 componentes',
    'UsuariosPage refatorada para usar api client compartilhado',
    'ImportarCSV com apiBase para compatibilidade Electron',
    'Empty states em CustoKm, ConsumoVeiculos, MotoristaMultas, HistoricoMotoristaConsolidado',
    'Acessibilidade: aria-label em botões de ícone (Modal, Calendario, GenericModule)',
    'prefers-reduced-motion: animações respeitam preferência do usuário',
    'Remoção de imports não utilizados em EntityTable, config.js, App.jsx',
  ]],
  ['1.1.1 — 2026', [
    'Alerta de manutenção preventiva no Dashboard com KM e data',
    'Diário de bordo: Check-in/Check-out de viagens com km e motorista',
    'Análise de consumo (km/L) na tela de gastos do veículo',
    'Vínculo de multas com motorista (motorista_id)',
    'Mudança de senha na tela de login',
    'Ícones substituídos por react-icons (neutros)',
    'Correção de bugs: ordenamento de rotas, parseInt sem radix, falsy check em km=0',
    'Segurança: requireRole em DELETE de viagens e manutenção preventiva',
  ]],
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
    <div className="p-6" style={{ background: 'var(--bg-primary)' }}>
      <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Versão 1.1.2</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Zênite — Sistema de Gestão de Frota</p>

      <div className="rounded-xl border p-6" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
        <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Log de Mudanças</h3>
        {changelog.map(([version, items]) => (
          <div key={version} className="mb-4">
            <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--orange)' }}>{version}</h4>
            <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
              {items.map((item, i) => (
                <li key={i} className="ml-4 list-disc">{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
