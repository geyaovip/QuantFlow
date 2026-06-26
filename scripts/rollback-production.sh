#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
APP_ROOT=${QUANTFLOW_APP_ROOT:-/home/ubuntu/apps/quantflow}
ENV_FILE=${QUANTFLOW_ENV_FILE:-$APP_ROOT/shared/.env}
IMAGE_REGISTRY=${QUANTFLOW_IMAGE_REGISTRY:-quantflow}
COMPOSE_FILE=$ROOT/deploy/compose.production.yml
TARGET_TAG=${1:-}

if [ -z "$TARGET_TAG" ]; then
  echo "usage: $0 <image-tag>" >&2
  echo "example: $0 ee1513e" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "missing production environment file: $ENV_FILE" >&2
  exit 1
fi

compose() {
  QUANTFLOW_ENV_FILE="$ENV_FILE" \
  QUANTFLOW_IMAGE_REGISTRY="$IMAGE_REGISTRY" \
  QUANTFLOW_IMAGE_TAG="$1" \
    docker compose --file "$COMPOSE_FILE" "$2" ${3:-}
}

wait_for_url() {
  url=$1
  attempts=${2:-30}
  count=1
  while [ "$count" -le "$attempts" ]; do
    if curl --fail --silent --show-error --max-time 5 "$url" >/dev/null; then
      return 0
    fi
    sleep 2
    count=$((count + 1))
  done
  return 1
}

echo "rolling back QuantFlow to image tag: $TARGET_TAG"
compose "$TARGET_TAG" up "-d --remove-orphans"

if wait_for_url http://127.0.0.1:3100 45 \
  && wait_for_url http://127.0.0.1:3101/admin 45 \
  && wait_for_url http://127.0.0.1:3102/api/v1/health/ready 45; then
  printf '%s\n' "$TARGET_TAG" > "$APP_ROOT/current-image-tag"
  echo "rollback healthy: $TARGET_TAG"
  exit 0
fi

echo "rollback health check failed" >&2
exit 1
