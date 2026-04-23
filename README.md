# FXLab — Real-Time Market Data Pipeline

A full-stack data platform that ingests real-time gold (XAU/USD) prices and financial news, pipelines them through a batch analytics layer on AWS, and serves computed insights via API. Also ships a CFD trading toolkit frontend for end-user consumption.

```
<img width="2360" height="1640" alt="readme" src="https://github.com/user-attachments/assets/6a594478-03b9-4003-95b0-c89b227976dc" />

```

## Architecture

### Data Flow

1. **Ingest** — Two WebSocket connections stream XAU tick data (InsightSentry) and ETH prices (Binance) into SQLite on EC2. A separate news WebSocket ingests financial headlines, which are summarized by GPT and stored with sentiment/category metadata.

2. **Buffer** — SQLite acts as the operational store. XAU prices are downsampled to 1-minute OHLCV candles (`xau_candles_1m`). News articles are stored with full-text, AI summaries, and classification fields (`financial_news`).

3. **Export (ETL)** — A scheduled job (`export_to_s3.py`) reads new rows from SQLite using a watermark-based incremental strategy, converts to Parquet, and uploads to S3 partitioned by `year/month`.

4. **Analyze** — An AWS Lambda function reads the raw Parquet data from S3, runs statistical analysis (daily stats, volatility, session breakdowns, sentiment aggregation, correlation), and writes JSON result files back to S3.

5. **Serve** — FastAPI reads the pre-computed JSON from S3 with a 5-minute TTL cache and exposes it as REST endpoints. The React frontend renders charts, tables, and analytics dashboards.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Ingestion** | InsightSentry WebSocket, Binance WebSocket, OpenAI API | Real-time price feeds, news stream, AI summarization |
| **Buffer** | SQLite, SQLAlchemy | Low-latency operational store on EC2 |
| **Export** | pandas, PyArrow, boto3 | Incremental ETL from SQLite to S3 Parquet |
| **Storage** | AWS S3 (`fxlab-data-lake`) | Raw data lake (Parquet) + computed results (JSON) |
| **Processing** | AWS Lambda (Python) | Batch analytics — volatility, sessions, sentiment, correlation |
| **Scheduling** | systemd timer + direct Lambda invoke | Daily pipeline orchestration (04:45 UTC) |
| **Serving** | FastAPI, WebSocket | REST API + real-time price/news push |
| **Frontend** | React 19, Vite, Chart.js | Dashboard, analytics views, trading tools |
| **Infra** | AWS EC2, Nginx, Docker | Hosting + reverse proxy |

## Data Pipeline Design Decisions

### Watermark-Based Incremental Load

The export script does **not** do full-table scans on every run. It maintains a watermark file on S3 (`metadata/last_export.json`) tracking the last exported `open_time` for XAU candles and `id` for news articles. Each run queries only rows beyond those watermarks.

```json
// metadata/last_export.json
{ "xau_last_open_time": 1713484800000, "news_last_id": 4523 }
```

### Partitioning Strategy — Year/Month

Parquet files on S3 are partitioned by `year` and `month`:

```
raw/xau/candles_1m/year=2026/month=04/xau_1m_2026-04.parquet
raw/news/year=2026/month=04/news_2026-04.parquet
```

**Why year/month, not daily?** At ~1,440 candles/day, daily partitions would produce many small files (~50 KB each). Monthly partitions stay in the 1-5 MB sweet spot for Parquet, reducing S3 LIST overhead and keeping Lambda read times fast. If data volume grew 100x, daily or hourly partitions would be the next step.

### Idempotent Export

The export uses **merge-on-upload**: when a partition file already exists on S3, the script downloads it, concatenates the new rows, deduplicates on the primary key (`open_time` for XAU, `id` for news), and re-uploads. This means re-running the export with the same watermark produces the same result.

### Why Lambda Does Full Recompute

The Lambda analytics step reads the **entire** raw dataset each run and recomputes all metrics from scratch. This is a deliberate choice:

