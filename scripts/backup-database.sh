#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
BACKUP_DIR=${QUANTFLOW_BACKUP_DIR:-$ROOT/backups}
RETENTION_DAYS=${QUANTFLOW_BACKUP_RETENTION_DAYS:-7}
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUTPUT_FILE="$BACKUP_DIR/quantflow-$TIMESTAMP.sql.gz"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
pg_dump "$DATABASE_URL" | gzip > "$OUTPUT_FILE"
echo "backup written: $OUTPUT_FILE"

find "$BACKUP_DIR" -name 'quantflow-*.sql.gz' -mtime +"$RETENTION_DAYS" -delete

if [ -n "${R2_BACKUP_ENDPOINT:-}" ] && [ -n "${R2_BACKUP_BUCKET:-}" ]; then
  if ! command -v aws >/dev/null 2>&1; then
    echo "aws CLI is required for R2 upload" >&2
    exit 1
  fi
  AWS_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is required} \
  AWS_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is required} \
    aws s3 cp "$OUTPUT_FILE" "s3://${R2_BACKUP_BUCKET}/quantflow/${TIMESTAMP}.sql.gz" \
      --endpoint-url "$R2_BACKUP_ENDPOINT"
  echo "backup uploaded to R2: quantflow/${TIMESTAMP}.sql.gz"
fi
