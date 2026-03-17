# BITZ Club - Complete Deployment Guide

## Server Requirements
- Ubuntu 20.04+ or similar Linux
- Node.js 18+ and Yarn
- Python 3.9+ and pip
- MongoDB 5.0+
- Nginx
- SSL certificate (Let's Encrypt recommended)

## Directory Structure on Server
```
/root/bitzclub/
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   ├── build/          # Production build
│   ├── package.json
│   └── .env
└── deploy.sh
```

## Step 1: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Yarn
npm install -g yarn

# Install Python
sudo apt install -y python3 python3-pip python3-venv

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx
```

## Step 2: Clone/Upload Code

```bash
# Create project directory
mkdir -p /root/bitzclub
cd /root/bitzclub

# Option A: Clone from GitHub
git clone https://github.com/YOUR_USERNAME/bitzclub.git .

# Option B: Upload via SCP
scp -r ./backend ./frontend root@YOUR_SERVER_IP:/root/bitzclub/
```

## Step 3: Backend Setup

```bash
cd /root/bitzclub/backend

# Install dependencies
pip3 install -r requirements.txt

# Create/Edit .env file
cat << 'ENVEOF' > .env
MONGO_URL=mongodb://localhost:27017
DB_NAME=bitz_club
JWT_SECRET=your_secure_jwt_secret_here
RAZORPAY_KEY_ID=rzp_live_SSGM9EfgDl6Y8U
RAZORPAY_KEY_SECRET=W6lOWafuYl0Kh8I9WNzeXD3y
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SOFTSMS_API_KEY=your_softsms_key
ENVEOF

# Create systemd service
sudo cat << 'SVCEOF' > /etc/systemd/system/bitz-backend.service
[Unit]
Description=BITZ Club Backend API
After=network.target mongod.service

[Service]
User=root
WorkingDirectory=/root/bitzclub/backend
ExecStart=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
SVCEOF

# Start backend
sudo systemctl daemon-reload
sudo systemctl enable bitz-backend
sudo systemctl start bitz-backend
```

## Step 4: Frontend Setup

```bash
cd /root/bitzclub/frontend

# Install dependencies
yarn install

# Create .env file
echo "REACT_APP_BACKEND_URL=https://thebitzclub.com" > .env

# Build for production
yarn build
```

## Step 5: Nginx Configuration

```bash
sudo cat << 'NGINXEOF' > /etc/nginx/sites-available/thebitzclub.com
server {
    listen 80;
    server_name thebitzclub.com www.thebitzclub.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name thebitzclub.com www.thebitzclub.com;

    ssl_certificate /etc/letsencrypt/live/thebitzclub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/thebitzclub.com/privkey.pem;

    # Frontend - React SPA
    location / {
        root /root/bitzclub/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;  # CRITICAL for React routing
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        root /root/bitzclub/frontend/build;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/thebitzclub.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

## Step 6: SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d thebitzclub.com -d www.thebitzclub.com
```

## Step 7: Quick Deploy Script

Save this as `/root/bitzclub/deploy.sh`:

```bash
#!/bin/bash
set -e
cd /root/bitzclub

echo "=== Deploying BITZ Club ==="

# Pull latest code
git pull origin main

# Backend
cd backend
pip3 install -r requirements.txt -q
sudo systemctl restart bitz-backend

# Frontend
cd ../frontend
yarn install --silent
REACT_APP_BACKEND_URL=https://thebitzclub.com yarn build

# Clear cache & restart
sudo rm -rf /var/cache/nginx/*
sudo systemctl restart nginx

echo "=== Deployment Complete ==="
```

## Verification Commands

```bash
# Check backend status
sudo systemctl status bitz-backend

# Check backend logs
sudo journalctl -u bitz-backend -f

# Check nginx status
sudo systemctl status nginx

# Test API
curl https://thebitzclub.com/api/plans

# Test frontend routes
curl -I https://thebitzclub.com/
curl -I https://thebitzclub.com/register
```

## Troubleshooting

### 404 on /register
- Ensure nginx has `try_files $uri $uri/ /index.html;`
- Clear nginx cache: `sudo rm -rf /var/cache/nginx/*`
- Restart nginx: `sudo systemctl restart nginx`

### Payment not working
- Verify LIVE Razorpay keys in backend/.env
- Check backend logs: `sudo journalctl -u bitz-backend -n 100`

### API errors
- Check MongoDB is running: `sudo systemctl status mongod`
- Check backend logs for errors
