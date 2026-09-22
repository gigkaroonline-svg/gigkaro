#!/usr/bin/env bash
# Run on the VM (or via CI over SSH).
# Usage: ./deploy.sh qa|prod
set -euo pipefail

ENV="${1:-}"
if [[ "$ENV" != "qa" && "$ENV" != "prod" ]]; then
  echo "Usage: $0 qa|prod"
  exit 1
fi

APP_ROOT="/apps/gigkaro-${ENV}"
APP_DIR="${APP_ROOT}/backend"
BRANCH="$ENV"
PM2_NAME="gigkaro-api-${ENV}"

echo "==> Deploying backend (${ENV}) from branch ${BRANCH}"
cd "$APP_ROOT"

git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/${BRANCH}"

cd "$APP_DIR"
npm ci
mkdir -p uploads/companies

pm2 describe "$PM2_NAME" >/dev/null 2>&1 \
  && pm2 restart "$PM2_NAME" --update-env \
  || pm2 start npm --name "$PM2_NAME" --cwd "$APP_DIR" -- start

pm2 save
echo "==> Health check"
sleep 2
PORT=$(grep -E '^PORT=' .env | cut -d= -f2 | tr -d '"' | tr -d "'")
PORT="${PORT:-5000}"
curl -fsS "http://127.0.0.1:${PORT}/api/health"
echo
echo "==> Deployed ${ENV} successfully"
