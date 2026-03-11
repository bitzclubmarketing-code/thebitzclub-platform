# BITZ Club - Complete Setup & Configuration Guide

## 1. GitHub Repository

**To push to GitHub:**
1. Click the **"Save to GitHub"** button in the Emergent chat interface (top area)
2. Connect your GitHub account if not already connected
3. Choose to create a new repository or push to an existing one
4. Repository will contain the complete project

**Repository Structure:**
```
bitz-club/
├── backend/           # FastAPI Python backend
│   ├── server.py      # Main application file
│   ├── requirements.txt
│   ├── .env           # Environment variables
│   └── tests/         # API tests
├── frontend/          # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
├── memory/            # Documentation
│   └── PRD.md
└── deployment_package/
    ├── bitz-club-project.zip
    ├── database/dump/  # MongoDB dump
    └── docs/           # Deployment guides
```

---

## 2. Admin Login Credentials

| Field | Value |
|-------|-------|
| **Mobile Number** | 9999999999 |
| **Password** | admin123 |
| **Role** | Super Admin |
| **Access Level** | Full system access |

**Admin Capabilities:**
- Manage all members (create, edit, delete, view)
- Manage membership plans
- Manage partner venues and discounts
- Manage telecallers
- View and manage leads
- Access all reports with export functionality
- Content Management System (CMS)
- View dashboard analytics

---

## 3. Telecaller Login Credentials

| Field | Value |
|-------|-------|
| **Mobile Number** | 8888888888 |
| **Password** | telecaller123 |
| **Role** | Telecaller |
| **Access Level** | Limited to assigned members/leads |

**Telecaller Capabilities:**
- View assigned members only
- Create new members
- Manage follow-ups
- Update lead status
- View personal performance metrics

---

## 4. Member Login Credentials

| Field | Value |
|-------|-------|
| **Mobile Number** | 7777777777 |
| **Password** | member123 |
| **Role** | Member |
| **Access Level** | Personal dashboard only |

**Member Capabilities:**
- View digital membership card with QR code
- Download membership card (PDF)
- View partner benefits and discounts
- View membership validity
- Share membership

---

## 5. Default Username/Password Logic for New Members

### Registration Flow (Self-Registration)
- **Username**: Mobile number (10 digits)
- **Password**: User creates their own password during registration
- **Member ID**: Auto-generated in format `BITZ-YYYY-XXXXXX`
  - `YYYY` = Current year
  - `XXXXXX` = 6-digit sequential number

### Admin-Created Members
- **Username**: Mobile number
- **Password**: System generates random 8-character password
- **Format**: Mix of uppercase, lowercase, and numbers (e.g., `V5aRjs5c`)
- **Delivery**: Password is returned in API response and should be sent via SMS

### Password Logic (in server.py)
```python
def generate_password(length=8):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))
```

### Member ID Generation Logic
```python
def generate_member_id():
    year = datetime.now().year
    count = db.members.count_documents({}) + 1
    return f"BITZ-{year}-{str(count).zfill(6)}"
# Example: BITZ-2026-000001, BITZ-2026-000002, etc.
```

---

## 6. Database Details

| Parameter | Value |
|-----------|-------|
| **Database Type** | MongoDB |
| **Database Name** | `bitz_club` |
| **Default Connection** | `mongodb://localhost:27017` |
| **Authentication** | None (local) / Configure for production |

### Collections
| Collection | Purpose | Sample Count |
|------------|---------|--------------|
| `users` | All user accounts (admin, telecaller, member) | 18 |
| `members` | Membership details and status | 10 |
| `plans` | Membership plan configurations | 3 |
| `partners` | Partner venues with discounts | 5 |
| `payments` | Payment transaction records | 13 |
| `leads` | Enquiry leads from landing page | 16 |
| `experiences` | CMS lifestyle experience content | 8 |
| `gallery` | CMS gallery images | 1 |

### Database Restoration
```bash
# Restore from dump
mongorestore --db bitz_club ./deployment_package/database/dump/bitz_club

# Verify
mongosh bitz_club --eval "db.getCollectionNames()"
```

