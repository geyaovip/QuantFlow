#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
APP_ROOT=${QUANTFLOW_APP_ROOT:-/home/ubuntu/apps/quantflow}
ENV_FILE=${QUANTFLOW_ENV_FILE:-$APP_ROOT/shared/.env}
IMAGE_REGISTRY=${QUANTFLOW_IMAGE_REGISTRY:-quantflow}
IMAGE_TAG=${QUANTFLOW_IMAGE_TAG:-$(git -C "$ROOT" rev-parse --short=12 HEAD)}
BUILD_ON_VPS=${QUANTFLOW_BUILD_ON_VPS:-true}
GHCR_USERNAME=${QUANTFLOW_GHCR_USERNAME:-}
GHCR_TOKEN=${QUANTFLOW_GHCR_TOKEN:-}
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

build_release_image() {
  docker image prune --force >/dev/null
  docker build \
    --file "$ROOT/deploy/Dockerfile.release" \
    --tag "$IMAGE_REGISTRY/app:$IMAGE_TAG" \
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

prune_old_release_images() {
  keep_previous=${PREVIOUS_TAG:-}
  docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' \
    | while IFS=' ' read -r image_ref image_id; do
      case "$image_ref" in
        "$IMAGE_REGISTRY"/app:*)
          image_tag=${image_ref#"$IMAGE_REGISTRY/app:"}
          if [ "$image_tag" != "$IMAGE_TAG" ] && [ "$image_tag" != "$keep_previous" ]; then
            docker rmi "$image_id" >/dev/null 2>&1 || true
          fi
          ;;
      esac
    done
  docker builder prune --force --filter "until=168h" >/dev/null
}

ensure_registry_login() {
  case "$IMAGE_REGISTRY" in
    ghcr.io/*)
      if [ -z "$GHCR_TOKEN" ] || [ -z "$GHCR_USERNAME" ]; then
        echo "missing GHCR credentials for private image registry: $IMAGE_REGISTRY" >&2
        exit 1
      fi
      echo "logging in to GHCR as: $GHCR_USERNAME"
      printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin >/dev/null
      trap 'docker logout ghcr.io >/dev/null 2>&1 || true' EXIT
      ;;
  esac
}

if [ "$BUILD_ON_VPS" = "true" ]; then
  build_release_image
else
  ensure_registry_login
  echo "skipping on-host build; pulling release image: $IMAGE_REGISTRY/app:$IMAGE_TAG"
  compose "$IMAGE_TAG" pull ""
fi

compose "$IMAGE_TAG" up "-d --no-recreate postgres"
compose "$IMAGE_TAG" run "--rm api pnpm --filter @quantflow/api db:deploy"
if ! compose "$IMAGE_TAG" up "-d --remove-orphans"; then
  echo "compose up failed" >&2
  if [ -n "$PREVIOUS_TAG" ]; then
    echo "rolling back to: $PREVIOUS_TAG" >&2
    compose "$PREVIOUS_TAG" up "-d --remove-orphans" || true
  fi
  exit 1
fi

if wait_for_url http://127.0.0.1:3100 45 \
  && wait_for_url http://127.0.0.1:3101/admin 45 \
  && wait_for_url http://127.0.0.1:3102/api/v1/health/ready 45; then
  printf '%s\n' "$IMAGE_TAG" > "$CURRENT_TAG_FILE"
  prune_old_release_images
  echo "deployment healthy: $IMAGE_TAG"
  exit 0
fi

echo "deployment health check failed" >&2
if [ -n "$PREVIOUS_TAG" ]; then
  echo "rolling back to: $PREVIOUS_TAG" >&2
  compose "$PREVIOUS_TAG" up "-d --remove-orphans"
fi
exit 1
