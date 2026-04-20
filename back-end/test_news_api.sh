#!/bin/bash
# 快速测试新闻 API 端点

BASE_URL="http://localhost:8000"

echo "======================================"
echo "📰 新闻 API 测试脚本"
echo "======================================"
echo ""

# 1. 检查服务状态
echo "1️⃣  检查新闻统计..."
curl -s "$BASE_URL/api/news/stats" | python3 -m json.tool
echo ""
echo ""

# 2. 获取最新新闻（英文）
echo "2️⃣  获取最新新闻（英文总结）..."
curl -s "$BASE_URL/api/news/latest?limit=3&lang=en" | python3 -m json.tool | head -50
echo ""
echo ""

# 3. 获取最新新闻（中文）
echo "3️⃣  获取最新新闻（中文总结）..."
curl -s "$BASE_URL/api/news/latest?limit=3&lang=cn" | python3 -m json.tool | head -50
echo ""
echo ""

# 4. 根据金融产品筛选
echo "4️⃣  筛选黄金相关新闻..."
curl -s "$BASE_URL/api/news/by-symbol/GC1?limit=5" | python3 -m json.tool | head -50
echo ""
echo ""

echo "======================================"
echo "✅ 测试完成"
echo "======================================"
echo ""
echo "提示: 如果看到空数据，可能是:"
echo "  1. 后端服务未启动 (运行: python fapi.py)"
echo "  2. OPENAI_API_KEY 未设置"
echo "  3. InsightSentry WebSocket 尚未推送新闻"
echo ""
echo "查看实时日志: tail -f logs/fapi.log"
