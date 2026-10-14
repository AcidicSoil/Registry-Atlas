#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
backup_dir="${ATLAS_BACKUP_DIR:-.instance/backups}"
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
archive="$backup_dir/registry-atlas-$stamp.dump"
partial="$archive.incomplete"
trap 'rm -f "$partial"' EXIT

docker exec registry-atlas-local-database-1 pg_dump -U atlas -d atlas -Fc > "$partial"

# Validate the archive before publishing it as a restorable backup.
table_count="$(docker exec -i registry-atlas-local-database-1 pg_restore --list < "$partial" | grep -c 'TABLE DATA atlas')"
if [[ "$table_count" -ne 23 ]]; then
  echo "Expected 23 backed-up Atlas tables; found $table_count" >&2
  exit 1
fi

chmod 600 "$partial"
mv "$partial" "$archive"
trap - EXIT
printf 'BACKUP_OK tables=%s archive=%s\n' "$table_count" "$archive"
