#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
# I: is a separate physical disk from Docker Desktop's G: data disk.
# Never fall back to a local WSL directory when the drive is disconnected.
default_backup_dir='/mnt/i/Backups/Registry-Atlas/PostgreSQL'
backup_dir="${ATLAS_BACKUP_DIR:-$default_backup_dir}"
if [[ "$backup_dir" == /mnt/i/* ]]; then
  mounted_drive="$(findmnt -n -T /mnt/i -o SOURCE 2>/dev/null || true)"
  if [[ "$mounted_drive" != 'I:\' ]]; then
    echo 'Backup drive I: is not mounted; refusing to write to the system disk' >&2
    exit 1
  fi
fi

backup_dir="$(realpath -m "$backup_dir")"
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
sha256sum "$archive" > "$archive.sha256"
chmod 600 "$archive.sha256"
trap - EXIT
printf 'BACKUP_OK tables=%s archive=%s\n' "$table_count" "$archive"
