#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  exec sudo bash "$0" "$@"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ ! -f "$ROOT_DIR/.env" ]]; then
  echo "Missing $ROOT_DIR/.env. Deploy the app first."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source "$ROOT_DIR/.env"
set +a

if [[ -z "${DOMAIN:-}" ]]; then
  echo "DOMAIN is missing from .env"
  exit 1
fi

apt-get update
apt-get install -y certbot python3-certbot-nginx

ARGS=(--nginx -d "$DOMAIN" --agree-tos --non-interactive --redirect)
if [[ -n "${SSL_EMAIL:-}" ]]; then
  ARGS+=(-m "$SSL_EMAIL")
else
  ARGS+=(--register-unsafely-without-email)
fi

certbot "${ARGS[@]}"
systemctl enable --now certbot.timer >/dev/null 2>&1 || true

echo "HTTPS enabled: https://$DOMAIN/"
