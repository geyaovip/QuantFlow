#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
APP_ROOT=${QUANTFLOW_APP_ROOT:-/home/ubuntu/apps/quantflow}
ENV_FILE=${QUANTFLOW_ENV_FILE:-$APP_ROOT/shared/.env}
IMAGE_REGISTRY=${QUANTFLOW_IMAGE_REGISTRY:-ghcr.io/geyaovip/quantflow}
IMAGE_TAG=${QUANTFLOW_IMAGE_TAG:-$(cat "$APP_ROOT/current-image-tag")}
COMPOSE_FILE=${QUANTFLOW_COMPOSE_FILE:-$ROOT/deploy/compose.production.yml}

if [ ! -f "$ENV_FILE" ]; then
  echo "missing production environment file: $ENV_FILE" >&2
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "missing compose file: $COMPOSE_FILE" >&2
  exit 1
fi

echo "running prisma migrate deploy with image ${IMAGE_REGISTRY}/app:${IMAGE_TAG}"

QUANTFLOW_ENV_FILE="$ENV_FILE" \
QUANTFLOW_IMAGE_REGISTRY="$IMAGE_REGISTRY" \
QUANTFLOW_IMAGE_TAG="$IMAGE_TAG" \
  docker compose --file "$COMPOSE_FILE" run --rm api \
  pnpm --filter @quantflow/api db:deploy

echo "production migration complete"
