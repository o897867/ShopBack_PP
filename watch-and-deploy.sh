#!/bin/bash

# 监听文件变化并自动构建部署
echo "👀 开始监听前端文件变化..."

cd /root/shopback/ShopBack_PP/front-end

# 使用 inotifywait 监听 src 目录变化
while inotifywait -r -e modify,create,delete ./src; do
    echo ""
    echo "📝 检测到文件变化，开始重新构建..."

    # 构建
    npm run build

    # 部署
    echo "🔄 部署到生产环境..."
    sudo rm -rf /var/www/shopback/*
    sudo cp -r build/* /var/www/shopback/

    echo "✅ 部署完成！$(date '+%Y-%m-%d %H:%M:%S')"
    echo "-----------------------------------"
done
