#!/usr/bin/env bash
# Nightly Postgres backup. Install on the VPS, not for local Windows use.
# Example cron (as root): 15 2 * * * /opt/sportmanager/backup-postgres.sh
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/sportmanager}"
KEEP_DAYS="${KEEP_DAYS:-14}"
DB_NAME="${DB_NAME:-sportmanager}"
DB_USER="${DB_USER:-sportmanager}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

stamp="$(date +%Y%m%d-%H%M)"
outfile="$BACKUP_DIR/${DB_NAME}-${stamp}.dump"

# Uses peer/local auth or ~/.pgpass — do not put the DB password in this script.
pg_dump -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -Fc -f "$outfile"
chmod 600 "$outfile"

find "$BACKUP_DIR" -type f -name "${DB_NAME}-*.dump" -mtime +"$KEEP_DAYS" -delete
