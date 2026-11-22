#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
models="$root/formal/runtime-generation"
working="$(mktemp -d)"
trap 'rm -rf "$working"' EXIT

tools="$working/tla2tools.jar"
curl --fail --silent --show-error --location --max-time 45 \
  'https://github.com/tlaplus/tlaplus/releases/download/v1.7.4/tla2tools.jar' \
  --output "$tools"
printf '%s  %s\n' '936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88' "$tools" \
  | sha256sum --check --status

check() {
  local variant="$1" expected="$2" code=0
  local log="$working/$variant.log"

  java -XX:+UseParallelGC -cp "$tools" tlc2.TLC -workers 1 -deadlock \
    -metadir "$working/state-$variant" -config "$models/$variant.cfg" \
    "$models/RuntimeGeneration.tla" > "$log" 2>&1 || code=$?

  if [[ "$expected" == 'pass' ]]; then
    if (( code != 0 )) || ! grep -qF 'Model checking completed. No error has been found.' "$log"; then
      cat "$log"
      return 1
    fi
  elif (( code == 0 )) || ! grep -qF "Invariant $expected is violated." "$log"; then
    cat "$log"
    return 1
  fi

  printf 'MODEL_CHECK_OK variant=%s expected=%s\n' "$variant" "$expected"
}

check safe pass
check early-manifest ManifestReady
check unpinned-details ClientConsistent