- The full dataset is small (~2 MB of Parquet for a year of 1-min candles)
- Statistical aggregations (rolling volatility, session breakdowns, correlation matrices) are inherently full-pass operations
- Full recompute eliminates state management bugs — every run is a clean slate
- Lambda execution stays under 30 seconds, well within the 15-minute limit

### Serial Pipeline, No DAG Orchestrator

The pipeline runs as a simple serial chain:

```
systemd timer (04:45 UTC)
  └─► export_to_s3.py (SQLite → S3 Parquet)
        └─► boto3 Lambda invoke (async)
              └─► analytics Lambda (S3 Parquet → S3 JSON)
```

No Airflow, no Step Functions. The export script directly invokes Lambda via `boto3` after a successful upload, ensuring the analysis always runs on fresh data. This is appropriate for a two-step pipeline with a single data source.

## Analytics Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/analytics/xau/daily-stats` | Daily OHLC stats and moving averages |
| `GET /api/analytics/xau/volatility` | Intraday and rolling volatility |
| `GET /api/analytics/xau/sessions` | Performance by trading session (Asia/London/NY) |
| `GET /api/analytics/xau/weekly` | Weekly aggregation and trends |
| `GET /api/analytics/news/sentiment` | Sentiment distribution over time |
| `GET /api/analytics/news/categories` | Article categorization breakdown |
| `GET /api/analytics/news/correlation` | News sentiment vs. XAU price correlation |
| `GET /api/analytics/news/symbols` | Most-mentioned symbols and frequency |
| `GET /api/analytics/status` | Pipeline health: last export time, record counts |

## Known Limitations & Roadmap

**Current gaps (honest assessment):**

- **No dead-letter queue.** If the export script fails mid-upload, the watermark isn't advanced (safe), but there's no DLQ or retry mechanism — it simply waits for the next daily run.
- **No alerting.** Pipeline failures are only visible in `journalctl` logs on EC2. No CloudWatch alarms, no Slack/email notifications.
- **No data validation layer.** The export trusts SQLite data integrity. There are no schema checks, row count assertions, or anomaly detection between export and analysis.
- **Single-region, single-instance.** SQLite on one EC2 instance is a single point of failure. If the instance goes down, ingestion and export both stop.
- **No backfill tooling.** Re-processing historical data requires manual intervention (reset watermark, re-run export).

**Potential improvements:**

- [ ] CloudWatch alarms on Lambda errors + SNS notifications
- [ ] DLQ (SQS) for failed Lambda invocations
- [ ] Data quality checks between export and analysis (row counts, null rates, freshness)
- [ ] Migrate from SQLite to RDS/Aurora for HA ingestion
- [ ] Add Athena integration for ad-hoc queries on the S3 data lake
- [ ] Parameterize backfill: `export_to_s3.py --backfill --from 2026-01-01 --to 2026-03-31`

---

## CFD Trading Toolkit

The platform also serves as an end-user trading toolkit with the following modules:

| Module | Description | Route |
|--------|-------------|-------|
| Dashboard | Platform overview and quick entry points | `#home` |
| Real-time Quotes | Live XAU and ETH prices via WebSocket | `#home` |
| Financial News | AI-summarized market news with bilingual support (CN/EN) | `#news` |
| Order Book | Market depth and order flow visualization | `#orderbook` |
| Leverage Calculator | Margin, leverage, and P/L calculations | `#leverage-calculator` |
| Analytics | XAU price analysis and news sentiment dashboard | `#analytics` |
| Weekly Mindmap | Structured weekly reports as interactive mindmaps | `/weekly-mindmap` |
| Broker Guide | Step-by-step broker account opening tutorials | `#guide` |

## Project Structure

