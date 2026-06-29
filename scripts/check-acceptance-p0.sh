#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"

failed=0

# acceptance-criteria.md §8 blocking checks that can run without a live stack.

for flag in \
  ENABLE_EXCHANGE_CONNECTION \
  ENABLE_SEMI_AUTO_TRADING \
  ENABLE_AUTO_TRADING \
  ENABLE_AUTHOR_PORTAL; do
  if rg -q "^${flag}=true" .env.example; then
    echo ".env.example must keep ${flag}=false for MVP"
    failed=1
  fi
done

if ! rg -q 'enableExchangeConnection: false' packages/contracts/src/index.ts \
  || ! rg -q 'enableSemiAutoTrading: false' packages/contracts/src/index.ts \
  || ! rg -q 'enableAutoTrading: false' packages/contracts/src/index.ts; then
  echo "DEFAULT_FEATURE_FLAGS must keep live-trading capabilities disabled"
  failed=1
fi

if ! rg -q 'ENABLE_EXCHANGE_CONNECTION: disabledFlag' apps/api/src/config/app-config.ts \
  || ! rg -q 'ENABLE_SEMI_AUTO_TRADING: disabledFlag' apps/api/src/config/app-config.ts \
  || ! rg -q 'ENABLE_AUTO_TRADING: disabledFlag' apps/api/src/config/app-config.ts; then
  echo "app-config must reject enabling live-trading env flags"
  failed=1
fi

LIVE_TRADING_ROUTES='exchange-connections|real-orders|semi-auto|auto-trading|place-real-order'
if rg -n -i "$LIVE_TRADING_ROUTES" apps/api/src/modules --glob '*.controller.ts' \
  --glob '!**/*.test.*'; then
  echo "live-trading API routes found in MVP controllers"
  failed=1
fi

for file in \
  apps/web/app/app/paper-trading/page.tsx \
  apps/web/app/app/paper-trading/[accountId]/page.tsx; do
  if [ -f "$file" ] && ! rg -q '模拟' "$file"; then
    echo "paper trading surface must label simulated trading: $file"
    failed=1
  fi
done

if [ -f apps/web/app/app/page.tsx ] && ! rg -q '/app/strategies' apps/web/app/app/page.tsx; then
  echo "apps/web/app/app/page.tsx must redirect to /app/strategies"
  failed=1
fi

BASE_URL=${ACCEPTANCE_API_URL:-${PERF_BASE_URL:-}}
if [ -n "$BASE_URL" ] && command -v curl >/dev/null 2>&1; then
  flags_json=$(curl --silent --fail --max-time 5 "${BASE_URL}/api/v1/system/feature-flags" || true)
  if [ -n "$flags_json" ]; then
    for key in enableExchangeConnection enableSemiAutoTrading enableAutoTrading; do
      if printf '%s' "$flags_json" | rg -q "\"${key}\":true"; then
        echo "feature flag ${key} must remain false at runtime"
        failed=1
      fi
    done
  fi

  check_json() {
    path=$1
    label=$2
    body=$(curl --silent --fail --max-time 8 "${BASE_URL}${path}" || true)
    if [ -z "$body" ]; then
      echo "runtime acceptance failed: ${label} (${path})"
      failed=1
      return
    fi
    printf '%s' "$body" | rg -q '"data"' || {
      echo "runtime acceptance failed: ${label} missing data envelope"
      failed=1
    }
  }

  check_json "/api/v1/membership/plans" "membership plans"
  check_json "/api/v1/strategies?page=1&pageSize=20&period=seven_days&sortBy=returnRate" \
    "strategies period sort"
  check_json "/api/v1/strategies?page=1&pageSize=20&access=free" "strategies free filter"

  strategies_json=$(curl --silent --fail --max-time 8 \
    "${BASE_URL}/api/v1/strategies?page=1&pageSize=1" || true)
  if [ -n "$strategies_json" ]; then
    if ! printf '%s' "$strategies_json" | rg -q '"maxDrawdown"'; then
      echo "strategy list must pair return metrics with maxDrawdown"
      failed=1
    fi
  fi

  redeem_status=$(curl --silent --output /dev/null --write-out '%{http_code}' \
    --max-time 8 \
    -X POST "${BASE_URL}/api/v1/membership/redeem-invite" \
    -H 'content-type: application/json' \
    -d '{}' || true)
  if [ "$redeem_status" != "401" ] && [ "$redeem_status" != "422" ]; then
    echo "invite redeem must reject unauthenticated or invalid body (got ${redeem_status})"
    failed=1
  fi
fi

if [ "$failed" -ne 0 ]; then
  exit 1
fi

echo "P0 acceptance checks passed"
