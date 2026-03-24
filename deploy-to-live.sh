#!/bin/bash
# BITZ Club Frontend Deployment Script
# Run this on your DigitalOcean server

# Download the build package from Emergent
cd /tmp
curl -o bitzclub-frontend-build.tar.gz "https://razorpay-vpa-test.preview.emergentagent.com/api/download-build"

# Backup existing build
cp -r /var/www/bitzclub/frontend/build /var/www/bitzclub/frontend/build_backup_$(date +%Y%m%d_%H%M%S)

# Extract new build
tar -xzf bitzclub-frontend-build.tar.gz
cp -r build/* /var/www/bitzclub/frontend/build/

# Restart nginx
systemctl restart nginx

echo "Deployment complete! Please test your website."
