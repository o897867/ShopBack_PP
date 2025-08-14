#!/bin/bash

# ShopBack Deployment Script for Nginx

echo "Starting ShopBack deployment..."

# Variables - Update these paths according to your server
FRONTEND_BUILD_DIR="./front-end/build"
NGINX_WEB_ROOT="/var/www/shopback"  # Update this path
NGINX_CONFIG_FILE="./nginx.conf"
NGINX_SITES_DIR="/etc/nginx/sites-available"  # or /etc/nginx/conf.d/
BACKEND_SERVICE_NAME="shopback-api"  # If you're using systemd

echo "Building frontend..."
cd front-end
npm run build
cd ..

echo "📁 Copying frontend files..."
sudo cp -r $FRONTEND_BUILD_DIR/* $NGINX_WEB_ROOT/

echo "Installing nginx configuration..."
sudo cp $NGINX_CONFIG_FILE $NGINX_SITES_DIR/shopback
sudo ln -sf $NGINX_SITES_DIR/shopback /etc/nginx/sites-enabled/shopback

echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx config is valid. Reloading nginx..."
    sudo systemctl reload nginx
else
    echo "Nginx config has errors. Please check the configuration."
    exit 1
fi

echo "Restarting backend service..."
# Option 1: If using systemd service
# sudo systemctl restart $BACKEND_SERVICE_NAME

# Option 2: If running manually, kill and restart
pkill -f "python.*fapi.py"
cd back-end
nohup python3 fapi.py > server.log 2>&1 &
cd ..

echo "Deployment complete!"
echo "Check your application at: http://your-domain.com"
echo "Backend logs: tail -f back-end/server.log"
echo "Nginx logs: sudo tail -f /var/log/nginx/error.log"