# BITZ Club - Environment Variables Reference

## Backend Environment Variables (/backend/.env)

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `bitz_club` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | `your-super-secret-key-here-min-32-characters` |
| `CORS_ORIGINS` | Allowed origins for CORS | `https://yourdomain.com` |

### Razorpay Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_xxxx` (test) or `rzp_live_xxxx` (production) |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `your_razorpay_secret` |

**Getting Razorpay Keys:**
1. Login to https://dashboard.razorpay.com
2. Navigate to Settings > API Keys
3. For testing: Use Test Mode keys
4. For production: Generate Live Mode keys

### SoftSMS Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `SOFTSMS_API_KEY` | SoftSMS API key | `56531040ad016` |
| `SOFTSMS_SENDER_ID` | SMS Sender ID | `BITZCL` |
| `SOFTSMS_API_URL` | SoftSMS API endpoint | `https://softsms.in/app/smsapi/index.php` |

### SMTP Email Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `SENDER_EMAIL` | From email address | `noreply@bitzclub.com` |
| `SMTP_HOST` | SMTP server hostname | `mail.bitzclub.com` |
| `SMTP_PORT` | SMTP port (SSL) | `465` |
| `SMTP_USERNAME` | SMTP username | `noreply@bitzclub.com` |
| `SMTP_PASSWORD` | SMTP password | `your_email_password` |

---

## Frontend Environment Variables (/frontend/.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_BACKEND_URL` | Backend API URL | `https://yourdomain.com` |

---

## Production .env Templates

### Backend Production Template
```env
# Database
MONGO_URL="mongodb://localhost:27017"
DB_NAME="bitz_club"

# Security (CHANGE THIS!)
JWT_SECRET="generate-a-secure-random-string-at-least-32-characters-long"
CORS_ORIGINS="https://yourdomain.com"

# Razorpay (LIVE KEYS)
RAZORPAY_KEY_ID="rzp_live_YOUR_LIVE_KEY"
RAZORPAY_KEY_SECRET="YOUR_LIVE_SECRET"

# SoftSMS
SOFTSMS_API_KEY="56531040ad016"
SOFTSMS_SENDER_ID="BITZCL"
SOFTSMS_API_URL="https://softsms.in/app/smsapi/index.php"

# SMTP
SENDER_EMAIL="noreply@bitzclub.com"
SMTP_HOST="mail.bitzclub.com"
SMTP_PORT=465
SMTP_USERNAME="noreply@bitzclub.com"
SMTP_PASSWORD="YOUR_ACTUAL_PASSWORD"
```

### Frontend Production Template
```env
REACT_APP_BACKEND_URL=https://yourdomain.com
```

---

## Current Test Configuration (DO NOT USE IN PRODUCTION)

### Razorpay Test Keys
```
RAZORPAY_KEY_ID=rzp_test_SPTJ4NnuWHDYRG
RAZORPAY_KEY_SECRET=yvGZt4INIrclxMAdi4uFMnKS
```

**Note:** These are TEST keys. Replace with LIVE keys for production!

---

## Security Recommendations

1. **JWT_SECRET**: Generate using `openssl rand -hex 32`
2. **CORS_ORIGINS**: Set to your exact domain, not `*`
3. **Database**: Consider enabling MongoDB authentication
4. **SMTP_PASSWORD**: Never commit real passwords to version control
5. **Razorpay**: Keep live keys secure, rotate if compromised
