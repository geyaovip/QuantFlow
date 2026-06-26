#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
. "$ROOT/scripts/lib/production-env.sh"

production_load_backup_env
BACKUP_DIR=${QUANTFLOW_BACKUP_DIR:-$ROOT/backups}
RETENTION_DAYS=${QUANTFLOW_BACKUP_RETENTION_DAYS:-7}
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUTPUT_FILE="$BACKUP_DIR/quantflow-$TIMESTAMP.sql.gz"
mkdir -p "$BACKUP_DIR"

if production_uses_compose_backup; then
  db_user=${POSTGRES_USER:-quantflow}
  db_name=${POSTGRES_DB:-quantflow}
  production_compose exec -T postgres pg_dump -U "$db_user" "$db_name" | gzip > "$OUTPUT_FILE"
elif [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "$DATABASE_URL" | gzip > "$OUTPUT_FILE"
else
  echo "DATABASE_URL is required when compose backup is unavailable" >&2
  exit 1
fi

echo "backup written: $OUTPUT_FILE"

find "$BACKUP_DIR" -name 'quantflow-*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
