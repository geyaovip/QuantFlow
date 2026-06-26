#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
COMPOSE_FILE=${QUANTFLOW_COMPOSE_FILE:-$ROOT/deploy/compose.production.yml}
ENV_FILE=${QUANTFLOW_ENV_FILE:-/home/ubuntu/apps/quantflow/shared/.env}
WAL_DIR=${QUANTFLOW_WAL_ARCHIVE_HOST_DIR:-/home/ubuntu/apps/quantflow/wal-archive}

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "compose file not found: $COMPOSE_FILE" >&2
  exit 1
fi

compose() {
  QUANTFLOW_ENV_FILE="$ENV_FILE" \
    docker compose --file "$COMPOSE_FILE" "$@"
}

mkdir -p "$WAL_DIR"

compose exec -T postgres psql -U "${POSTGRES_USER:-quantflow}" -d "${POSTGRES_DB:-quantflow}" \
  -c "SELECT pg_switch_wal();"

echo "WAL segment rotation triggered."

if [ -n "${R2_BACKUP_ENDPOINT:-}" ] && [ -n "${R2_BACKUP_BUCKET:-}" ]; then
  if ! command -v aws >/dev/null 2>&1; then
    echo "aws CLI is required for R2 WAL upload" >&2
    exit 1
  fi
  AWS_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is required} \
  AWS_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is required} \
    aws s3 sync "$WAL_DIR" "s3://${R2_BACKUP_BUCKET}/quantflow/wal/" \
      --endpoint-url "$R2_BACKUP_ENDPOINT"
  echo "WAL archive synced to R2: quantflow/wal/"
else
  echo "R2 not configured; WAL files retained locally in $WAL_DIR"
fi
