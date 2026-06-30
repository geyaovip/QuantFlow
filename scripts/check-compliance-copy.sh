#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"

failed=0

# Acceptance criteria §6.2 forbidden expressions in user-facing UI copy.
FORBIDDEN='稳赚|保本|固定收益|零风险|必涨|百分百胜率|躺赚|无脑赚钱|永不爆仓|稳赚不亏'

scan_paths="
apps/web/app
apps/web/components
apps/admin/app
apps/admin/components
"

is_negated_line() {
  printf '%s\n' "$1" | rg -q '不提供|不承诺|不得|禁止|不是|不含|无|不做|不连接|不执行|不售卖|不代表'
}

for path in $scan_paths; do
  if [ ! -d "$path" ]; then
    continue
  fi
  while IFS= read -r match; do
    [ -n "$match" ] || continue
    if is_negated_line "$match"; then
      continue
    fi
    echo "$match"
    echo "forbidden marketing expression found under $path"
    failed=1
  done <<EOF
$(rg -n -i "$FORBIDDEN" \
  --glob '*.tsx' \
  --glob '*.ts' \
  --glob '!**/*.test.*' \
  --glob '!**/*.spec.*' \
  "$path" || true)
EOF
done

# MVP must not expose affirmative live-trading entry copy.
LIVE_TRADING='开启真实下单|开始真实下单|连接您的交易所|绑定.*API Key|半自动执行|开启自动交易'
while IFS= read -r match; do
  [ -n "$match" ] || continue
  if is_negated_line "$match"; then
    continue
  fi
  echo "$match"
  echo "live-trading entry copy found in MVP UI"
  failed=1
done <<EOF
$(rg -n "$LIVE_TRADING" \
  --glob '*.tsx' \
  --glob '!**/*.test.*' \
  apps/web/app apps/web/components apps/admin/app apps/admin/components || true)
EOF

# Risk disclosure must remain present on key conversion surfaces.
DISCLOSURE='不提供投资建议，不承诺任何收益'
for file in apps/web/app/page.tsx apps/web/app/app/membership/page.tsx; do
  if [ -f "$file" ] && ! rg -q "$DISCLOSURE" "$file" \
    && ! rg -q 'membership-checkout|MarketingFooter' "$file"; then
    echo "missing standard risk disclosure in $file"
    failed=1
  fi
done

if rg -q 'MarketingFooter' apps/web/app/page.tsx; then
  if ! rg -q "$DISCLOSURE" apps/web/components/marketing-footer.tsx; then
    echo "missing standard risk disclosure in marketing footer component"
    failed=1
  fi
fi

if [ "$failed" -ne 0 ]; then
  exit 1
fi

echo "compliance copy checks passed"
