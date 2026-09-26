#!/bin/sh
set -eu

missing=""
for name in GATEWAY_CORE_URL GATEWAY_DEMO_SECRET_KEY DATABASE_URL; do
  eval "value=\${$name:-}"
  if [ -z "$value" ]; then
    missing="$missing $name"
  fi
done

if [ -n "$missing" ]; then
  echo "Missing required runtime environment variables:$missing" >&2
  exit 1
fi

exec node server.js
