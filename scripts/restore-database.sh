#!/bin/sh

set -eu

if [ "$#" -lt 1 ]; then
  echo "usage: $0 <backup.sql.gz> [target-database-url]" >&2
  exit 1
fi

BACKUP_FILE=$1
TARGET_DATABASE_URL=${2:-${DATABASE_URL:-}}

if [ -z "$TARGET_DATABASE_URL" ]; then
  echo "DATABASE_URL or a target URL argument is required" >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

gunzip -c "$BACKUP_FILE" | psql "$TARGET_DATABASE_URL"
echo "restore completed from: $BACKUP_FILE"