```
ShopBack_PP/
├── back-end/
│   ├── fapi.py                        # FastAPI main application
│   ├── database.py                    # SQLite init & connection management
│   ├── insightsentry_xau_data.py      # XAU price ingestion (WebSocket)
│   ├── insightsentry_news.py          # News ingestion + GPT summarization
│   ├── binance_eth_data.py            # ETH price ingestion (Binance WS)
│   ├── routers/
│   │   ├── analytics_router.py        # Analytics API (reads S3 JSON)
│   │   ├── news_router.py             # News API + WebSocket
│   │   ├── calculator_router.py       # Leverage calculator
│   │   └── fortune_router.py          # Fortune divination
│   ├── analytics/
│   │   ├── config.py                  # S3 bucket, region, paths
│   │   ├── export_to_s3.py            # ETL: SQLite → Parquet → S3
│   │   └── setup_scheduler.sh         # systemd timer setup
│   ├── weekly/                        # Weekly mindmap module (isolated)
│   └── requirements.txt
├── back-end/lambda/analytics/
│   ├── handler.py                     # Lambda entry point
│   ├── xau_analysis.py                # XAU statistical analysis
│   └── news_analysis.py               # News sentiment analysis
├── front-end/
│   ├── src/
│   │   ├── App.jsx                    # Main app + routing
│   │   ├── pages/
│   │   │   ├── Analytics.jsx          # Analytics dashboard
│   │   │   └── ...                    # Other page components
│   │   ├── components/                # Shared UI components
│   │   ├── hooks/                     # Custom hooks
│   │   └── weekly/                    # Weekly mindmap frontend
│   └── package.json
├── docker-compose.yml
└── deploy.sh                          # Frontend build + Nginx + backend restart
```

## Quick Start

### Backend

```bash
cd back-end
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in API keys
python fapi.py         # http://localhost:8001/docs
```

### Frontend

```bash
cd front-end
npm install
npm run dev            # http://localhost:5173
```

### Run Analytics Export (manual)

```bash
cd back-end
python -m analytics.export_to_s3              # export all
python -m analytics.export_to_s3 --table xau  # export XAU only
python -m analytics.export_to_s3 --table news # export news only
```

### Set Up Scheduled Export

```bash
sudo bash back-end/analytics/setup_scheduler.sh
systemctl status analytics-export.timer       # verify
```

## Environment Variables

```env
# Core
DATABASE_PATH=./shopback_data.db
PORT=8001

# Data Sources
INSIGHTSENTRY_API_KEY=           # XAU price data + news feed
OPENAI_API_KEY=                  # News summarization (GPT)

# Analytics Pipeline
ANALYTICS_S3_BUCKET=fxlab-data-lake
ANALYTICS_S3_REGION=ap-southeast-2
ANALYTICS_LAMBDA_NAME=analytics-pipeline

# Auth
WEEKLY_ADMIN_TOKEN=              # Weekly mindmap admin
```

## License

MIT

---

# FXLab — 实时市场数据管线

全栈数据平台：实时采集黄金 (XAU/USD) 价格与金融新闻，经 AWS 批处理分析后，通过 API 提供计算洞察。同时附带一套面向终端用户的 CFD 交易工具前端。

```
                          ┌──────────────────────────────────────────────────┐
                          │                   数据流                         │
                          │                                                  │
  InsightSentry WS ──►  FastAPI  ──► SQLite  ──► Parquet ──► S3 raw/        │
  Binance WS ─────────►  (EC2)      (缓冲层)    (导出)     fxlab-data-lake │
                            │                                   │            │
                            │                              Lambda            │
                            │                            (分析计算)          │
                            │                                   │            │
                            │                              S3 analysis/      │
                            │                              *.json            │
                            │◄──────── 读取缓存 JSON ──────────┘            │
                            │                                                │
                            ▼                                                │
                      React 前端                                             │
                    (行情、新闻、图表、                                      │
                     分析仪表盘)                                             │
                          └──────────────────────────────────────────────────┘
```

## 架构

### 数据流

1. **采集** — 两条 WebSocket 连接分别接收 XAU 行情 (InsightSentry) 和 ETH 价格 (Binance)，写入 EC2 上的 SQLite。另一条新闻 WebSocket 采集金融头条，经 GPT 生成摘要后连同情绪/分类元数据一并存储。

2. **缓冲** — SQLite 作为操作层数据库。XAU 价格降采样为 1 分钟 OHLCV K 线 (`xau_candles_1m`)。新闻以全文、AI 摘要和分类字段存储 (`financial_news`)。

