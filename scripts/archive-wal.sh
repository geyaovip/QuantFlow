#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
. "$ROOT/scripts/lib/production-env.sh"

WAL_DIR=${QUANTFLOW_WAL_ARCHIVE_HOST_DIR:-/home/ubuntu/apps/quantflow/wal-archive}
compose_file=$(production_compose_file)

if [ ! -f "$compose_file" ]; then
  echo "compose file not found: $compose_file" >&2
  exit 1
fi

production_load_backup_env
WAL_DIR=${QUANTFLOW_WAL_ARCHIVE_HOST_DIR:-$WAL_DIR}
mkdir -p "$WAL_DIR"

db_user=${POSTGRES_USER:-quantflow}
db_name=${POSTGRES_DB:-quantflow}

production_compose exec -T postgres psql -U "$db_user" -d "$db_name" \
  -c "SELECT pg_switch_wal();"

echo "WAL segment rotation triggered."

if [ -n "${R2_BACKUP_ENDPOINT:-}" ] && [ -n "${R2_BACKUP_BUCKET:-}" ] && [ -n "${R2_ACCESS_KEY_ID:-}" ] && [ -n "${R2_SECRET_ACCESS_KEY:-}" ]; then
  production_sync_wal_to_r2 "$WAL_DIR"
else
  echo "R2 not configured; WAL files retained locally in $WAL_DIR"
fi
