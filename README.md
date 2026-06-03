# Zênite — Gestão de Frota

Sistema completo de gestão de frotas, migrado do legado WinForms/.NET + SQL Server Compact para stack moderna. Projeto 100% *open source*, auto-contido e preparado para ambientes *desktop* (Electron) e *cloud*.

---

## Funcionalidades

### Módulos de Cadastro (CRUD)
| Módulo | Descrição |
|---|---|
| **Veículos** | Placa, modelo, ano, combustível, cidade, número de frota, status ativo/inativo |
| **Motoristas (CNH)** | Nome, registro, categorias, validade, foto |
| **Manutenções** | Ordem de serviço, classificação (corretiva/preventiva), KM, valor, anexos |
| **Multas** | Local, valor, vencimento, veículo, status de pagamento |
| **Abastecimentos** | Data, quantidade (L), KM, valor, tanque cheio/parcial |
| **Seguros** | Contratos e pagamentos de seguro |
| **Documentos** | Pagamento de documentos (IPVA, licenciamento, etc.) |
| **Pneus** | Controle por veículo: instalados, estoque, KM médio |
| **Viagens** | Saída, retorno, destino, KM inicial/final |
| **Vistorias** | Checklist de saída/retorno por veículo |
| **Ordens de Serviço** | Mão de obra + peças por veículo |
| **Cidades / Mecânicas / Seguradoras** | Tabelas de apoio |
| **Combustíveis / Tipo de Manutenção** | Classificadores |
| **Higienização** | Registro de limpeza de veículos |

### Dashboards & Relatórios
| Tela | Funcionalidade |
|---|---|
| **Dashboard Principal** | Cards resumo, gráficos de pizza (manutenção × combustível × multas), pagamentos em atraso/em dia, tabelas modulares exportáveis |
| **Custo por KM Rodado** | Comparativo entre veículos com indicador colorido (verde/amarelo/vermelho) por R$/km |
| **Consumo de Combustível** | Gráfico de barras km/L, média geral, tabela detalhada |
| **Gastos por Veículo** | Select de veículo + período, gráfico pizza por categoria, detalhamento por tipo, exportação PDF/CSV |
| **Relatório de Custos** | Tabela geral com ordenação por coluna, totalizador, exportação CSV |
| **Multas por Motorista** | Agregação por motorista, total de multas pendentes/pagas, modal de detalhes, CSV |
| **Histórico do Motorista** | Multas, viagens e abastecimentos consolidados por motorista, exportação PDF |
| **Comparativo de Veículos** | Seleciona 2 veículos, exibe side-by-side: km/L, R$/km, manutenção, multas, seguro, higienização, ordens de serviço — com indicador de "Melhor" por campo |
| **Dashboard de Pneus** | Totais, instalados × estoque, gasto por veículo |
| **Calendário de Eventos** | Visão mensal com eventos de manutenção, multas, CNH, seguro, vistorias |
| **Manutenção Preventiva** | Configuração de alertas por veículo + tipo + KM/dias |
| **Logs de Auditoria** | Histórico de ações (criou/atualizou/excluiu) com filtros e paginação |
| **Importar CSV** | Preview e importação de dados em lote para veículos, CNHs, manutenções, multas, abastecimentos, mecânicas e cidades |

### Recursos Técnicos
- **Autenticação JWT** com refresh e blacklist de tokens
- **Controle de sessão** com timeout configurável e aviso prévio
- **Três níveis de permissão**: root, admin, user
- **Alteração de senha** com validação de força (maiúscula, minúscula, número, 8+ caracteres)
- **Upload de anexos** (comprovantes, fotos) via multer
- **Tema claro/escuro** com `prefers-color-scheme` e alternância manual
- **Notificações** de pagamentos em atraso (via Notification API)
- **Exportação CSV** com BOM (UTF-8) em todas as tabelas
- **Exportação PDF** (jsPDF + jspdf-autotable) em relatórios selecionados
- **Scroll infinito / paginação** nas listas
- **Debounce** na busca textual
- **Atalho de teclado**: `Escape` fecha modais e formulários
- **CapsLock warning** nos campos de senha
- **Responsivo**: layout adaptável para desktop e mobile
- **Armadilha de foco (focus trap)** em modais para acessibilidade
- **Suporte a `prefers-reduced-motion`**

---

## Stack

### Backend
| Tecnologia | Versão |
|---|---|
| **Node.js** | 18+ |
| **Express** | 4.19 |
| **SQLite** (via `sqlite3`) | padrão |
| **PostgreSQL** (via `pg`) | opcional |
| **JWT** (`jsonwebtoken`) | autenticação |
| **bcryptjs** | hash de senhas |
| **Multer** | upload de arquivos |
| **Nodemailer** | envio de e-mails |
| **Helmet** | segurança HTTP |
| **express-rate-limit** | rate limiting |
| **Vitest** | testes unitários |

