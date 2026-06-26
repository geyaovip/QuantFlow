#!/bin/sh

set -eu

BASE_URL=${PERF_BASE_URL:-http://127.0.0.1:3002}
MAX_HEALTH_SECONDS=${PERF_MAX_SECONDS:-1}
MAX_READY_SECONDS=${PERF_MAX_READY_SECONDS:-2}
MAX_LIST_SECONDS=${PERF_MAX_LIST_SECONDS:-3}

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

check_latency() {
  path=$1
  max=$2
  label=$3
  elapsed=$(curl --silent --output /dev/null --write-out '%{time_total}' \
    "${BASE_URL}${path}")
  awk -v elapsed="$elapsed" -v max="$max" -v label="$label" 'BEGIN {
    if (elapsed + 0 > max + 0) {
      printf("%s too slow: %.3fs (max %.3fs)\n", label, elapsed, max);
      exit 1;
    }
    printf("%s latency ok: %.3fs\n", label, elapsed);
  }'
}

check_latency "/api/v1/health" "$MAX_HEALTH_SECONDS" "health"
check_latency "/api/v1/health/ready" "$MAX_READY_SECONDS" "health-ready"
check_latency "/api/v1/system/feature-flags" "$MAX_HEALTH_SECONDS" "feature-flags"
check_latency "/api/v1/strategies?pageSize=20" "$MAX_LIST_SECONDS" "strategies-list"
