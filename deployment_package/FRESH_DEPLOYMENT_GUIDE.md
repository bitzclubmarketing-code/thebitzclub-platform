# BITZ Club - Fresh Server Deployment Guide

## Quick Reference

| Item | Value |
|------|-------|
| **Backend Port** | 8001 |
| **Database** | MongoDB (bitz_club) |
| **Admin Login** | 9999999999 / admin123 |

---

## 1. Server Requirements

- Ubuntu 22.04 LTS
- 2GB RAM minimum
- Node.js 18+
- Python 3.11+
- MongoDB 6.0+
- Nginx

---

## 2. Initial Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
npm install -g yarn

# Install Python 3.11
apt install -y python3.11 python3.11-venv python3-pip

# Install MongoDB
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl enable mongod
systemctl start mongod

# Install Nginx
apt install -y nginx certbot python3-certbot-nginx
```

---

## 3. Clone Project

```bash
mkdir -p /var/www/bitzclub
cd /var/www/bitzclub
git clone https://github.com/bitzclubmarketing-code/thebitzclub-platform.git .
```

---

## 4. Backend Setup

### 4.1 Create Virtual Environment
```bash
cd /var/www/bitzclub/backend
python3.11 -m venv venv
source venv/bin/activate
```

### 4.2 Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4.3 Create Environment File
```bash
cat > /var/www/bitzclub/backend/.env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=bitz_club
CORS_ORIGINS=https://thebitzclub.com,https://www.thebitzclub.com
JWT_SECRET=bitz-club-production-secret-key-2024-secure-random
RAZORPAY_KEY_ID=rzp_test_SPTJ4NnuWHDYRG
RAZORPAY_KEY_SECRET=yvGZt4INIrclxMAdi4uFMnKS
SOFTSMS_API_KEY=56531040ad016
SOFTSMS_SENDER_ID=BITZCL
SOFTSMS_API_URL=https://softsms.in/app/smsapi/index.php
SENDER_EMAIL=noreply@bitzclub.com
SMTP_HOST=mail.bitzclub.com
SMTP_PORT=465
SMTP_USERNAME=noreply@bitzclub.com
SMTP_PASSWORD=your_actual_password
EOF
```

### 4.4 Backend Start Command (Manual Test)
```bash
cd /var/www/bitzclub/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
```

### 4.5 Create Systemd Service (Production)
```bash
cat > /etc/systemd/system/bitzclub.service << 'EOF'
[Unit]
Description=BITZ Club FastAPI Backend
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/bitzclub/backend
Environment="PATH=/var/www/bitzclub/backend/venv/bin"
ExecStart=/var/www/bitzclub/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Set permissions and start
chown -R www-data:www-data /var/www/bitzclub
systemctl daemon-reload
systemctl enable bitzclub
systemctl start bitzclub
```

---

## 5. Frontend Setup

### 5.1 Install Dependencies
```bash
cd /var/www/bitzclub/frontend
yarn install
```

### 5.2 Create Environment File
```bash
echo "REACT_APP_BACKEND_URL=https://thebitzclub.com" > .env
```

### 5.3 Frontend Build Command
```bash
yarn build
```

### 5.4 Copy Build to Web Root
```bash
cp -r /var/www/bitzclub/frontend/build/* /var/www/html/
chown -R www-data:www-data /var/www/html
```

---

## 6. Nginx Configuration

```bash
cat > /etc/nginx/sites-available/bitzclub << 'EOF'
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

    root /var/www/html;
    index index.html;

    # API Proxy - IMPORTANT: Must be before catch-all
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    # React Router - catch-all
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/bitzclub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

## 7. SSL Certificate

```bash
certbot --nginx -d thebitzclub.com -d www.thebitzclub.com
```

---

## 8. Database Restore (Optional)

If you have a database dump:
```bash
mongorestore --db bitz_club /path/to/dump/bitz_club
```

Or seed fresh data:
```bash
curl -X POST http://localhost:8001/api/seed
```

---

## 9. Verification Commands

```bash
# Check backend
systemctl status bitzclub
curl http://localhost:8001/api/plans

# Check API via domain
curl https://thebitzclub.com/api/plans

# Check Nginx
systemctl status nginx
nginx -t

# Check MongoDB
systemctl status mongod
mongosh bitz_club --eval "db.users.countDocuments({})"
```

---

## 10. Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| MONGO_URL | MongoDB connection | mongodb://localhost:27017 |
| DB_NAME | Database name | bitz_club |
| CORS_ORIGINS | Allowed origins | https://thebitzclub.com |
| JWT_SECRET | JWT signing key | random-32-char-string |
| RAZORPAY_KEY_ID | Razorpay key | rzp_test_xxx |
| RAZORPAY_KEY_SECRET | Razorpay secret | xxx |
| SOFTSMS_API_KEY | SMS API key | xxx |
| SOFTSMS_SENDER_ID | SMS sender | BITZCL |
| SMTP_HOST | Email server | mail.bitzclub.com |
| SMTP_PORT | Email port | 465 |
| SMTP_USERNAME | Email user | noreply@bitzclub.com |
| SMTP_PASSWORD | Email password | xxx |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| REACT_APP_BACKEND_URL | Backend URL | https://thebitzclub.com |

---

## 11. Login Credentials

| Role | Mobile | Password |
|------|--------|----------|
| Admin | 9999999999 | admin123 |
| Telecaller | 8888888888 | telecaller123 |
| Member | 7777777777 | member123 |

---

## 12. Troubleshooting

### Backend not starting
```bash
journalctl -u bitzclub -n 50
cd /var/www/bitzclub/backend && source venv/bin/activate && python -c "from server import app"
```

### API returning HTML instead of JSON
- Check Nginx config has `/api/` location BEFORE `/` location
- Restart nginx: `systemctl restart nginx`

### MongoDB connection error
```bash
systemctl status mongod
systemctl start mongod
```

### Permission denied
```bash
chown -R www-data:www-data /var/www/bitzclub
chmod -R 755 /var/www/bitzclub
```

---

## 13. Useful Commands

```bash
# Restart all services
systemctl restart mongod bitzclub nginx

# View logs
journalctl -u bitzclub -f
tail -f /var/log/nginx/error.log

# Rebuild frontend
cd /var/www/bitzclub/frontend && yarn build && cp -r build/* /var/www/html/
```
