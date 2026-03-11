# BITZ Club - Credentials & Quick Reference

## Login Credentials

### Admin Account (Full Access)
- **Mobile**: 9999999999
- **Password**: admin123
- **Role**: Super Admin
- **Access**: All features, members, plans, partners, reports, CMS

### Telecaller Account
- **Mobile**: 8888888888
- **Password**: telecaller123
- **Role**: Telecaller
- **Access**: Assigned members, leads, follow-ups

### Member Account
- **Mobile**: 7777777777
- **Password**: member123
- **Role**: Member
- **Access**: Personal dashboard, membership card, benefits

---

## API Keys (Current - TEST MODE)

### Razorpay (Test Keys)
```
Key ID: rzp_test_SPTJ4NnuWHDYRG
Secret: yvGZt4INIrclxMAdi4uFMnKS
```
**WARNING**: Replace with LIVE keys for production!

### SoftSMS
```
API Key: 56531040ad016
Sender ID: BITZCL
API URL: https://softsms.in/app/smsapi/index.php
```

### SMTP Email
```
Host: mail.bitzclub.com
Port: 465 (SSL)
Username: noreply@bitzclub.com
Password: [UPDATE WITH REAL PASSWORD]
```

---

## URLs & Endpoints

### Frontend Routes
- `/` - Homepage
- `/login` - User login
- `/register` - Member registration
- `/landing` - Social media landing page
- `/member` - Member dashboard
- `/admin` - Admin dashboard
- `/admin/members` - Members management
- `/admin/plans` - Plans management
- `/admin/partners` - Partners management
- `/admin/leads` - Leads management
- `/admin/reports` - Reports & exports
- `/admin/content` - CMS
- `/telecaller` - Telecaller dashboard
- `/verify/:memberId` - QR verification page

### Key API Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/plans` - List plans
- `GET /api/partners` - List partners
- `POST /api/leads` - Submit lead
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment

---

## Database Info

- **Database Name**: bitz_club
- **Collections**: users, members, plans, partners, payments, leads, experiences, gallery

---

## Important Notes

1. **Change all default passwords** after deployment
2. **Update Razorpay** to LIVE keys for production
3. **Set SMTP password** in backend/.env
4. **Configure CORS** to your actual domain
5. **Generate new JWT_SECRET** for production

---

## Support & Documentation

See included documentation:
- `DEPLOYMENT_GUIDE.md` - Full deployment instructions
- `DATABASE_SCHEMA.md` - Database structure
- `ENVIRONMENT_VARIABLES.md` - All configuration options
