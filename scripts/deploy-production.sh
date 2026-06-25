#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
APP_ROOT=${QUANTFLOW_APP_ROOT:-/home/ubuntu/apps/quantflow}
ENV_FILE=${QUANTFLOW_ENV_FILE:-$APP_ROOT/shared/.env}
IMAGE_REGISTRY=${QUANTFLOW_IMAGE_REGISTRY:-quantflow}
IMAGE_TAG=${QUANTFLOW_IMAGE_TAG:-$(git -C "$ROOT" rev-parse --short=12 HEAD)}
CURRENT_TAG_FILE=$APP_ROOT/current-image-tag
COMPOSE_FILE=$ROOT/deploy/compose.production.yml

if [ ! -f "$ENV_FILE" ]; then
  echo "missing production environment file: $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$APP_ROOT"
PREVIOUS_TAG=""
if [ -f "$CURRENT_TAG_FILE" ]; then
  PREVIOUS_TAG=$(cat "$CURRENT_TAG_FILE")
fi

build_image() {
  app=$1
  docker build \
    --file "$ROOT/deploy/Dockerfile" \
    --build-arg "APP=$app" \
    --tag "$IMAGE_REGISTRY/$app:$IMAGE_TAG" \
    "$ROOT"
}

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

for app in web admin api worker; do
  build_image "$app"
done

compose "$IMAGE_TAG" up "-d postgres"
compose "$IMAGE_TAG" run "--rm api pnpm --filter @quantflow/api db:deploy"
compose "$IMAGE_TAG" up "-d --remove-orphans"

if wait_for_url http://127.0.0.1:3100 45 \
  && wait_for_url http://127.0.0.1:3101/admin 45 \
  && wait_for_url http://127.0.0.1:3102/api/v1/health 45; then
  printf '%s\n' "$IMAGE_TAG" > "$CURRENT_TAG_FILE"
  docker image prune --force --filter "until=168h" >/dev/null
  echo "deployment healthy: $IMAGE_TAG"
  exit 0
fi

echo "deployment health check failed" >&2
if [ -n "$PREVIOUS_TAG" ]; then
  echo "rolling back to: $PREVIOUS_TAG" >&2
  compose "$PREVIOUS_TAG" up "-d --remove-orphans"
fi
exit 1
