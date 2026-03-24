# Live Server Fix Instructions - BITZ Club

## Step 1: SSH into your server
```bash
ssh root@139.59.24.136
```

## Step 2: Check Backend Status
```bash
# Check if backend is running
systemctl status bitz-backend

# Check backend logs for errors
journalctl -u bitz-backend -n 50 --no-pager
```

## Step 3: Restart Backend
```bash
# Restart the backend service
systemctl restart bitz-backend

# Wait a few seconds and check status
sleep 3
systemctl status bitz-backend
```

## Step 4: Test Plans API
```bash
# Test if plans API is working
curl -s http://localhost:8001/api/plans?is_active=true | head -200
```

## Step 5: If Plans API Still Not Working - Check Database
```bash
# Check MongoDB status
systemctl status mongod

# If MongoDB is down, restart it
systemctl restart mongod
```

## Step 6: Update Frontend with Dropdown Fix
```bash
# Navigate to frontend directory
cd /path/to/your/app/frontend/src/pages

# Backup existing RegisterPage.js
cp RegisterPage.js RegisterPage.js.backup

# The dropdown code update needs to be applied
# You can either:
# A) Pull from git if you have the repo connected
# B) Manually edit the file

# After updating, rebuild frontend
cd /path/to/your/app/frontend
npm run build

# Restart frontend service
systemctl restart bitz-frontend
```

## Quick One-Liner Fix Commands:
```bash
# Full restart sequence
systemctl restart mongod && sleep 2 && systemctl restart bitz-backend && sleep 3 && curl -s http://localhost:8001/api/plans?is_active=true
```

## Verification
After running the above commands, test:
1. Open your website
2. Go to /register or /join page
3. Plans should load in the dropdown
