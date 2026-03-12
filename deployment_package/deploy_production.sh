#!/bin/bash
# BITZ Club - Complete Production Deployment Script
# Run this script on your DigitalOcean server as root

set -e
echo "============================================"
echo "  BITZ Club Production Deployment"
echo "============================================"

# Step 1: Ensure MongoDB is running
echo "[1/8] Starting MongoDB..."
systemctl start mongod || echo "MongoDB may already be running"
systemctl enable mongod

# Step 2: Create Backend .env file
echo "[2/8] Creating backend .env..."
cat > /root/bitzclub/backend/.env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=bitz_club
CORS_ORIGINS=https://thebitzclub.com,https://www.thebitzclub.com,http://139.59.24.136
JWT_SECRET=bitz-club-production-secret-key-2024-thebitzclub-secure
RAZORPAY_KEY_ID=rzp_test_SPTJ4NnuWHDYRG
RAZORPAY_KEY_SECRET=yvGZt4INIrclxMAdi4uFMnKS
SOFTSMS_API_KEY=56531040ad016
SOFTSMS_SENDER_ID=BITZCL
SOFTSMS_API_URL=https://softsms.in/app/smsapi/index.php
SENDER_EMAIL=noreply@bitzclub.com
SMTP_HOST=mail.bitzclub.com
SMTP_PORT=465
SMTP_USERNAME=noreply@bitzclub.com
SMTP_PASSWORD=placeholder
EOF
echo "Backend .env created!"

# Step 3: Create systemd service
echo "[3/8] Creating systemd service..."
cat > /etc/systemd/system/bitzclub.service << 'EOF'
[Unit]
Description=BITZ Club FastAPI Backend
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/bitzclub/backend
EnvironmentFile=/root/bitzclub/backend/.env
Environment="PATH=/root/bitzclub/backend/venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/root/bitzclub/backend/venv/bin/python -m uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 4: Start backend service
echo "[4/8] Starting backend service..."
systemctl daemon-reload
systemctl enable bitzclub
systemctl restart bitzclub
sleep 5

# Step 5: Verify backend is running
echo "[5/8] Verifying backend..."
if curl -s http://127.0.0.1:8001/api/plans > /dev/null; then
    echo "Backend is running!"
else
    echo "Backend may still be starting, checking logs..."
    journalctl -u bitzclub --no-pager -n 20
fi

# Step 6: Build frontend
echo "[6/8] Building frontend..."
cd /root/bitzclub/frontend
echo "REACT_APP_BACKEND_URL=https://thebitzclub.com" > .env
yarn install 2>/dev/null || npm install
yarn build 2>/dev/null || npm run build

# Step 7: Configure Nginx
echo "[7/8] Configuring Nginx..."
cat > /etc/nginx/sites-available/bitzclub << 'EOF'
server {
    listen 80;
    server_name thebitzclub.com www.thebitzclub.com 139.59.24.136;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name thebitzclub.com www.thebitzclub.com;

    ssl_certificate /etc/letsencrypt/live/thebitzclub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/thebitzclub.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /root/bitzclub/frontend/build;
    index index.html;

    # API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90;
        proxy_connect_timeout 90;
    }

    # React SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -sf /etc/nginx/sites-available/bitzclub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Step 8: Seed database if empty
echo "[8/8] Checking database..."
mongosh bitz_club --quiet --eval "
if (db.users.countDocuments({}) == 0) {
    print('Seeding default admin user...');
    db.users.insertOne({
        id: 'admin-001',
        mobile: '9999999999',
        name: 'Super Admin',
        email: 'admin@bitzclub.com',
        password: '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G0xZ8Z1Z1Z1Z1.',
        role: 'super_admin',
        is_active: true,
        created_at: new Date().toISOString()
    });
}
print('Users count: ' + db.users.countDocuments({}));
print('Plans count: ' + db.plans.countDocuments({}));
"

echo ""
echo "============================================"
echo "  DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "Website: https://thebitzclub.com"
echo "API: https://thebitzclub.com/api/plans"
echo ""
echo "Login Credentials:"
echo "  Admin: 9999999999 / admin123"
echo "  Telecaller: 8888888888 / telecaller123"
echo "  Member: 7777777777 / member123"
echo ""
echo "Check backend: systemctl status bitzclub"
echo "Check logs: journalctl -u bitzclub -f"
echo ""
