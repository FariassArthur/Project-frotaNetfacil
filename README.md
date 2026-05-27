# GestaoFrotaJS

Migração do projeto **Gestão de Frotas** (WinForms/.NET + SQL Server Compact) para:

- **Backend:** Node.js + Express (API REST)
- **Banco:** SQLite (portable)
- **Frontend:** React
- **Desktop (opcional na próxima etapa):** empacotar com Electron/Tauri

## Estrutura
- `backend/` - API e persistência
- `frontend/` - UI React
- `electron/` - (planejado) empacotamento do desktop

## Rodar em desenvolvimento

1) Backend:
- `cd backend`
- `npm install`
- `npm run dev`

2) Frontend:
- `cd frontend`
- `npm install`
- `npm start`

## Observações
- Anexos (comprovantes/documentos) serão gravados no filesystem em pastas equivalentes ao legado.
- Nesta primeira versão, a estrutura de projeto e o esqueleto da API/React serão criados para permitir evoluir o CRUD e relatórios.

