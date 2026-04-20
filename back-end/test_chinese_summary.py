#!/usr/bin/env python3
"""
测试新闻中文摘要功能
"""

import asyncio
import json
import os
import sys
sys.path.insert(0, '/root/shopback/ShopBack_PP/back-end')
from insightsentry_news import NewsWebSocketClient
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

async def test_chinese_summary():
    """测试中文摘要生成"""

    # 从环境变量获取API密钥
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        print("❌ 请设置 OPENAI_API_KEY 环境变量")
        return

    # 创建客户端实例（不需要真实的InsightSentry API key进行测试）
    client = NewsWebSocketClient(
        api_key="test",
        openai_api_key=openai_key,
        db_path="test_news.db"
    )

    # 测试新闻样本
    test_news = {
        'title': 'Federal Reserve Signals Potential Rate Cut in Coming Months',
        'content': 'The Federal Reserve hinted at a potential interest rate cut in the coming months as inflation shows signs of cooling. Chair Jerome Powell stated that the central bank is closely monitoring economic indicators and remains data-dependent in its policy decisions.',
        'symbols': ['DXY', 'EURUSD'],
        'source': 'Test Source'
    }

    print("📰 测试新闻:")
    print(f"   标题: {test_news['title']}")
    print(f"   内容: {test_news['content'][:100]}...")
    print()

    print("🤖 正在生成摘要（可能需要多次尝试以获取中文翻译）...")

    # 调用摘要函数
    result = await client.summarize_with_chatgpt(test_news)

    print("\n✅ 生成结果:")
    print(json.dumps(result, ensure_ascii=False, indent=2))

    # 检查是否有中文摘要
    if result.get('summary_cn'):
        has_chinese = any('\u4e00' <= char <= '\u9fff' for char in result['summary_cn'])
        if has_chinese:
            print("\n✅ 成功生成中文摘要!")
            print(f"   中文摘要: {result['summary_cn']}")
        else:
            print("\n⚠️ 返回了summary_cn字段，但不包含中文字符")
            print(f"   summary_cn: {result['summary_cn']}")
    else:
        print("\n❌ 未能生成中文摘要")

    # 测试第二条新闻
    print("\n" + "="*50)
    test_news2 = {
        'title': 'Gold Prices Surge to New High Amid Economic Uncertainty',
        'content': 'Gold prices reached a new all-time high today as investors seek safe-haven assets amid growing economic uncertainty. The precious metal climbed above $2,100 per ounce, driven by concerns over inflation and geopolitical tensions.',
        'symbols': ['XAU', 'GOLD'],
        'source': 'Test Source'
    }

    print("\n📰 测试新闻2:")
    print(f"   标题: {test_news2['title']}")
    print(f"   内容: {test_news2['content'][:100]}...")
    print()

    print("🤖 正在生成摘要...")

    result2 = await client.summarize_with_chatgpt(test_news2)

    print("\n✅ 生成结果:")
    print(json.dumps(result2, ensure_ascii=False, indent=2))

    if result2.get('summary_cn'):
        has_chinese = any('\u4e00' <= char <= '\u9fff' for char in result2['summary_cn'])
        if has_chinese:
            print("\n✅ 成功生成中文摘要!")
            print(f"   中文摘要: {result2['summary_cn']}")
        else:
            print("\n⚠️ 返回了summary_cn字段，但不包含中文字符")

    # 清理测试数据库
    if os.path.exists("test_news.db"):
        os.remove("test_news.db")
        print("\n🗑️ 已清理测试数据库")

if __name__ == "__main__":
    asyncio.run(test_chinese_summary())