#!/bin/sh

# Safe helpers for production backup scripts. Do not `source` shared/.env directly:
# values like AUTH_EMAIL_FROM=QuantFlow <email> break /bin/sh.

set -eu

production_env_file() {
  printf '%s\n' "${QUANTFLOW_ENV_FILE:-/home/ubuntu/apps/quantflow/shared/.env}"
}

production_env_get() {
  key=$1
  file=$(production_env_file)
  if [ ! -f "$file" ]; then
    return 1
  fi
  awk -F= -v key="$key" '
    $0 ~ "^[[:space:]]*#" { next }
    $1 == key {
      value = substr($0, index($0, "=") + 1)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
      if (value ~ /^".*"$/) {
        value = substr(value, 2, length(value) - 2)
      }
      print value
      found = 1
      exit
    }
    END { if (!found) exit 1 }
  ' "$file"
}

production_load_backup_env() {
  file=$(production_env_file)
  if [ ! -f "$file" ]; then
    return 0
  fi
  for key in \
    POSTGRES_DB \
    POSTGRES_USER \
    POSTGRES_PASSWORD \
    QUANTFLOW_BACKUP_DIR \
    QUANTFLOW_WAL_ARCHIVE_HOST_DIR; do
    if value=$(production_env_get "$key" 2>/dev/null) && [ -n "$value" ]; then
      export "$key=$value"
    fi
  done
}

production_compose_file() {
  root=${QUANTFLOW_APP_ROOT:-/home/ubuntu/apps/quantflow/current}
  printf '%s\n' "${QUANTFLOW_COMPOSE_FILE:-$root/deploy/compose.production.yml}"
}

production_image_tag() {
  if [ -n "${QUANTFLOW_IMAGE_TAG:-}" ]; then
    printf '%s\n' "$QUANTFLOW_IMAGE_TAG"
    return 0
  fi
  tag_file=${QUANTFLOW_CURRENT_TAG_FILE:-/home/ubuntu/apps/quantflow/current-image-tag}
  if [ -f "$tag_file" ]; then
    cat "$tag_file"
    return 0
  fi
  return 1
}

production_compose() {
  compose_file=$(production_compose_file)
  env_file=$(production_env_file)
  image_registry=${QUANTFLOW_IMAGE_REGISTRY:-ghcr.io/geyaovip/quantflow}
  image_tag=$(production_image_tag)

  QUANTFLOW_ENV_FILE="$env_file" \
  QUANTFLOW_IMAGE_REGISTRY="$image_registry" \
  QUANTFLOW_IMAGE_TAG="$image_tag" \
    docker compose --file "$compose_file" "$@"
}

production_uses_compose_backup() {
  if [ "${QUANTFLOW_USE_COMPOSE_BACKUP:-}" = "true" ]; then
    return 0
  fi
  if [ -f "$(production_compose_file)" ] && [ -f "$(production_env_file)" ]; then
    return 0
  fi
  return 1
}
