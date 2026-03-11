# BITZ Club - Production Deployment Guide

## Project Overview
BITZ Club is a comprehensive membership management web application built with:
- **Frontend**: React 19, TailwindCSS, ShadCN UI
- **Backend**: FastAPI (Python 3.11)
- **Database**: MongoDB
- **PWA**: Progressive Web App enabled

## Quick Start

### Prerequisites
- Ubuntu 20.04+ / Debian 11+
- Node.js 18+ and Yarn
- Python 3.11+
- MongoDB 6.0+
- Nginx (for reverse proxy)
- SSL Certificate (Let's Encrypt recommended)

---

## 1. Server Setup (DigitalOcean)

### Create Droplet
- Image: Ubuntu 22.04 LTS
- Plan: Basic ($12-24/month recommended)
- Datacenter: Choose closest to your users
- Add SSH key for access

### Initial Server Configuration
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx certbot python3-certbot-nginx git curl

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Yarn
npm install -g yarn

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install MongoDB
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## 2. Application Deployment

### Clone/Upload Project
```bash
# Create app directory
sudo mkdir -p /var/www/bitzclub
cd /var/www/bitzclub

# Upload your ZIP file and extract, or clone from GitHub
# unzip bitz-club-project.zip
# OR
# git clone https://github.com/YOUR_REPO/bitz-club.git .
```

### Backend Setup
```bash
cd /var/www/bitzclub/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Create .env file (see Environment Variables section below)
nano .env
```

### Frontend Setup
```bash
cd /var/www/bitzclub/frontend

# Install dependencies
yarn install

# Create .env file
echo "REACT_APP_BACKEND_URL=https://yourdomain.com" > .env

# Build for production
yarn build
```

---

## 3. Database Restoration

```bash
# Restore database from dump
cd /var/www/bitzclub/deployment_package/database
mongorestore --db bitz_club ./dump/bitz_club

# Verify restoration
mongosh bitz_club --eval "db.getCollectionNames()"
```

---

## 4. Environment Variables

### Backend (.env)
```env
# MongoDB
MONGO_URL="mongodb://localhost:27017"
DB_NAME="bitz_club"

# Security
JWT_SECRET="your-secure-random-string-here-min-32-chars"
CORS_ORIGINS="https://yourdomain.com"

# Razorpay (LIVE keys for production)
RAZORPAY_KEY_ID="rzp_live_YOUR_KEY_ID"
RAZORPAY_KEY_SECRET="YOUR_SECRET_KEY"

# SoftSMS
SOFTSMS_API_KEY="56531040ad016"
SOFTSMS_SENDER_ID="BITZCL"
SOFTSMS_API_URL="https://softsms.in/app/smsapi/index.php"

# SMTP Email
SENDER_EMAIL="noreply@bitzclub.com"
SMTP_HOST="mail.bitzclub.com"
SMTP_PORT=465
SMTP_USERNAME="noreply@bitzclub.com"
SMTP_PASSWORD="YOUR_ACTUAL_EMAIL_PASSWORD"
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://yourdomain.com
```

---

## 5. Process Management (Systemd)

### Backend Service
Create `/etc/systemd/system/bitzclub-backend.service`:
```ini
[Unit]
Description=BITZ Club Backend API
After=network.target mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/bitzclub/backend
Environment="PATH=/var/www/bitzclub/backend/venv/bin"
ExecStart=/var/www/bitzclub/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable and Start
```bash
sudo systemctl daemon-reload
sudo systemctl enable bitzclub-backend
sudo systemctl start bitzclub-backend
sudo systemctl status bitzclub-backend
```

---

## 6. Nginx Configuration

Create `/etc/nginx/sites-available/bitzclub`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Frontend (React build)
    root /var/www/bitzclub/frontend/build;
    index index.html;

    # API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable Site and Get SSL
```bash
sudo ln -s /etc/nginx/sites-available/bitzclub /etc/nginx/sites-enabled/
sudo nginx -t
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo systemctl reload nginx
```

---

## 7. Razorpay Setup

### Get Live Keys
1. Login to https://dashboard.razorpay.com
2. Go to Settings > API Keys
3. Generate Live API Keys
4. Update `backend/.env` with live keys

### Webhook Configuration (Optional but Recommended)
1. In Razorpay Dashboard, go to Settings > Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Save webhook secret and add to backend

---

## 8. Login Credentials

### Admin Account
- **Mobile**: 9999999999
- **Password**: admin123
- **Role**: Super Admin

### Telecaller Account
- **Mobile**: 8888888888
- **Password**: telecaller123
- **Role**: Telecaller

### Member Account
- **Mobile**: 7777777777
- **Password**: member123
- **Role**: Member

**IMPORTANT**: Change these passwords immediately after deployment!

---

## 9. Post-Deployment Checklist

- [ ] Update all default passwords
- [ ] Configure production Razorpay keys
- [ ] Update SMTP password in .env
- [ ] Set up database backups (daily cron job)
- [ ] Configure firewall (ufw)
- [ ] Set up monitoring (optional)
- [ ] Test all features end-to-end

### Firewall Setup
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Database Backup Cron
```bash
# Add to crontab -e
0 2 * * * mongodump --db bitz_club --out /backups/mongodb/$(date +\%Y\%m\%d)
```

---

## 10. Troubleshooting

### Check Backend Logs
```bash
sudo journalctl -u bitzclub-backend -f
```

### Check Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
sudo systemctl restart bitzclub-backend
sudo systemctl restart nginx
```

---

## Support
For issues or questions, contact the development team.
