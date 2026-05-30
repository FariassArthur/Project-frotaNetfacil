#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────
#  GestaoFrotaJS — Deploy em produção
#  Uso: bash deploy.sh [ip_ou_dominio]
#  Ex:  bash deploy.sh 10.34.34.10
# ─────────────────────────────────────────────────

SERVER_IP="${1:-10.34.34.10}"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
NODE_ENV="production"

echo "══════════════════════════════════════════════"
echo "  GestaoFrotaJS — Deploy em $SERVER_IP"
echo "══════════════════════════════════════════════"
echo ""

# ── 1. Instalar dependências do backend ──
echo "[1/7] Instalando dependências do backend..."
cd "$BACKEND_DIR"
npm ci --omit=dev 2>&1 | tail -1

# ── 2. Instalar dependências e build do frontend ──
echo "[2/7] Instalando dependências do frontend..."
cd "$FRONTEND_DIR"
npm ci 2>&1 | tail -1

echo "[3/7] Buildando frontend..."
npm run build 2>&1 | tail -3

# ── 3. Configurar .env ──
echo "[4/7] Configurando .env..."
cd "$BACKEND_DIR"

cat > .env <<ENV
# Server
PORT=3001
NODE_ENV=production

# Security (change this!)
JWT_SECRET=9c695866ee8970ff2eee6a83e5830453ed5c851942da081d25191849c076fc538aba220d7398b52a00ca015210e23ac6f36f8f8309547dfa2078ab458d0173b5

# CORS
CORS_ORIGIN=http://$SERVER_IP

# Database (PostgreSQL) — ALTERE para a sua conexão
DATABASE_URL=postgresql://postgres:n3tNOC@127.0.0.1:5432/frotadb
DB_FALLBACK_TO_SQLITE=false
PG_SSL=false

# Admin password (used only on first seed)
ADMIN_PASSWORD=postgres

# File uploads
UPLOADS_BASE=./public/uploads
ENV

echo "       .env criado. Edite DATABASE_URL se necessário."

# ── 4. Criar diretórios ──
echo "[5/7] Criando diretórios..."
mkdir -p "$BACKEND_DIR/data"
mkdir -p "$BACKEND_DIR/public/uploads"

# ── 5. Instalar PM2 e configurar ──
echo "[6/7] Instalando PM2..."
npm install -g pm2 2>&1 | tail -1

cd "$BACKEND_DIR"
pm2 delete gestaofrota-api 2>/dev/null || true

cat > ecosystem.config.cjs <<ECOSYSTEM
module.exports = {
  apps: [{
    name: 'gestaofrota-api',
    script: 'src/server.js',
    cwd: '$BACKEND_DIR',
    env: {
      NODE_ENV: '$NODE_ENV',
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './data/pm2-error.log',
    out_file: './data/pm2-out.log',
    merge_logs: true,
    restart_delay: 3000,
    max_restarts: 10,
  }]
};
ECOSYSTEM

pm2 start ecosystem.config.cjs
pm2 save

echo "[7/7] Configurando nginx..."
if command -v nginx &>/dev/null; then
  sudo tee /etc/nginx/sites-available/gestaofrota > /dev/null <<NGINX
upstream gestaofrota_backend {
    server 127.0.0.1:3001;
    keepalive 64;
}

server {
    listen 80;
    server_name $SERVER_IP;

    root $FRONTEND_DIR/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    location /api/ {
        proxy_pass http://gestaofrota_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 90;
        proxy_send_timeout 90;
        proxy_buffering off;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~ /\. {
        deny all;
    }
}
NGINX

  sudo ln -sf /etc/nginx/sites-available/gestaofrota /etc/nginx/sites-enabled/
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t && sudo systemctl reload nginx
  echo "       nginx configurado e reiniciado."
else
  echo "       nginx não encontrado. Instale com: sudo apt-get install -y nginx"
fi

echo ""
echo "══════════════════════════════════════════════"
echo "  Deploy concluído!"
echo "  Frontend:  http://$SERVER_IP"
echo "  API:       http://$SERVER_IP/api/health"
echo "  PM2:       pm2 status"
echo "══════════════════════════════════════════════"
echo ""
echo "Para ver logs da API:"
echo "  pm2 logs gestaofrota-api"
echo ""
echo "Para reiniciar a API:"
echo "  pm2 restart gestaofrota-api"
