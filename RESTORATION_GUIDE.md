# BITZ Club - Complete Backup & Restoration Guide

## 📦 Backup Contents

The backup contains:
- **Frontend**: React application with all pages and components
- **Backend**: FastAPI server with all APIs
- **Configuration**: Environment files (you need to update credentials)
- **Documentation**: PRD and changelog

---

## 🔽 Download Backups

### Option 1: Download from Emergent Preview
```bash
# Full Project Backup (3.3MB)
curl -o bitzclub_full_backup.tar.gz "https://razorpay-vpa-test.preview.emergentagent.com/api/download-backup"

# Backend server.py only
curl -o server.py "https://razorpay-vpa-test.preview.emergentagent.com/api/download-server"

# Frontend build only
curl -o frontend-build.tar.gz "https://razorpay-vpa-test.preview.emergentagent.com/api/download-build"
```

### Option 2: Backup from Live Server
```bash
# SSH into your server
ssh root@139.59.24.136

# Create full backup
tar -czvf /root/bitzclub_backup_$(date +%Y%m%d).tar.gz /var/www/bitzclub/

# Backup database
mongodump --db bitzclub --out /root/mongodb_backup_$(date +%Y%m%d)

# Download to your local machine (run from your computer)
scp root@139.59.24.136:/root/bitzclub_backup_*.tar.gz ./
scp -r root@139.59.24.136:/root/mongodb_backup_* ./
```

---

## 🔄 Restoration Steps

### Step 1: Setup New Server

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install Python 3.10+
apt install -y python3 python3-pip python3-venv

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Install Nginx
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### Step 2: Extract Backup

```bash
# Create directory
mkdir -p /var/www/bitzclub
cd /var/www/bitzclub

# Extract backup
tar -xzvf /path/to/bitzclub_full_backup.tar.gz

# Move files to correct location
mv frontend/* /var/www/bitzclub/frontend/
mv backend/* /var/www/bitzclub/backend/
```

### Step 3: Setup Backend

```bash
cd /var/www/bitzclub/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Update .env file with your credentials
nano .env
```

**Update these in .env:**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=bitzclub
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
JWT_SECRET=your_secure_random_string
```

### Step 4: Setup Frontend

```bash
cd /var/www/bitzclub/frontend

# Install dependencies
npm install
# OR
yarn install

# Update .env
nano .env
```

**Update in .env:**
```
REACT_APP_BACKEND_URL=https://yourdomain.com
```

```bash
# Build frontend
npm run build
```

### Step 5: Create Systemd Services

**Backend Service:**
```bash
cat > /etc/systemd/system/bitz-backend.service << 'EOF'
[Unit]
Description=BITZ Club Backend API
After=network.target mongod.service

[Service]
User=root
WorkingDirectory=/var/www/bitzclub/backend
Environment="PATH=/var/www/bitzclub/backend/venv/bin"
ExecStart=/var/www/bitzclub/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable bitz-backend
systemctl start bitz-backend
```

### Step 6: Configure Nginx

```bash
cat > /etc/nginx/sites-available/bitzclub << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/bitzclub/frontend/build;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/bitzclub /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

### Step 7: Setup SSL (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 8: Restore Database

```bash
# If you have a mongodump backup
mongorestore --db bitzclub /path/to/mongodb_backup/bitzclub/
```

---

## ✅ Verification Checklist

After restoration, verify:

- [ ] Website loads at https://yourdomain.com
- [ ] Admin login works (9999999999 / admin123)
- [ ] Plans display correctly
- [ ] Payment flow works
- [ ] Member dashboard works
- [ ] All admin pages load

---

## 🔐 Security Checklist

After restoration:

1. **Change admin password immediately**
2. **Update JWT secret** in backend .env
3. **Enable firewall:**
   ```bash
   ufw allow 22
   ufw allow 80
   ufw allow 443
   ufw enable
   ```
4. **Setup automatic backups** (cron job)

---

## 📞 Support

If you need help with restoration, contact:
- Technical Support: info@bitzclub.com
- WhatsApp: +91-7812901118
