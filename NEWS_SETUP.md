# 金融新闻功能设置指南

## 功能概述

InsightSentry 金融新闻推送 + ChatGPT 自动总结系统已成功集成到后端。

### 功能特性

1. **实时新闻推送**: 通过 InsightSentry WebSocket 接收最新金融新闻
2. **ChatGPT 总结**: 自动为每条新闻生成中英文双语总结
3. **数据库存储**: 新闻和总结存储在 `financial_news` 表中
4. **REST API**: 提供完整的新闻查询接口
5. **WebSocket 推送**: 实时向前端推送新闻更新

## 配置步骤

### 1. 设置 OpenAI API Key

在 `/root/shopback/ShopBack_PP/back-end/.env` 文件中添加：

```bash
# OpenAI API Key (用于新闻总结)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 2. 安装依赖

```bash
cd /root/shopback/ShopBack_PP/back-end
pip install openai>=1.0.0
```

### 3. 启动服务

```bash
cd /root/shopback/ShopBack_PP/back-end
python fapi.py
```

启动日志应包含：
```
📰 初始化金融新闻服务 (InsightSentry News Feed)...
✅ 金融新闻服务已启动 (InsightSentry + ChatGPT)
```

## API 端点

### 1. 获取最新新闻
```
GET /api/news/latest?limit=20&lang=en
```

参数：
- `limit`: 返回数量（1-100，默认20）
- `lang`: 语言偏好（`en` 或 `cn`）

### 2. 根据金融产品筛选
```
GET /api/news/by-symbol/COMEX:GC1!?limit=20
```

### 3. 获取单条新闻详情
```
GET /api/news/{news_id}
```

### 4. WebSocket 实时推送
```
ws://localhost:8000/api/news/ws
```

连接后会自动接收：
- 初始的最新5条新闻
- 实时新闻更新（带总结）
- 心跳消息（每60秒）

### 5. 新闻统计
```
GET /api/news/stats
```

返回：
- 总新闻数
- 今日新闻数
- 已总结新闻数
- WebSocket 活跃连接数

## 数据库表结构

```sql
CREATE TABLE financial_news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    news_id TEXT UNIQUE,              -- 新闻唯一ID
    title TEXT NOT NULL,              -- 标题
    content TEXT,                     -- 内容
    summary TEXT,                     -- 英文总结 (ChatGPT)
    summary_cn TEXT,                  -- 中文总结 (ChatGPT)
    source TEXT,                      -- 来源
    url TEXT,                         -- 原文链接
    published_at TIMESTAMP,           -- 发布时间
    received_at TIMESTAMP,            -- 接收时间
    symbols TEXT,                     -- 相关金融产品 (JSON)
    sentiment TEXT,                   -- 情绪分析
    impact_level TEXT,                -- 影响级别
    raw_data TEXT                     -- 原始数据 (JSON)
);
```

## 测试方法

### 1. 检查服务状态
```bash
curl http://localhost:8000/api/news/stats
```

### 2. 获取最新新闻
```bash
# 英文总结
curl http://localhost:8000/api/news/latest?limit=5&lang=en

# 中文总结
curl http://localhost:8000/api/news/latest?limit=5&lang=cn
```

### 3. WebSocket 测试

使用浏览器控制台：
```javascript
const ws = new WebSocket('ws://localhost:8000/api/news/ws');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};

ws.onopen = () => {
    console.log('Connected to news feed');
};
```

## 工作原理

1. **启动时**: `NewsWebSocketClient` 连接到 `wss://realtime.insightsentry.com/newsfeed`
2. **接收新闻**: 自动接收最新 10 条新闻
3. **ChatGPT 总结**: 对每条新闻调用 OpenAI API 生成双语总结
4. **存储**: 新闻和总结存入 SQLite 数据库
5. **广播**: 通过 WebSocket 实时推送给所有连接的前端客户端

## 前端集成示例

```javascript
// 1. 获取最新新闻
async function fetchLatestNews() {
    const response = await fetch('http://localhost:8000/api/news/latest?limit=10&lang=cn');
    const data = await response.json();
    console.log(data.news);
}

// 2. 实时订阅
const newsWs = new WebSocket('ws://localhost:8000/api/news/ws');

newsWs.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === 'new_news') {
        // 新新闻到达
        console.log('新新闻:', msg.news.title);
        console.log('总结:', msg.news.summary_cn);
    } else if (msg.type === 'initial_news') {
        // 初始新闻列表
        console.log('最新新闻:', msg.news);
    }
};
```

## 费用说明

- **InsightSentry**: 新闻推送包含在现有的 Ultra 计划中
- **OpenAI**: 使用 `gpt-4.1-mini` 模型，每条新闻约 $0.0001-0.0003
- 预估每天 50 条新闻 × $0.0002 = $0.01/天 ≈ $0.30/月

## 故障排查

### 问题1: 新闻服务未启动
- 检查 `OPENAI_API_KEY` 是否设置
- 查看启动日志是否有错误

### 问题2: 没有生成总结
- 确认 OpenAI API key 有效
- 检查 API 配额是否充足
- 查看后端日志中的错误信息

### 问题3: WebSocket 断开
- InsightSentry 有自动重连机制（最多10次）
- 检查网络连接
- 查看后端日志

## 下一步

可以添加的功能：
1. 新闻情绪分析（使用 ChatGPT）
2. 新闻影响级别评估
3. 与特定金融产品关联
4. 新闻通知（邮件/推送）
5. 新闻搜索和过滤
