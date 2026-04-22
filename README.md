# ShopBack PP - CFD Trading Toolkit

[English](#english) | [Chinese](#chinese)

---

<a id="english"></a>
## English

An all-in-one CFD trading toolkit featuring real-time quotes, financial news feed, a leverage calculator, weekly report mindmaps, fortune divination, and broker onboarding guides.

### Features

| Module | Description | Route |
|--------|-------------|-------|
| Dashboard | Platform overview and quick entry points | `#home` |
| Real-time Quotes | Live XAU (gold) and ETH prices via WebSocket | `#home` |
| Financial News | AI-summarized market news with bilingual support (CN/EN) | `#news` |
| Order Book | Market depth and order flow visualization | `#orderbook` |
| Leverage Calculator | Margin, leverage and P/L calculations | `#leverage-calculator` |
| Weekly Mindmap | Structured weekly reports as interactive mindmaps | `/weekly-mindmap` |
| Fortune Divination | Fun hexagram-based divination | `#fortune` |
| Broker Guide | Step-by-step broker account opening tutorials | `#guide` |

### Tech Stack

**Backend:** FastAPI, SQLAlchemy, SQLite, WebSocket (XAU/ETH streaming), InsightSentry API, Binance WebSocket, OpenAI API (news summarization)

**Frontend:** React 19, Vite, React Router v7, Chart.js, @xyflow/react (React Flow), Zustand, Ant Design, Framer Motion, i18n (CN/EN)

**Infrastructure:** AWS EC2, Nginx, Docker

### Project Structure

```
ShopBack_PP/
+-- back-end/
|   +-- fapi.py                    # FastAPI main application
|   +-- config.py                  # Environment & app config
|   +-- database.py                # Database init & health checks
|   +-- insightsentry_xau_data.py  # XAU price feed (InsightSentry)
|   +-- insightsentry_news.py      # Financial news WebSocket + GPT summary
|   +-- binance_eth_data.py        # ETH price feed (Binance)
|   +-- routers/
|   |   +-- calculator_router.py   # Leverage calculator
|   |   +-- fortune_router.py      # Fortune divination
|   |   +-- news_router.py         # News API + WebSocket
|   +-- models/
|   |   +-- calculator_models.py   # Calculator data models
|   +-- services/
|   |   +-- calculator_service.py  # Calculator business logic
|   +-- weekly/                    # Weekly mindmap module (isolated)
|   |   +-- router.py / crud.py / models.py / schemas.py
|   |   +-- import_service.py      # JSON import service
|   |   +-- database.py            # Separate SQLite DB
|   +-- requirements.txt
+-- front-end/
|   +-- src/
|   |   +-- App.jsx                # Main app + routing
|   |   +-- pages/                 # Page components
|   |   +-- components/            # Shared components (TopNav, QuoteProfile, etc.)
|   |   +-- hooks/                 # Custom hooks (useLanguage, useXauQuote, etc.)
|   |   +-- translations/          # i18n translations
|   |   +-- weekly/                # Weekly mindmap frontend (isolated)
|   +-- public/                    # Static assets & broker logos
|   +-- package.json
+-- docker-compose.yml
+-- README.md
```

### Quick Start

#### Backend

```bash
cd back-end
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit .env with your API keys
python fapi.py         # API docs: http://localhost:8001/docs
```

#### Frontend

```bash
cd front-end
npm install
npm run dev            # http://localhost:5173
```

### API Endpoints

| Category | Endpoint | Description |
|----------|----------|-------------|
| XAU | `GET /api/xau/current-price` | Current gold price |
| XAU | `GET /api/xau/candles` | Historical OHLCV candles |
| XAU | `WS /ws/xau/price-updates` | Real-time price stream |
| ETH | `GET /api/eth/current-price` | Current ETH price |
| ETH | `GET /api/eth/candles-3m` | 3-min candles |
| ETH | `WS /ws/eth/price-updates` | Real-time ETH stream |
| News | `GET /api/news/latest` | Latest financial news (with AI summaries) |
| News | `GET /api/news/by-symbol/{symbol}` | News filtered by symbol |
| News | `WS /api/news/ws` | Real-time news push |
| Calculator | `POST /api/leverage/calculate` | Leverage / margin calc |
| Fortune | `GET /api/fortune` | Divination |
| Weekly | `GET /api/weekly/reports` | List weekly reports |
| Weekly | `POST /api/weekly/import` | Import report JSON |

Full interactive docs available at `http://localhost:8001/docs` after starting the backend.

### Environment Variables

```env
DATABASE_PATH=./shopback_data.db
DEBUG=true
PORT=8001
INSIGHTSENTRY_API_KEY=       # XAU price data + news feed
OPENAI_API_KEY=              # News summarization (GPT)
JWT_SECRET_KEY=              # (reserved)
WEEKLY_ADMIN_TOKEN=          # Weekly module admin auth
```

### License

MIT

---
<a id="chinese"></a>
## 中文

一站式 CFD 交易工具平台，集成实时行情、金融新闻、杠杆计算器、周报思维导图、随机抽卦、开户指南等功能。

### 功能模块

| 模块 | 说明 | 路由 |
|------|------|------|
| 首页仪表盘 | 平台总览与快速入口 | `#home` |
| 实时行情 | XAU（黄金）/ ETH 实时价格，WebSocket 推送 | `#home` |
| 金融新闻 | AI 智能摘要，中英文双语支持 | `#news` |
| Order Book | 市场深度与订单流可视化 | `#orderbook` |
| 杠杆计算器 | 保证金、杠杆、盈亏计算 | `#leverage-calculator` |
| 周报思维导图 | 金融周报结构化 -> 交互式思维导图 | `/weekly-mindmap` |
| 随机抽卦 | 赣味占卜功能 | `#fortune` |
| 开户指南 | 经纪商开户步骤图文教程 | `#guide` |

### 技术栈

**后端:** FastAPI, SQLAlchemy, SQLite, WebSocket (XAU/ETH 实时流), InsightSentry API, Binance WebSocket, OpenAI API (新闻摘要)

**前端:** React 19, Vite, React Router v7, Chart.js, @xyflow/react (React Flow), Zustand, Ant Design, Framer Motion, 中英文切换

**基础设施:** AWS EC2, Nginx, Docker

### 项目结构

```
ShopBack_PP/
+-- back-end/
|   +-- fapi.py                    # FastAPI 主应用入口
|   +-- config.py                  # 环境变量 & 应用配置
|   +-- database.py                # 数据库初始化 & 健康检查
|   +-- insightsentry_xau_data.py  # XAU 行情采集 (InsightSentry)
|   +-- insightsentry_news.py      # 金融新闻 WebSocket + GPT 摘要
|   +-- binance_eth_data.py        # ETH 行情采集 (Binance)
|   +-- routers/
|   |   +-- calculator_router.py   # 杠杆计算器
|   |   +-- fortune_router.py      # 随机抽卦
|   |   +-- news_router.py         # 新闻 API + WebSocket
|   +-- models/
|   |   +-- calculator_models.py   # 计算器数据模型
|   +-- services/
|   |   +-- calculator_service.py  # 计算器业务逻辑
|   +-- weekly/                    # 周报思维导图模块（独立隔离）
|   |   +-- router.py / crud.py / models.py / schemas.py
|   |   +-- import_service.py      # JSON 导入服务
|   |   +-- database.py            # 独立 SQLite 数据库
|   +-- requirements.txt
+-- front-end/
|   +-- src/
|   |   +-- App.jsx                # 主应用 + 路由
|   |   +-- pages/                 # 页面组件
|   |   +-- components/            # 通用组件 (TopNav, QuoteProfile 等)
|   |   +-- hooks/                 # 自定义 Hooks (useLanguage, useXauQuote 等)
|   |   +-- translations/          # 国际化翻译
|   |   +-- weekly/                # 周报思维导图前端（独立模块）
|   +-- public/                    # 静态资源 & 经纪商 logo
|   +-- package.json
+-- docker-compose.yml
+-- README.md
```

### 快速开始

#### 后端

```bash
cd back-end
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 编辑 .env，填入 API Key
python fapi.py         # API 文档: http://localhost:8001/docs
```

#### 前端

```bash
cd front-end
npm install
npm run dev            # 访问: http://localhost:5173
```

### API 端点

| 分类 | 端点 | 说明 |
|------|------|------|
| 黄金行情 | `GET /api/xau/current-price` | 当前金价 |
| 黄金行情 | `GET /api/xau/candles` | 历史 K 线 |
| 黄金行情 | `WS /ws/xau/price-updates` | 实时推送 |
| ETH | `GET /api/eth/current-price` | 当前 ETH 价格 |
| ETH | `GET /api/eth/candles-3m` | 3 分钟 K 线 |
| ETH | `WS /ws/eth/price-updates` | 实时推送 |
| 新闻 | `GET /api/news/latest` | 最新金融新闻（含 AI 摘要） |
| 新闻 | `GET /api/news/by-symbol/{symbol}` | 按标的物筛选新闻 |
| 新闻 | `WS /api/news/ws` | 实时新闻推送 |
| 计算器 | `POST /api/leverage/calculate` | 杠杆 / 保证金计算 |
| 抽卦 | `GET /api/fortune` | 随机抽卦 |
| 周报 | `GET /api/weekly/reports` | 周报列表 |
| 周报 | `POST /api/weekly/import` | 导入周报 JSON |

启动后端后访问 `http://localhost:8001/docs` 查看完整交互式文档。

### 环境变量

```env
DATABASE_PATH=./shopback_data.db
DEBUG=true
PORT=8001
INSIGHTSENTRY_API_KEY=       # 黄金行情 + 新闻数据
OPENAI_API_KEY=              # 新闻摘要 (GPT)
JWT_SECRET_KEY=              # （预留）
WEEKLY_ADMIN_TOKEN=          # 周报模块管理员鉴权
```

### License

MIT
