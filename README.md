# ShopBack PP — CFD Trading Platform

一体化 CFD 经纪商对比与交易工具平台，涵盖实时行情、交易计算器、金融新闻、社区论坛、周报思维导图等功能。

---

## 功能概览

| 模块 | 说明 | 前端路由 |
|------|------|----------|
| 首页仪表盘 | 平台总览与快速入口 | `#home` |
| 实时行情 | XAU/ETH 实时价格 + WebSocket 推送 | `#orderbook` |
| 交易计算器 | 杠杆 / 保证金 / 盈亏计算 | `#leverage-calculator` |
| 金融新闻 | InsightSentry 实时新闻流 + AI 摘要 | `#news` |
| 社区论坛 | 帖子发布、评论、审核 | `#forum` |
| 每周思维导图 | 周报结构化 → 思维导图可视化 | `/weekly-mindmap` |
| 玄学分析 | 趣味占卜功能 | `#fortune` |
| 健康模块 | 体重 / K线匹配分析 | `#health` |
| 出金汇率 | 每日经纪商出金汇率对比 | `#withdrawal-rate` |
| 流动性危机地图 | 全球流动性可视化 | `#liquidity-crisis` |
| 开户指南 | 经纪商开户步骤图文教程 | `#guide` |
| TradingView | 嵌入式图表 (BTC/forex/黄金等) | `#trading` |

## 技术栈

### 后端
- **FastAPI** + Uvicorn — 异步 API 框架
- **SQLAlchemy** + **SQLite** — 数据存储
- **WebSocket** — XAU/ETH/新闻实时推送
- **InsightSentry API** — 黄金行情 + 金融新闻源
- **Binance WebSocket** — ETH 实时行情
- **Argon2 + JWT** — 用户认证

### 前端
- **React 19** + **Vite** — SPA 框架
- **React Router v7** — 路由（Weekly 模块用 path 路由，其他用 hash 路由）
- **Chart.js** + **react-chartjs-2** — 数据可视化
- **@xyflow/react** (React Flow) — 思维导图画布
- **Zustand** — 状态管理（Weekly 模块）
- **Ant Design** — UI 组件库
- **Framer Motion** — 动画
- **i18n** — 中英文切换

### 基础设施
- **AWS EC2** — 生产部署
- **Nginx** — 反向代理 + 静态资源
- **Docker** — 容器化支持

## 项目结构

```
ShopBack_PP/
├── back-end/
│   ├── fapi.py                    # FastAPI 主应用入口
│   ├── config.py                  # 环境变量 & 应用配置
│   ├── database.py                # 数据库初始化 & 健康检查
│   ├── auth.py / auth_router.py   # JWT 认证
│   ├── forum_api.py               # 论坛 API
│   ├── insightsentry_xau_data.py  # XAU 行情采集 (InsightSentry)
│   ├── insightsentry_news.py      # 金融新闻 WebSocket 客户端
│   ├── binance_eth_data.py        # ETH 行情采集 (Binance)
│   ├── eth_kalman_model.py        # ETH Kalman 滤波模型
│   ├── indicators.py              # 技术指标计算
│   ├── indicator_validity.py      # 指标有效性分析
│   ├── routers/
│   │   ├── calculator_router.py   # 交易计算器
│   │   ├── health_router.py       # 健康模块
│   │   ├── fortune_router.py      # 玄学分析
│   │   ├── news_router.py         # 金融新闻
│   │   └── withdrawal_rate_router.py  # 出金汇率
│   ├── models/
│   │   └── calculator_models.py   # 计算器数据模型
│   ├── services/
│   │   └── calculator_service.py  # 计算器业务逻辑
│   ├── weekly/                    # 周报思维导图模块（独立）
│   │   ├── router.py / crud.py / models.py / schemas.py
│   │   ├── import_service.py      # JSON 导入服务
│   │   └── database.py            # Weekly 独立数据库
│   ├── tests/                     # pytest 测试套件
│   ├── shopback_data.db           # 主数据库（gitignore）
│   └── requirements.txt
├── front-end/
│   ├── src/
│   │   ├── App.jsx                # 主应用 + 路由
│   │   ├── main.jsx               # 入口
│   │   ├── pages/                 # 页面组件
│   │   ├── components/            # 通用组件
│   │   ├── hooks/                 # 自定义 Hooks
│   │   ├── services/              # API 调用层
│   │   ├── translations/          # i18n 翻译
│   │   ├── utils/                 # 工具函数
│   │   └── weekly/                # 周报思维导图前端（独立模块）
│   ├── public/                    # 静态资源 & 经纪商 logo
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 快速开始

### 环境要求
- Python 3.10+
- Node.js 18+
- npm

### 后端

```bash
cd back-end
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入 InsightSentry API Key 等

# 启动
python fapi.py
# API 文档: http://localhost:8001/docs
```

### 前端

```bash
cd front-end
npm install
npm run dev
# 访问: http://localhost:5173
```

## API 端点

启动后端后访问 `http://localhost:8001/docs` 查看完整的 OpenAPI 文档。主要端点：

| 分类 | 端点 | 说明 |
|------|------|------|
| 行情 | `GET /api/xau/current` | 当前黄金价格 |
| 行情 | `WS /ws/xau` | XAU 实时推送 |
| 行情 | `GET /api/eth/current-price` | 当前 ETH 价格 |
| 行情 | `WS /ws/eth/kalman-updates` | ETH 实时推送 |
| 计算器 | `POST /api/leverage/calculate` | 杠杆 / 保证金计算 |
| 新闻 | `GET /api/news` | 金融新闻列表 |
| 新闻 | `WS /ws/news` | 新闻实时推送 |
| 论坛 | `GET /api/forum/posts` | 帖子列表 |
| 认证 | `POST /api/auth/login` | 登录 |
| 出金汇率 | `GET /api/withdrawal-rates` | 汇率查询 |
| 周报 | `GET /api/weekly/reports` | 周报列表 |
| 周报 | `POST /api/weekly/import` | 导入周报 JSON |

## 周报思维导图模块

独立的子模块，将金融博主的每周周报结构化为思维导图。详见 `CLAUDE.md`。

- 前端: `/weekly-mindmap` 路由，支持桌面端 React Flow 画布 + 移动端自适应
- 后端: `/api/weekly` 前缀，独立 SQLite 数据库
- 工作流: 用户在外部 Claude 对话中生成 JSON → 粘贴导入

## 环境变量

后端 `.env` 主要配置项：

```env
DATABASE_PATH=./shopback_data.db
DEBUG=true
PORT=8001

# InsightSentry (行情 + 新闻)
INSIGHTSENTRY_API_KEY=

# 认证
JWT_SECRET_KEY=

# Weekly 模块管理员
WEEKLY_ADMIN_TOKEN=

# OpenAI (新闻摘要)
OPENAI_API_KEY=
```

## License

MIT
