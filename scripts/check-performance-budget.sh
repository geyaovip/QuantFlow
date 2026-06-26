#!/bin/sh

set -eu

BASE_URL=${PERF_BASE_URL:-http://127.0.0.1:3002}
MAX_SECONDS=${PERF_MAX_SECONDS:-1}

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

elapsed=$(curl --silent --output /dev/null --write-out '%{time_total}' \
  "${BASE_URL}/api/v1/health")

awk -v elapsed="$elapsed" -v max="$MAX_SECONDS" 'BEGIN {
  if (elapsed + 0 > max + 0) {
    printf("health endpoint too slow: %.3fs (max %.3fs)\n", elapsed, max);
    exit 1;
  }
  printf("health endpoint latency ok: %.3fs\n", elapsed);
}'
