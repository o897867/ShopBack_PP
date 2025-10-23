#!/bin/bash

# Broker Logo 上传脚本
# 使用方法: ./upload_broker_logos.sh <logo文件路径>

LOGO_DIR="/root/shopback/ShopBack_PP/front-end/public/broker-logos"

echo "📁 Logo目录: $LOGO_DIR"
echo ""

# 创建目录
mkdir -p "$LOGO_DIR"

echo "请将以下logo文件复制到 $LOGO_DIR 目录:"
echo "  - ecmarket.png (ECMarket logo)"
echo "  - avatrade.png (AvaTrade logo)"
echo "  - ebc.png (EBC logo)"
echo "  - fxcm.png (FXCM logo)"
echo ""

# 检查已存在的logo
echo "当前已有的logo文件:"
ls -lh "$LOGO_DIR" 2>/dev/null || echo "  (目录为空)"
echo ""

# 如果提供了参数,复制文件
if [ $# -gt 0 ]; then
    for file in "$@"; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            cp "$file" "$LOGO_DIR/"
            echo "✅ 已复制: $filename"
        else
            echo "❌ 文件不存在: $file"
        fi
    done

    echo ""
    echo "更新后的logo文件:"
    ls -lh "$LOGO_DIR"
fi

echo ""
echo "提示: 你也可以手动将logo文件上传到服务器的 $LOGO_DIR 目录"