3. **导出 (ETL)** — 定时任务 (`export_to_s3.py`) 基于水位线增量策略读取 SQLite 新数据，转换为 Parquet 格式，按 `year/month` 分区上传至 S3。

4. **分析** — AWS Lambda 从 S3 读取原始 Parquet 数据，运行统计分析（日统计、波动率、交易时段拆分、情绪聚合、相关性），将 JSON 结果文件写回 S3。

5. **服务** — FastAPI 以 5 分钟 TTL 缓存从 S3 读取预计算 JSON，通过 REST 端点对外暴露。React 前端渲染图表、表格和分析仪表盘。

## 技术栈

| 层级 | 技术 | 用途 |
|------|-----|------|
| **采集** | InsightSentry WebSocket, Binance WebSocket, OpenAI API | 实时行情、新闻流、AI 摘要 |
| **缓冲** | SQLite, SQLAlchemy | EC2 上的低延迟操作层存储 |
| **导出** | pandas, PyArrow, boto3 | SQLite 到 S3 Parquet 的增量 ETL |
| **存储** | AWS S3 (`fxlab-data-lake`) | 原始数据湖 (Parquet) + 计算结果 (JSON) |
| **处理** | AWS Lambda (Python) | 批量分析 — 波动率、交易时段、情绪、相关性 |
| **调度** | systemd timer + 直接 Lambda 调用 | 每日管线编排 (04:45 UTC) |
| **服务层** | FastAPI, WebSocket | REST API + 实时行情/新闻推送 |
| **前端** | React 19, Vite, Chart.js | 仪表盘、分析视图、交易工具 |
| **基础设施** | AWS EC2, Nginx, Docker | 托管 + 反向代理 |

## 数据管线设计决策

### 基于水位线的增量加载

导出脚本**不做**每次全表扫描。它在 S3 上维护一个水位线文件 (`metadata/last_export.json`)，分别记录 XAU K 线的最后 `open_time` 和新闻的最后 `id`。每次只查询水位线之后的新数据。

```json
// metadata/last_export.json
{ "xau_last_open_time": 1713484800000, "news_last_id": 4523 }
```

### 分区策略 — 按年/月

S3 上的 Parquet 文件按 `year` 和 `month` 分区：

```
raw/xau/candles_1m/year=2026/month=04/xau_1m_2026-04.parquet
raw/news/year=2026/month=04/news_2026-04.parquet
```

**为什么不按天分区？** 按每天约 1,440 条 K 线计算，日分区会产生大量小文件 (~50 KB)。月分区保持在 1-5 MB 的 Parquet 最优区间，减少 S3 LIST 开销，Lambda 读取也更快。如果数据量增长 100 倍，可以切换到日/小时分区。

### 幂等导出

导出采用**合并上传**策略：当 S3 上已存在分区文件时，脚本会下载已有文件，拼接新数据行，按主键去重 (`open_time` 或 `id`)，再重新上传。同一份数据重复导出，结果不变。

### Lambda 全量重算的原因

Lambda 分析步骤每次读取**全部**原始数据，从零重算所有指标。这是刻意的设计：

- 全量数据很小（一年的 1 分钟 K 线约 2 MB Parquet）
- 滚动波动率、交易时段拆分、相关性矩阵等统计本身就是全量操作
- 全量重算消除了状态管理 bug — 每次都是干净计算
- Lambda 执行时间 < 30 秒，远低于 15 分钟上限

### 串行管线，无 DAG 编排器

管线以简单串行链运行：

```
systemd timer (04:45 UTC)
  └─► export_to_s3.py (SQLite → S3 Parquet)
        └─► boto3 Lambda invoke (异步)
              └─► analytics Lambda (S3 Parquet → S3 JSON)
```

不用 Airflow，不用 Step Functions。导出脚本在上传成功后直接通过 `boto3` 调用 Lambda，确保分析始终跑在最新数据上。对于单数据源的两步管线，这已足够。

## 分析 API 端点

