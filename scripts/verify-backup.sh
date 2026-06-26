#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
BACKUP_DIR=${QUANTFLOW_BACKUP_DIR:-$ROOT/backups}
TARGET_DATABASE_URL=${VERIFY_DATABASE_URL:-${DATABASE_URL:-}}

if [ -z "$TARGET_DATABASE_URL" ]; then
  echo "VERIFY_DATABASE_URL or DATABASE_URL is required" >&2
  exit 1
fi

LATEST_BACKUP=$(ls -1t "$BACKUP_DIR"/quantflow-*.sql.gz 2>/dev/null | head -n 1 || true)
if [ -z "$LATEST_BACKUP" ]; then
  echo "no backup found in $BACKUP_DIR; run scripts/backup-database.sh first" >&2
  exit 1
fi

"$ROOT/scripts/restore-database.sh" "$LATEST_BACKUP" "$TARGET_DATABASE_URL"
psql "$TARGET_DATABASE_URL" -c "SELECT COUNT(*) AS strategy_count FROM strategies;"
echo "backup verification completed: $LATEST_BACKUP"