### Production Database Setup (with authentication)
```bash
# Create database user
mongosh admin --eval "
db.createUser({
  user: 'bitzclub_user',
  pwd: 'YOUR_SECURE_PASSWORD',
  roles: [{ role: 'readWrite', db: 'bitz_club' }]
})
"

# Update connection string
MONGO_URL="mongodb://bitzclub_user:YOUR_SECURE_PASSWORD@localhost:27017/bitz_club?authSource=admin"
```

---

## 7. Environment Configuration (.env Variables)

### Backend (.env) - /backend/.env

```env
# ============ DATABASE ============
MONGO_URL="mongodb://localhost:27017"
DB_NAME="bitz_club"

# ============ SECURITY ============
# Generate with: openssl rand -hex 32
JWT_SECRET="bitz-club-super-secret-jwt-key-2024"
CORS_ORIGINS="https://yourdomain.com"

# ============ RAZORPAY ============
# TEST KEYS (current)
RAZORPAY_KEY_ID="rzp_test_SPTJ4NnuWHDYRG"
RAZORPAY_KEY_SECRET="yvGZt4INIrclxMAdi4uFMnKS"

# LIVE KEYS (for production - get from Razorpay dashboard)
# RAZORPAY_KEY_ID="rzp_live_YOUR_LIVE_KEY"
# RAZORPAY_KEY_SECRET="YOUR_LIVE_SECRET"

# ============ SMS (SoftSMS) ============
SOFTSMS_API_KEY="56531040ad016"
SOFTSMS_SENDER_ID="BITZCL"
SOFTSMS_API_URL="https://softsms.in/app/smsapi/index.php"

# ============ EMAIL (SMTP) ============
SENDER_EMAIL="noreply@bitzclub.com"
SMTP_HOST="mail.bitzclub.com"
SMTP_PORT=465
SMTP_USERNAME="noreply@bitzclub.com"
SMTP_PASSWORD="YOUR_ACTUAL_EMAIL_PASSWORD"
```

### Frontend (.env) - /frontend/.env

```env
# Backend API URL (no trailing slash)
REACT_APP_BACKEND_URL=https://yourdomain.com
```

---

## 8. Razorpay Configuration

### Current Test Keys
| Parameter | Value |
|-----------|-------|
| Key ID | `rzp_test_SPTJ4NnuWHDYRG` |
| Key Secret | `yvGZt4INIrclxMAdi4uFMnKS` |
| Mode | Test (sandbox) |
| Test Card | 4111 1111 1111 1111 |
| Test CVV | Any 3 digits |
| Test Expiry | Any future date |

### Steps to Get Live Keys

1. **Login to Razorpay Dashboard**
   - URL: https://dashboard.razorpay.com

2. **Complete KYC Verification**
   - Go to Settings > Account & Settings
   - Complete all required documents
   - Wait for approval (usually 2-3 business days)

3. **Generate Live API Keys**
   - Go to Settings > API Keys
   - Switch to "Live Mode" (toggle at top)
   - Click "Generate Key"
   - Copy Key ID and Secret (Secret shown only once!)

4. **Update Backend .env**
   ```env
   RAZORPAY_KEY_ID="rzp_live_XXXXXXXXXX"
   RAZORPAY_KEY_SECRET="XXXXXXXXXXXXXXXX"
   ```

5. **Configure Webhooks (Optional but Recommended)**
   - Go to Settings > Webhooks
   - Add URL: `https://yourdomain.com/api/payments/webhook`
   - Select events: `payment.captured`, `payment.failed`
   - Save and note the webhook secret

### Payment Flow
1. Frontend calls `POST /api/payments/create-order`
2. Backend creates Razorpay order, returns order_id
3. Frontend opens Razorpay checkout modal
4. User completes payment
5. Frontend sends verification to `POST /api/payments/verify`
6. Backend verifies signature and updates payment status

---

## 9. URL Routes

### Admin Panel Routes

| URL | Page | Description |
|-----|------|-------------|
| `/admin` | Dashboard | Overview stats and charts |
| `/admin/members` | Members | Member management (CRUD) |
| `/admin/plans` | Plans | Membership plans management |
| `/admin/partners` | Partners | Partner venues management |
| `/admin/telecallers` | Telecallers | Telecaller management |
| `/admin/leads` | Leads | Lead enquiries management |
| `/admin/reports` | Reports | All reports with filters & export |
| `/admin/content` | CMS | Website content management |

