#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
COMPOSE_FILE=${QUANTFLOW_COMPOSE_FILE:-$ROOT/deploy/compose.production.yml}
ENV_FILE=${QUANTFLOW_ENV_FILE:-/home/ubuntu/apps/quantflow/shared/.env}

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "compose file not found: $COMPOSE_FILE" >&2
  exit 1
fi

compose() {
  QUANTFLOW_ENV_FILE="$ENV_FILE" \
    docker compose --file "$COMPOSE_FILE" "$@"
}

compose exec -T postgres psql -U "${POSTGRES_USER:-quantflow}" -d "${POSTGRES_DB:-quantflow}" \
  -c "SELECT pg_switch_wal();"

echo "WAL segment rotation triggered."
echo "MVP compose does not enable archive_mode; use scripts/backup-database.sh for full backups and scripts/restore-database.sh for drills."
