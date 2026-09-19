#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run with sudo, for example:"
  echo "  curl -fsSL https://raw.githubusercontent.com/Hiccuppp/ddz/main/install.sh | sudo bash"
  exit 1
fi

REPO_URL="${REPO_URL:-https://github.com/Hiccuppp/ddz.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/ddz}"

apt-get update
apt-get install -y git curl ca-certificates

if [[ -z "${DOMAIN:-}" ]]; then
  if [[ -r /dev/tty ]]; then
    read -rp "Game domain (for example ddz.example.com): " DOMAIN </dev/tty
  else
    echo "DOMAIN is required when no interactive terminal is available."
    exit 1
  fi
fi

if [[ -z "${ADMIN_KEY:-}" ]]; then
  if [[ -r /dev/tty ]]; then
    read -rsp "Admin key: " ADMIN_KEY </dev/tty
    echo
  else
    echo "ADMIN_KEY is required when no interactive terminal is available."
    exit 1
  fi
fi

if [[ -z "${SSL_EMAIL:-}" && -r /dev/tty ]]; then
  read -rp "Let's Encrypt email (optional): " SSL_EMAIL </dev/tty || true
fi
SSL_EMAIL="${SSL_EMAIL:-}"

TMP_DIR="$(mktemp -d /tmp/ddz-install.XXXXXX)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Cloning DDZ..."
git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$TMP_DIR/ddz"

cat > "$TMP_DIR/ddz/.env" <<EOF
ADMIN_KEY=$ADMIN_KEY
DOMAIN=$DOMAIN
PORT=3000
SSL_EMAIL=$SSL_EMAIL
EOF

export APP_DIR
bash "$TMP_DIR/ddz/deploy/deploy.sh"

ENABLE_SSL="${ENABLE_SSL:-}"
if [[ -z "$ENABLE_SSL" && -r /dev/tty ]]; then
  read -rp "Enable HTTPS now? DNS must already point to this server. [Y/n]: " ENABLE_SSL </dev/tty || true
fi
ENABLE_SSL="${ENABLE_SSL:-Y}"

if [[ "$ENABLE_SSL" =~ ^([Yy]|[Yy][Ee][Ss]|1|true)$ ]]; then
  bash "$APP_DIR/setup-ssl.sh"
else
  echo "HTTPS skipped. Enable it later with:"
  echo "  sudo bash $APP_DIR/setup-ssl.sh"
fi

echo
echo "Deployment finished."
echo "Player: https://$DOMAIN/"
echo "Admin:  https://$DOMAIN/admin?key=<your-admin-key>"
