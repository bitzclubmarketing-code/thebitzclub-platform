# BITZ Club - System Credentials & Access

## Admin Access

### Super Admin (Full Access)
- **Login URL**: https://thebitzclub.com/admin
- **Mobile**: 9999999999
- **Password**: admin123
- **Email**: admin@bitzclub.com

### Alternative Admin Accounts
| Email | Role | Password |
|-------|------|----------|
| priya@bitzclub.com | Admin | (set during creation) |
| raj@bitzclub.com | Admin | (set during creation) |

---

## Server Access

### DigitalOcean Server
- **IP**: 139.59.24.136
- **User**: root
- **SSH**: `ssh root@139.59.24.136`

### Services
| Service | Port | Command |
|---------|------|---------|
| Backend API | 8001 | `sudo systemctl restart bitz-backend` |
| Nginx | 80/443 | `sudo systemctl restart nginx` |
| MongoDB | 27017 | `sudo systemctl restart mongod` |

---

## API Keys & Integrations

### Razorpay (LIVE)
- **Key ID**: rzp_live_SSGM9EfgDl6Y8U
- **Secret**: W6lOWafuYl0Kh8I9WNzeXD3y
- **Dashboard**: https://dashboard.razorpay.com

### Database
- **Type**: MongoDB
- **URL**: mongodb://localhost:27017
- **Database Name**: bitz_club

---

## File Locations on Server

```
/root/bitzclub/
├── backend/
│   ├── server.py          # Main API file
│   ├── requirements.txt   # Python dependencies
│   └── .env               # Environment variables (KEEP SECURE)
├── frontend/
│   ├── src/               # Source code
│   ├── build/             # Production build (served by nginx)
│   ├── package.json       # Node dependencies
│   └── .env               # Frontend environment
└── deploy.sh              # Deployment script
```

---

## Important Commands

```bash
# Restart backend
sudo systemctl restart bitz-backend

# View backend logs
sudo journalctl -u bitz-backend -f

# Restart nginx
sudo systemctl restart nginx

# Rebuild frontend
cd /root/bitzclub/frontend && yarn build

# Full redeploy
cd /root/bitzclub && bash deploy.sh
```

---

## Database Collections

| Collection | Description |
|------------|-------------|
| users | User accounts (login credentials) |
| members | Member profiles and details |
| plans | Membership plans |
| payments | Payment records |
| family_members | Family member details |
| referral_rewards | Referral tracking |
| counters | ID sequence counters |

---

## Backup Commands

```bash
# Backup database
mongodump --db bitz_club --out /root/backups/$(date +%Y%m%d)

# Restore database
mongorestore --db bitz_club /root/backups/YYYYMMDD/bitz_club
```
