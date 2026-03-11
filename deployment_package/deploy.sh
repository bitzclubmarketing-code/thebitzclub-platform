#!/bin/bash
# BITZ Club - DigitalOcean Deployment Script
# Run this script on your DigitalOcean server as root

set -e  # Exit on error

echo "============================================"
echo "  BITZ Club Deployment Script"
echo "============================================"

# Variables - UPDATE THESE
DOMAIN="yourdomain.com"  # Change to your actual domain
GITHUB_REPO="https://github.com/bitzclubmarketing-code/thebitzclub-platform.git"

# Step 1: Update System
echo "[1/10] Updating system..."
apt update && apt upgrade -y

# Step 2: Install Dependencies
echo "[2/10] Installing dependencies..."
apt install -y nginx certbot python3-certbot-nginx git curl software-properties-common

# Step 3: Install Node.js 18
echo "[3/10] Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
npm install -g yarn

# Step 4: Install Python 3.11
echo "[4/10] Installing Python 3.11..."
apt install -y python3.11 python3.11-venv python3-pip

# Step 5: Install MongoDB
echo "[5/10] Installing MongoDB..."
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Step 6: Clone Repository
echo "[6/10] Cloning repository..."
mkdir -p /var/www/bitzclub
cd /var/www/bitzclub
git clone $GITHUB_REPO .

# Step 7: Setup Backend
echo "[7/10] Setting up backend..."
cd /var/www/bitzclub/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Create production .env
cat > .env << 'ENVFILE'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="bitz_club"
CORS_ORIGINS="https://yourdomain.com"
JWT_SECRET="bitz-club-super-secret-jwt-key-2024-production"
RAZORPAY_KEY_ID="rzp_test_SPTJ4NnuWHDYRG"
RAZORPAY_KEY_SECRET="yvGZt4INIrclxMAdi4uFMnKS"
SOFTSMS_API_KEY="56531040ad016"
SOFTSMS_SENDER_ID="BITZCL"
SOFTSMS_API_URL="https://softsms.in/app/smsapi/index.php"
SENDER_EMAIL="noreply@bitzclub.com"
SMTP_HOST="mail.bitzclub.com"
SMTP_PORT=465
SMTP_USERNAME="noreply@bitzclub.com"
SMTP_PASSWORD="(webmail password)"
ENVFILE

# Update CORS with actual domain
sed -i "s/yourdomain.com/$DOMAIN/g" .env

deactivate

# Step 8: Setup Frontend
echo "[8/10] Setting up frontend..."
cd /var/www/bitzclub/frontend
yarn install
echo "REACT_APP_BACKEND_URL=https://$DOMAIN" > .env
yarn build

# Step 9: Restore Database
echo "[9/10] Restoring database..."
cd /var/www/bitzclub
if [ -d "deployment_package/database/dump/bitz_club" ]; then
    mongorestore --db bitz_club deployment_package/database/dump/bitz_club
    echo "Database restored successfully"
else
    echo "Database dump not found, seeding default data..."
    # The application will seed default data on first run
fi

# Step 10: Create Systemd Service
echo "[10/10] Creating systemd service..."
cat > /etc/systemd/system/bitzclub.service << 'SERVICEFILE'
[Unit]
Description=BITZ Club Backend API
After=network.target mongod.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/bitzclub/backend
Environment="PATH=/var/www/bitzclub/backend/venv/bin"
ExecStart=/var/www/bitzclub/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEFILE

# Set permissions
chown -R www-data:www-data /var/www/bitzclub

# Enable and start service
systemctl daemon-reload
systemctl enable bitzclub
systemctl start bitzclub

# Create Nginx config
cat > /etc/nginx/sites-available/bitzclub << NGINXFILE
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL will be configured by certbot
    
    root /var/www/bitzclub/frontend/build;
    index index.html;

    # API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 90;
    }

    # React SPA
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXFILE

# Enable site
ln -sf /etc/nginx/sites-available/bitzclub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "============================================"
echo "  Deployment Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Point your domain ($DOMAIN) to this server's IP"
echo "2. Run: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "3. Update SMTP_PASSWORD in /var/www/bitzclub/backend/.env"
echo "4. Restart backend: systemctl restart bitzclub"
echo ""
echo "Login Credentials:"
echo "  Admin: 9999999999 / admin123"
echo "  Telecaller: 8888888888 / telecaller123"
echo "  Member: 7777777777 / member123"
echo ""
echo "Check status: systemctl status bitzclub"
echo "View logs: journalctl -u bitzclub -f"
echo ""
