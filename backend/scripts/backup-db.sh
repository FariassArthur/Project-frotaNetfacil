#!/bin/bash
# Database backup script for GestaoFrota
# Usage: ./scripts/backup-db.sh [backup-dir]
# Default backup dir: ./backups/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${1:-$SCRIPT_DIR/backups}"
DB_PATH="${DB_PATH:-$SCRIPT_DIR/data/gestaofrota.sqlite}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gestaofrota_$TIMESTAMP.sqlite"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database not found at $DB_PATH"
    exit 1
fi

sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
gzip -f "$BACKUP_FILE"

echo "Backup created: ${BACKUP_FILE}.gz"
echo "Size: $(du -h "${BACKUP_FILE}.gz" | cut -f1)"

# Keep only last 30 backups
ls -t "$BACKUP_DIR"/gestaofrota_*.sqlite.gz 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null || true

echo "Old backups cleaned (keeping last 30)"
