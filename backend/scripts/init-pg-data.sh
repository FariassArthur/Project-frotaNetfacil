#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/lib/postgresql/17/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
PGDATA="$BACKEND_DIR/pgdata"
PGPORT="${PGPORT:-5433}"
DB_NAME="${DB_NAME:-frotadb}"
DB_USER="${DB_USER:-postgres}"
DB_PASS="${DB_PASS:-n3tNOC}"

if [ -f "$PGDATA/PG_VERSION" ]; then
  echo "Cluster PostgreSQL já existe em $PGDATA"
else
  echo "Inicializando cluster PostgreSQL em $PGDATA ..."
  echo "$DB_PASS" > "$PGDATA.pwfile"
  initdb -D "$PGDATA" --username="$DB_USER" --pwfile="$PGDATA.pwfile" 2>&1
  rm -f "$PGDATA.pwfile"
  echo "unix_socket_directories = '$PGDATA'" >> "$PGDATA/postgresql.conf"
  echo "port = $PGPORT" >> "$PGDATA/postgresql.conf"
  echo "Cluster inicializado na porta $PGPORT"
fi

pg_ctl -D "$PGDATA" -l "$PGDATA/pg.log" status 2>/dev/null && echo "PostgreSQL já está rodando" || {
  echo "Iniciando PostgreSQL..."
  pg_ctl -D "$PGDATA" -l "$PGDATA/pg.log" start
  sleep 2

  createdb -h 127.0.0.1 -p "$PGPORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null && echo "Banco $DB_NAME criado" || echo "Banco $DB_NAME já existe"
  psql -h 127.0.0.1 -p "$PGPORT" -U "$DB_USER" -d "$DB_NAME" -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS'" 2>/dev/null
  echo "PostgreSQL pronto em 127.0.0.1:$PGPORT"
}
