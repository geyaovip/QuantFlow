#!/bin/sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"

failed=0
files=$(rg --files -g '*.md' -g '*.mdc')

while IFS=: read -r file target; do
  case "$target" in
    http*|mailto:*|'') continue ;;
  esac
  target=${target%%#*}
  target=${target#<}
  target=${target%>}
  if [ ! -e "$(dirname "$file")/$target" ]; then
    echo "broken link: $file -> $target"
    failed=1
  fi
done <<EOF
$(perl -ne 'while (/\[[^]]*\]\(([^)]+)\)/g) { print "$ARGV:$1\n" }' $files)
EOF

for file in $files; do
  fences=$(rg -c '^```' "$file" || true)
  if [ $((fences % 2)) -ne 0 ]; then
    echo "unbalanced code fence: $file"
    failed=1
  fi
done

if rg -n '[[:blank:]]+$' $files; then
  echo "trailing whitespace found"
  failed=1
fi

if rg -n 'documentation-review\.md|prd-adjustments\.md' $files; then
  echo "reference to removed documentation found"
  failed=1
fi

if [ ! -f docs/project/implementation-status.md ] || [ ! -f docs/dev/task-router.md ]; then
  echo "missing AI execution documents"
  failed=1
fi

if ! rg -n 'implementation-status\.md' AGENTS.md docs/README.md docs/dev/ai-development-workflow.md >/dev/null; then
  echo "implementation-status.md is not linked from agent entry documents"
  failed=1
fi

root_version=$(sed -n 's/.*文档基线.*`\(docs-v[0-9.]*\)`.*/\1/p' README.md | head -n 1)
index_version=$(sed -n 's/.*文档基线为 `\(docs-v[0-9.]*\)`.*/\1/p' docs/README.md | head -n 1)
latest_version=$(rg -o 'docs-v[0-9]+\.[0-9]+\.[0-9]+' docs/project/versioning-and-changelog.md | head -n 1)

if [ -z "$root_version" ] || [ "$root_version" != "$index_version" ] || [ "$root_version" != "$latest_version" ]; then
  echo "documentation version mismatch: root=$root_version index=$index_version latest=$latest_version"
  failed=1
fi

current_docs=$(printf '%s\n' "$files" | rg -v 'docs/project/versioning-and-changelog\.md')

if rg -n 'Launch App|可默认进入|可以默认进入|默认重定向或' $current_docs; then
  echo "ambiguous or non-Chinese current navigation copy found"
  failed=1
fi

p0_block=$(sed -n '/### 3\.1 P0/,/### 3\.2 P1/p' docs/product/feature-breakdown.md)
if printf '%s\n' "$p0_block" | rg -n '行情中心|内容管理'; then
  echo "P1 feature leaked into P0 feature list"
  failed=1
fi

if rg -n 'past_due|cancel_at_period_end|refunded|manual/test/provider' docs/architecture/database-schema.md; then
  echo "payment-derived subscription model found while production payments are disabled"
  failed=1
fi

if rg -n '会员购买|购买前' AGENTS.md docs/api docs/design docs/dev docs/product docs/risk docs/testing; then
  echo "purchase copy found while MVP online payments are disabled"
  failed=1
fi

if rg -n '分区或 TimescaleDB' docs/dev docs/architecture; then
  echo "TimescaleDB ambiguity conflicts with the PostgreSQL-only MVP baseline"
  failed=1
fi

if rg -n 'AWS|ECS Fargate|RDS PostgreSQL|CloudFront|Secrets Manager|CloudWatch' \
  README.md AGENTS.md docs/api docs/architecture docs/design docs/dev docs/product docs/risk docs/security docs/strategy docs/testing; then
  echo "superseded AWS deployment reference found in current baseline"
  failed=1
fi

if [ ! -f docs/dev/deployment.md ] || [ ! -f deploy/cloudflared-ingress.example.yml ]; then
  echo "self-hosted Cloudflare deployment specification is incomplete"
  failed=1
fi

for asset in \
  assets/brand/svg/favicon.svg \
  assets/brand/svg/quantflow-mark.svg \
  assets/brand/svg/quantflow-mark-white.svg \
  assets/brand/svg/quantflow-lockup-on-light.svg \
  assets/brand/svg/quantflow-lockup-on-dark.svg \
  assets/brand/svg/quantflow-admin-lockup-on-light.svg \
  assets/brand/png/favicon-32.png \
  assets/brand/png/apple-touch-icon-180.png \
  assets/brand/png/pwa-icon-192.png \
  assets/brand/png/pwa-icon-512.png \
  assets/brand/png/pwa-maskable-192.png \
  assets/brand/png/pwa-maskable-512.png
do
  if [ ! -f "$asset" ]; then
    echo "missing required brand asset: $asset"
    failed=1
  fi
done

if [ "$failed" -ne 0 ]; then
  exit 1
fi

echo "documentation checks passed"
