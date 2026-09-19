#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  exec sudo bash "$0" "$@"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
APP_DIR="${APP_DIR:-/opt/ddz}"
PORT="${PORT:-3000}"

echo "[1/7] Installing system packages..."
apt-get update
apt-get install -y curl ca-certificates gnupg git nginx certbot python3-certbot-nginx rsync

if ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'Number(process.versions.node.split(".")[0])' 2>/dev/null || echo 0)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

echo "[2/7] Preparing application files..."
mkdir -p "$APP_DIR"

if [[ -d "$SOURCE_DIR/.git" ]]; then
  git -C "$SOURCE_DIR" pull --ff-only || echo "Warning: git pull failed; deploying the checked-out revision."
  rsync -a --delete     --exclude '.git'     --exclude '.env'     --exclude 'client/node_modules'     --exclude 'server/node_modules'     "$SOURCE_DIR/" "$APP_DIR/"
else
  REPO_URL="${REPO_URL:-https://github.com/Hiccuppp/ddz.git}"
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
fi

ENV_SOURCE=""
if [[ -f "$SOURCE_DIR/.env" ]]; then
  ENV_SOURCE="$SOURCE_DIR/.env"
elif [[ -f "$APP_DIR/.env" ]]; then
  ENV_SOURCE="$APP_DIR/.env"
fi

if [[ -n "$ENV_SOURCE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_SOURCE"
  set +a
fi

DOMAIN="${DOMAIN:-}"
ADMIN_KEY="${ADMIN_KEY:-}"
PORT="${PORT:-3000}"
SSL_EMAIL="${SSL_EMAIL:-}"

if [[ -z "$DOMAIN" || "$DOMAIN" == "example.com" ]]; then
  if [[ -t 0 ]]; then
    read -rp "Game domain (for example ddz.example.com): " DOMAIN
  else
    echo "DOMAIN is required. Put it in .env or export DOMAIN before running."
    exit 1
  fi
fi

if [[ -z "$ADMIN_KEY" || "$ADMIN_KEY" == "password" ]]; then
  if [[ -t 0 ]]; then
    read -rsp "Admin key: " ADMIN_KEY
    echo
  else
    echo "ADMIN_KEY is required. Put it in .env or export ADMIN_KEY before running."
    exit 1
  fi
fi

cat > "$APP_DIR/.env" <<EOF
ADMIN_KEY=$ADMIN_KEY
DOMAIN=$DOMAIN
PORT=$PORT
SSL_EMAIL=$SSL_EMAIL
EOF

echo "[3/7] Installing Node dependencies..."
cd "$APP_DIR/server"
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi

cd "$APP_DIR/client"
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi

echo "[4/7] Building client..."
npm run build

echo "[5/7] Starting Node server with PM2..."
pm2 delete ddz-server >/dev/null 2>&1 || true
pm2 start "$APP_DIR/server/index.js" --name ddz-server --cwd "$APP_DIR/server" --update-env
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
systemctl enable pm2-root >/dev/null 2>&1 || true

echo "[6/7] Configuring Nginx..."
sed   -e "s|__DOMAIN__|$DOMAIN|g"   -e "s|__APP_DIR__|$APP_DIR|g"   -e "s|__PORT__|$PORT|g"   "$APP_DIR/deploy/nginx.conf" > /etc/nginx/sites-available/ddz

ln -sfn /etc/nginx/sites-available/ddz /etc/nginx/sites-enabled/ddz
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

echo "[7/7] Deployment complete."
echo "HTTP:  http://$DOMAIN/"
echo "Admin: http://$DOMAIN/admin?key=<ADMIN_KEY>"
echo "Run 'sudo bash $APP_DIR/setup-ssl.sh' after DNS points to this server."
