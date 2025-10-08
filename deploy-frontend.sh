#!/bin/bash

# 前端自动构建部署脚本
set -e

echo "🚀 开始构建前端..."

# 进入前端目录
cd /root/shopback/ShopBack_PP/front-end

# 构建
echo "📦 正在构建..."
npm run build

# 备份当前版本（可选）
if [ -d "/var/www/shopback" ]; then
    echo "💾 备份当前版本..."
    sudo cp -r /var/www/shopback /var/www/shopback.backup.$(date +%Y%m%d_%H%M%S)

    # 只保留最近3个备份
    ls -t /var/www/shopback.backup.* | tail -n +4 | xargs -r sudo rm -rf
fi

# 部署新版本
echo "🔄 部署到生产环境..."
sudo rm -rf /var/www/shopback/*
sudo cp -r build/* /var/www/shopback/

# 设置权限
sudo chown -R www-data:www-data /var/www/shopback
sudo chmod -R 755 /var/www/shopback

echo "✅ 部署完成！"
echo "🌐 访问: http://$(curl -s ifconfig.me)"
