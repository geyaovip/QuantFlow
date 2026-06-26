#!/bin/sh

set -eu

APP_ROOT=${QUANTFLOW_APP_ROOT:-/home/ubuntu/apps/quantflow}
CURRENT=${QUANTFLOW_DEPLOY_PATH:-$APP_ROOT/current}
ENV_FILE=${QUANTFLOW_ENV_FILE:-$APP_ROOT/shared/.env}
LOG_DIR=${QUANTFLOW_BACKUP_LOG_DIR:-$APP_ROOT/logs}
CRON_USER=${QUANTFLOW_CRON_USER:-ubuntu}

mkdir -p "$LOG_DIR" "$APP_ROOT/backups" "$APP_ROOT/wal-archive"

CRON_FILE=$(mktemp)
crontab -u "$CRON_USER" -l 2>/dev/null | grep -v 'quantflow/current/scripts/backup-database.sh' | grep -v 'quantflow/current/scripts/archive-wal.sh' >"$CRON_FILE" || true

cat >>"$CRON_FILE" <<EOF
0 3 * * * cd $CURRENT && QUANTFLOW_ENV_FILE=$ENV_FILE QUANTFLOW_APP_ROOT=$CURRENT ./scripts/backup-database.sh >>$LOG_DIR/backup.log 2>&1
0 * * * * cd $CURRENT && QUANTFLOW_ENV_FILE=$ENV_FILE QUANTFLOW_APP_ROOT=$CURRENT ./scripts/archive-wal.sh >>$LOG_DIR/archive-wal.log 2>&1
EOF

crontab -u "$CRON_USER" "$CRON_FILE"
rm -f "$CRON_FILE"

echo "installed backup cron for user $CRON_USER"
crontab -u "$CRON_USER" -l | grep quantflow/current/scripts
