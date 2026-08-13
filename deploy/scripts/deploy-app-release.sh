#!/usr/bin/env bash
set -Eeuo pipefail

archive=${1:-}
release_id=${2:-}

if [[ ! -f "$archive" || ! "$release_id" =~ ^[0-9a-f]{7,64}$ ]]; then
  echo "usage: $0 <archive.tar.gz> <git-sha>" >&2
  exit 2
fi

base=/opt/peper24
releases="$base/releases/app"
current="$base/current/app"
release="$releases/$release_id"
previous=$(readlink -f "$current" 2>/dev/null || true)

mkdir -p "$releases"
if [[ -e "$release" ]]; then
  echo "release already exists: $release" >&2
  exit 1
fi

while IFS= read -r entry; do
  if [[ "$entry" = /* || "$entry" = ../* || "$entry" = *'/../'* ]]; then
    echo "unsafe archive entry: $entry" >&2
    exit 1
  fi
done < <(tar -tzf "$archive")

mkdir -p "$release"
tar --warning=no-unknown-keyword -xzf "$archive" -C "$release"
test -f "$release/index.html"
chown -R deploy:deploy "$release"

ln -sfn "$release" "$current.next"
mv -Tf "$current.next" "$current"
nginx -t
systemctl reload nginx

if ! curl -fsS http://127.0.0.1/healthz >/dev/null; then
  echo "health check failed; restoring previous release" >&2
  if [[ -n "$previous" && -d "$previous" ]]; then
    ln -sfn "$previous" "$current.next"
    mv -Tf "$current.next" "$current"
    systemctl reload nginx
  fi
  exit 1
fi

rm -f "$archive"
find "$releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
  | sort -nr \
  | awk 'NR > 5 { sub(/^[^ ]+ /, ""); print }' \
  | while IFS= read -r old_release; do
      [[ "$old_release" == "$previous" ]] || rm -rf -- "$old_release"
    done

echo "app deployed: $release_id"