### Telecaller Panel Routes

| URL | Page | Description |
|-----|------|-------------|
| `/telecaller` | Dashboard | Assigned members and leads |

### Member Routes

| URL | Page | Description |
|-----|------|-------------|
| `/member` | Dashboard | Digital card, benefits, profile |

### Authentication Routes

| URL | Page | Description |
|-----|------|-------------|
| `/login` | Login | Mobile + password login |
| `/register` | Register | New member registration |

---

## 10. Public Website Links

### Customer-Facing URLs

| URL | Purpose | Description |
|-----|---------|-------------|
| `/` | Homepage | Main website with plans, partners, features |
| `/register` | Registration | Member signup with plan selection |
| `/login` | Login | Member/Admin/Telecaller login |
| `/landing` | Landing Page | Social media campaign landing page |
| `/social` | Landing Page | Alias for landing page |
| `/verify/:memberId` | Verification | QR code scan result page |

### Marketing URLs
- **Main Website**: `https://yourdomain.com/`
- **Registration Link**: `https://yourdomain.com/register`
- **Social Media Landing**: `https://yourdomain.com/landing`
- **Direct Plan Link**: `https://yourdomain.com/register?plan=PLAN_ID`

### QR Code Verification
- When QR code is scanned: `https://yourdomain.com/verify/BITZ-2026-000001`
- Shows member status, plan, and validity

---

## 11. DigitalOcean Deployment Instructions

### Step 1: Create Droplet
```
Image: Ubuntu 22.04 LTS
Size: Basic $12-24/month (2GB RAM minimum)
Datacenter: Choose closest to your users
Authentication: SSH Key (recommended)
```

### Step 2: Initial Server Setup
```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y nginx certbot python3-certbot-nginx git curl

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
npm install -g yarn

# Install Python 3.11
apt install -y python3.11 python3.11-venv python3-pip

# Install MongoDB
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update && apt install -y mongodb-org
systemctl start mongod && systemctl enable mongod
```

### Step 3: Deploy Application
```bash
# Create app directory
mkdir -p /var/www/bitzclub
cd /var/www/bitzclub

# Clone from GitHub
git clone https://github.com/YOUR_USERNAME/bitz-club.git .

# Setup Backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Edit .env with production values
nano .env

# Setup Frontend
cd ../frontend
yarn install
echo "REACT_APP_BACKEND_URL=https://yourdomain.com" > .env
yarn build
```

### Step 4: Restore Database
```bash
cd /var/www/bitzclub/deployment_package/database
mongorestore --db bitz_club ./dump/bitz_club
```

### Step 5: Create Systemd Service
```bash
# Create service file
cat > /etc/systemd/system/bitzclub.service << 'EOF'
[Unit]
Description=BITZ Club Backend
After=network.target mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/bitzclub/backend
Environment="PATH=/var/www/bitzclub/backend/venv/bin"
ExecStart=/var/www/bitzclub/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
chown -R www-data:www-data /var/www/bitzclub

# Enable and start
systemctl daemon-reload
systemctl enable bitzclub
systemctl start bitzclub
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
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/bitzclub/frontend/build;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8001;
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

# Enable site
ln -s /etc/nginx/sites-available/bitzclub /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Restart Nginx
systemctl restart nginx
```

### Step 7: Configure Firewall
```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

### Step 8: Post-Deployment Checklist
- [ ] Change all default passwords
- [ ] Update Razorpay to LIVE keys
- [ ] Set real SMTP password
- [ ] Update CORS_ORIGINS in backend/.env
- [ ] Generate new JWT_SECRET
- [ ] Set up daily database backups
- [ ] Test all features end-to-end

---

## Quick Reference Card

| Item | Value |
|------|-------|
| **Admin Login** | 9999999999 / admin123 |
| **Telecaller Login** | 8888888888 / telecaller123 |
| **Member Login** | 7777777777 / member123 |
| **Database** | bitz_club |
| **Backend Port** | 8001 |
| **Frontend Build** | /frontend/build |
| **Razorpay Mode** | Test (switch to Live for production) |

---

*Document generated: March 11, 2026*
*BITZ Club Membership Management System v1.0*
