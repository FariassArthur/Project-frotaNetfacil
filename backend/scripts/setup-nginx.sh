#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$BACKEND_DIR")"
DOMAIN="${1:-10.34.34.10}"

echo "=== Instalando nginx ==="
sudo apt-get install -y -qq nginx

echo "=== Configurando site gestaofrota ==="
sudo tee /etc/nginx/sites-available/gestaofrota > /dev/null <<NGINX
upstream gestaofrota_backend {
    server 127.0.0.1:3001;
    keepalive 64;
}

server {
    listen 80;
    server_name $DOMAIN;

    # Frontend
    root $PROJECT_DIR/frontend/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    # API proxy
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

    # File downloads (autenticados via API)
    location /api/files/ {
        proxy_pass http://gestaofrota_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Static assets com cache
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Negar arquivos ocultos
    location ~ /\. {
        deny all;
    }
}
NGINX

echo "=== Ativando site ==="
sudo ln -sf /etc/nginx/sites-available/gestaofrota /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

echo "=== Testando config ==="
sudo nginx -t

echo "=== Reiniciando nginx ==="
sudo systemctl reload nginx || sudo systemctl restart nginx

echo ""
echo "=== Pronto! Acesse: http://$DOMAIN ==="
echo "    Backend API:  http://$DOMAIN/api/"
echo "    Health check: http://$DOMAIN/api/health"
