#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
. "$ROOT/scripts/lib/production-env.sh"

production_load_backup_env

if [ -z "${R2_BACKUP_ENDPOINT:-}" ] || [ -z "${R2_BACKUP_BUCKET:-}" ]; then
  echo "R2_BACKUP_ENDPOINT and R2_BACKUP_BUCKET are required" >&2
  exit 1
fi

production_run_aws_s3 s3 ls "s3://${R2_BACKUP_BUCKET}/quantflow/" >/dev/null
echo "R2 backup bucket reachable: ${R2_BACKUP_BUCKET}/quantflow/"
