#!/bin/sh

set -eu

ENV_FILE=${QUANTFLOW_ENV_FILE:-/home/ubuntu/apps/quantflow/shared/.env}

if [ ! -f "$ENV_FILE" ]; then
  echo "missing production environment file: $ENV_FILE" >&2
  exit 1
fi

upsert_env() {
  key=$1
  value=$2
  escaped=$(printf '%s' "$value" | sed 's/[&|]/\\&/g')
  if grep -q "^$key=" "$ENV_FILE"; then
    sed -i "s|^$key=.*|$key=$escaped|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

for key in QUANTFLOW_BACKUP_DIR QUANTFLOW_WAL_ARCHIVE_HOST_DIR; do
  eval "value=\${$key:-}"
  if [ -n "$value" ]; then
    upsert_env "$key" "$value"
  fi
done

chmod 600 "$ENV_FILE"
echo "production backup environment updated: $ENV_FILE"
