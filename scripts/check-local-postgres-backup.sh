#!/usr/bin/env bash
set -euo pipefail
if [[ $# -ne 1 || ! -f "$1" ]]; then
  echo 'Usage: scripts/check-local-postgres-backup.sh /absolute/path/to/backup.dump' >&2
  exit 2
fi

archive="$(realpath "$1")"
container='registry-atlas-local-database-1'
db='atlas_backup_restore_test'

if docker exec "$container" psql -U atlas -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname='$db'" | grep -q 1; then
  echo 'Restore-test database already exists; refusing to overwrite it' >&2
  exit 1
fi

docker exec "$container" createdb -U atlas "$db"
cleanup() { docker exec "$container" dropdb -U atlas --if-exists "$db" >/dev/null; }
trap cleanup EXIT

docker exec -i "$container" pg_restore -U atlas -d "$db" --no-owner < "$archive"
counts="$(docker exec "$container" psql -U atlas -d "$db" -X -At -F ',' -c \
  'SELECT (SELECT COUNT(*) FROM atlas.atlas_catalog_items), (SELECT COUNT(*) FROM atlas.atlas_item_details), (SELECT COUNT(*) FROM atlas.atlas_source_pages)')"

IFS=',' read -r catalog details pages <<< "$counts"
if [[ "$catalog" -ne 91716 || "$details" -ne 91716 || "$pages" -lt 46390 ]]; then
  echo "Restored database failed snapshot checks: $counts" >&2
  exit 1
fi

printf 'RESTORE_OK catalog=%s details=%s source_pages=%s\n' "$catalog" "$details" "$pages"
