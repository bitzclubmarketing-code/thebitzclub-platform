#!/bin/bash
# BITZ Club Deployment Script
# Run on your server: bash deploy.sh

set -e

PROJECT_DIR="/root/bitzclub"
DOMAIN="thebitzclub.com"

echo "=========================================="
echo "BITZ Club Deployment"
echo "=========================================="

cd $PROJECT_DIR

# 1. Pull latest code (if using git)
if [ -d ".git" ]; then
    echo "[1/5] Pulling latest code..."
    git pull origin main || echo "Git pull skipped"
fi

# 2. Backend deployment
echo "[2/5] Deploying Backend..."
cd $PROJECT_DIR/backend
pip3 install -r requirements.txt -q

# Verify Razorpay LIVE keys
if grep -q "rzp_test_" .env 2>/dev/null; then
    echo "⚠️  WARNING: TEST Razorpay keys detected!"
    echo "Please update .env with LIVE keys"
fi

sudo systemctl restart bitz-backend
echo "✓ Backend restarted"

# 3. Frontend deployment
echo "[3/5] Building Frontend..."
cd $PROJECT_DIR/frontend
yarn install --silent
REACT_APP_BACKEND_URL=https://$DOMAIN yarn build
echo "✓ Frontend built"

# 4. Clear caches
echo "[4/5] Clearing caches..."
sudo rm -rf /var/cache/nginx/* 2>/dev/null || true

# 5. Restart Nginx
echo "[5/5] Restarting Nginx..."
sudo nginx -t && sudo systemctl restart nginx
echo "✓ Nginx restarted"

# Verification
echo ""
echo "=========================================="
echo "Verification"
echo "=========================================="
sleep 2

echo -n "Homepage: "
curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/ && echo " ✓"

echo -n "Register: "
curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/register && echo " ✓"

echo -n "API: "
curl -s https://$DOMAIN/api/plans | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} plans ✓')" 2>/dev/null || echo "Error"

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Test URLs:"
echo "  • https://$DOMAIN/"
echo "  • https://$DOMAIN/register"
echo "  • https://$DOMAIN/join"
echo "  • https://$DOMAIN/admin"