### Frontend
| Tecnologia | Versão |
|---|---|
| **React** | 18 |
| **Vite** | bundler |
| **Tailwind CSS** | estilização utilitária |
| **Recharts** | gráficos |
| **jsPDF** + **jspdf-autotable** | exportação PDF |
| **react-icons** | iconografia |

---

## Estrutura do Projeto

```
gestaofrota/
├── backend/
│   ├── src/
│   │   ├── app.js              # Config Express (middlewares, rotas, CORS)
│   │   ├── server.js           # Entry point (HTTP server)
│   │   ├── config/index.js     # Variáveis de ambiente e constantes
│   │   ├── database/
│   │   │   ├── connection.js        # Pool SQLite (padrão)
│   │   │   ├── connection-pg.js     # Pool PostgreSQL (alternativo)
│   │   │   ├── connection-sqlite.js # Driver SQLite raw
│   │   │   └── schema.js            # Criação de tabelas
│   │   ├── middleware/
│   │   │   ├── auth.js             # Verificação JWT + rate limit
│   │   │   └── upload.js           # Multer config
│   │   ├── routes/
│   │   │   ├── index.js                # Agregador de rotas
│   │   │   ├── auth.js                 # Login / logout
│   │   │   ├── veiculos.js             # CRUD veículos
│   │   │   ├── entityRoutes.js         # CRUD genérico (reutilizável)
│   │   │   ├── dashboard.js            # Dashboard principal
│   │   │   ├── comparativoVeiculos.js  # Comparativo side-by-side
│   │   │   ├── gastos.js               # Gastos por veículo
│   │   │   ├── calendario.js           # Eventos do calendário
│   │   │   ├── motoristaMultas.js      # Multas agregadas por motorista
│   │   │   ├── motoristaHistorico.js   # Histórico consolidado
│   │   │   ├── manutencaoPreventiva.js # Alertas preventivos
│   │   │   ├── ordensServico.js        # OS (mão de obra + peças)
│   │   │   ├── importarCSV.js          # Importação em lote
│   │   │   ├── logs.js                 # Auditoria
│   │   │   ├── usuarios.js             # CRUD de usuários
│   │   │   ├── cidades.js              # Lookup de cidades
│   │   │   ├── lookup.js               # Lookups diversos
│   │   │   └── viagens.js              # CRUD viagens
│   │   └── services/
│   │       ├── auditLog.js         # Log de auditoria
│   │       ├── cron.js             # Tarefas agendadas
│   │       ├── email.js            # Envio de e-mail
│   │       ├── errorHandler.js     # Tratamento global de erros
│   │       └── tokenBlacklist.js   # Invalidação de tokens
│   ├── public/                    # Arquivos estáticos / uploads
│   ├── scripts/                   # Scripts de setup (nginx, pg, etc.)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Roteamento, tema, lazy loading
│   │   ├── api/client.js          # Cliente HTTP centralizado
│   │   ├── components/            # 33 componentes React
│   │   │   ├── GenericModule.jsx  # CRUD genérico (reutilizável)
│   │   │   ├── EntityForm.jsx     # Formulário dinâmico
│   │   │   ├── EntityTable.jsx    # Tabela dinâmica com ordenação/filtro
│   │   │   ├── Dashboard.jsx      # Dashboard principal
│   │   │   ├── Modal.jsx          # Modal reutilizável com focus trap
│   │   │   ├── Toast.jsx          # Sistema de notificações
│   │   │   ├── Skeleton.jsx       # Loading states
│   │   │   ├── Sidebar.jsx        # Navegação por categorias
│   │   │   ├── Header.jsx         # Header com tema/senha/sessão
│   │   │   └── ... (demais páginas)
│   │   ├── modules/config.js      # Configuração dos módulos (539 linhas)
│   │   ├── utils/                 # Utilitários (PDF, tabelas, notificações)
│   │   └── style.css              # Design system completo (variáveis CSS)
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## Como Rodar

### Desenvolvimento

```bash
# 1) Backend
cd backend
npm install
cp .env.example .env   # configure JWT_SECRET e demais variáveis
npm run dev            # Node --watch, reinicia automaticamente

# 2) Frontend (outro terminal)
cd frontend
npm install
npm start              # Vite dev server em http://localhost:5173
```

O backend roda em `http://localhost:3001`. O Vite faz proxy das requisições `/api/*` para o backend.

### Produção

```bash
cd frontend
npm run build                     # Gera dist/
# Sirva dist/ como static files no Express ou nginx
```

### Com Docker / PostgreSQL (opcional)

O backend oferece suporte a PostgreSQL como alternativa ao SQLite. Consulte os scripts em `backend/scripts/` para setup completo (nginx + PostgreSQL + app).

---

## Ambiente Desktop (Electron)

O frontend detecta quando está rodando em Electron (`window.location.protocol === 'file:'`) e ajusta automaticamente a URL base da API para `http://localhost:3001`. Basta iniciar o backend e abrir o frontend buildado no Electron.

---

## Testes

```bash
cd backend
npm test              # Vitest

cd frontend
npm test              # Vitest + jsdom
```

---

## Licença

MIT