| 端点 | 说明 |
|------|------|
| `GET /api/analytics/xau/daily-stats` | 日 OHLC 统计与移动均线 |
| `GET /api/analytics/xau/volatility` | 日内及滚动波动率 |
| `GET /api/analytics/xau/sessions` | 按交易时段 (亚洲/伦敦/纽约) 拆分表现 |
| `GET /api/analytics/xau/weekly` | 周聚合与趋势 |
| `GET /api/analytics/news/sentiment` | 情绪分布时间序列 |
| `GET /api/analytics/news/categories` | 文章分类占比 |
| `GET /api/analytics/news/correlation` | 新闻情绪 vs XAU 价格相关性 |
| `GET /api/analytics/news/symbols` | 高频提及标的物 |
| `GET /api/analytics/status` | 管线状态：上次导出时间、记录数 |

## 已知局限与路线图

**现状（坦诚评估）：**

- **无死信队列。** 导出脚本如果中途失败，水位线不会前进（安全的），但没有 DLQ 或重试机制 — 只能等下一次每日执行。
- **无告警。** 管线故障只能在 EC2 的 `journalctl` 日志里看到。没有 CloudWatch 告警，没有 Slack/邮件通知。
- **无数据验证层。** 导出信任 SQLite 数据完整性，没有 schema 校验、行数断言或异常检测。
- **单区域、单实例。** 一台 EC2 上的 SQLite 是单点故障。实例宕机，采集和导出同时中断。
- **无回填工具。** 重新处理历史数据需要手动操作（重置水位线，重跑导出）。

**改进计划：**

- [ ] Lambda 错误的 CloudWatch 告警 + SNS 通知
- [ ] Lambda 调用失败的 DLQ (SQS)
- [ ] 导出与分析之间的数据质量检查（行数、空值率、新鲜度）
- [ ] 从 SQLite 迁移到 RDS/Aurora 实现高可用采集
- [ ] 接入 Athena 对 S3 数据湖做即席查询
- [ ] 参数化回填：`export_to_s3.py --backfill --from 2026-01-01 --to 2026-03-31`

---

## CFD 交易工具

平台同时提供面向终端用户的交易工具：

| 模块 | 说明 | 路由 |
|------|------|------|
| 首页仪表盘 | 平台总览与快速入口 | `#home` |
| 实时行情 | XAU / ETH 实时价格，WebSocket 推送 | `#home` |
| 金融新闻 | AI 摘要，中英双语 | `#news` |
| Order Book | 市场深度与订单流可视化 | `#orderbook` |
| 杠杆计算器 | 保证金、杠杆、盈亏计算 | `#leverage-calculator` |
| 数据分析 | XAU 行情分析与新闻情绪仪表盘 | `#analytics` |
| 周报思维导图 | 金融周报结构化为交互式思维导图 | `/weekly-mindmap` |
| 开户指南 | 经纪商开户步骤图文教程 | `#guide` |

## 快速开始

### 后端

```bash
cd back-end
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 填入 API Key
python fapi.py         # http://localhost:8001/docs
```

### 前端

```bash
cd front-end
npm install
npm run dev            # http://localhost:5173
```

### 手动运行分析导出

```bash
cd back-end
python -m analytics.export_to_s3              # 导出全部
python -m analytics.export_to_s3 --table xau  # 仅导出 XAU
python -m analytics.export_to_s3 --table news # 仅导出新闻
```

### 配置定时导出

```bash
sudo bash back-end/analytics/setup_scheduler.sh
systemctl status analytics-export.timer       # 验证
```

## 环境变量

```env
# 核心
DATABASE_PATH=./shopback_data.db
PORT=8001

# 数据源
INSIGHTSENTRY_API_KEY=           # XAU 行情 + 新闻数据
OPENAI_API_KEY=                  # 新闻摘要 (GPT)

# 分析管线
ANALYTICS_S3_BUCKET=fxlab-data-lake
ANALYTICS_S3_REGION=ap-southeast-2
ANALYTICS_LAMBDA_NAME=analytics-pipeline

# 鉴权
WEEKLY_ADMIN_TOKEN=              # 周报模块管理员
```

## 许可证

MIT
