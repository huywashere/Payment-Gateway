#!/bin/sh
set -eu

missing=""
for name in GATEWAY_CORE_URL GATEWAY_MODE DATABASE_URL PORTAL_SESSION_SECRET PORTAL_AUTH_MODE; do
  eval "value=\${$name:-}"
  if [ -z "$value" ]; then
    missing="$missing $name"
  fi
done

case "${GATEWAY_MODE:-sandbox}" in
  live)
    [ -n "${GATEWAY_LIVE_SECRET_KEY:-}" ] || missing="$missing GATEWAY_LIVE_SECRET_KEY"
    if [ "${PORTAL_AUTH_MODE:-}" != "oidc" ]; then
      echo "Live portal requires PORTAL_AUTH_MODE=oidc" >&2
      exit 1
    fi
    ;;
  sandbox)
    if [ -z "${GATEWAY_SANDBOX_SECRET_KEY:-}" ] && [ -z "${GATEWAY_DEMO_SECRET_KEY:-}" ]; then
      missing="$missing GATEWAY_SANDBOX_SECRET_KEY"
    fi
    ;;
  *)
    echo "GATEWAY_MODE must be sandbox or live" >&2
    exit 1
    ;;
esac

case "${PORTAL_AUTH_MODE:-}" in
  oidc)
    for name in PORTAL_OIDC_ISSUER PORTAL_OIDC_CLIENT_ID PORTAL_OIDC_CLIENT_SECRET; do
      eval "value=\${$name:-}"
      [ -n "$value" ] || missing="$missing $name"
    done
    ;;
  demo)
    [ -n "${PORTAL_DEMO_PASSWORD:-}" ] || missing="$missing PORTAL_DEMO_PASSWORD"
    [ -n "${PORTAL_DEMO_MFA_CODE:-}" ] || missing="$missing PORTAL_DEMO_MFA_CODE"
    ;;
  *)
    echo "PORTAL_AUTH_MODE must be demo or oidc" >&2
    exit 1
    ;;
esac

if [ -n "$missing" ]; then
  echo "Missing required runtime environment variables:$missing" >&2
  exit 1
fi

exec node server.js
