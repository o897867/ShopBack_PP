# ShopBack Cashback Management Platform

> In a Nutshell
>
> AI-powered cashback monitoring platform using Bayesian prediction to help you catch the highest cashback rates at the optimal time.

---

## Table of Contents

1. [Core Highlights](#core-highlights)
2. [Project Overview](#project-overview)
3. [System Architecture](#system-architecture)
4. [Features](#features)
5. [Technology Stack](#technology-stack)
6. [Data Engineering](#data-engineering)
7. [Installation Guide](#installation-guide)
8. [API Documentation](#api-documentation)
9. [User Guide](#user-guide)
10. [Configuration](#configuration)
11. [Troubleshooting](#troubleshooting)
12. [Project Structure](#project-structure)
13. [Adding New Features](#adding-new-features)
14. [License](#license)
15. [Contributing](#contributing)
16. [Support](#support)

## Core Highlights

- AI Prediction Engine: Self-adaptive Bayesian model that analyzes historical patterns to predict optimal timing.
- Smart Analytics: Real-time multi-platform analysis with anomaly and trend detection.
- Automated Operations: Auto-updating and training models; no manual intervention needed.
- Precision Alerts: Probability-based alerts that ensure you never miss upsized cashback.
- Multi-Platform Integration: Supports ShopBack and CashRewards in one unified workflow.

## Project Overview

The ShopBack Cashback Management Platform is a comprehensive cashback monitoring and management system that supports multi-platform data scraping (ShopBack and CashRewards). The platform provides real-time monitoring, price alerts, platform comparison, and trading charts.

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         User Interface (UI)                      │
│            React + Vite + TradingView Charts + Recharts          │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────▼───────────────────────────────────────┐
│                           API Gateway                            │
│                        FastAPI + CORS                            │
├──────────────────────────────────────────────────────────────────┤
│                           Core Services                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Bayesian Model  │  │ Smart Alerts    │  │ Platform Compare│  │
│  │ Prediction      │  │ + Email         │  │ (SB vs CR)      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                      Data & Storage (SQLite)                      │
│  Stores, Cashback History, Rate Statistics, Alerts, Metrics       │
└──────────────────────────────────────────────────────────────────┘
```

## Features

- Multi-platform support: ShopBack and CashRewards
- Real-time data scraping: Asynchronous batch collection of cashback data
- Platform comparison: Compare the same store rates across platforms
- Price alerts: Email notifications for rate changes
- Data visualization: Historical trends and statistics
- Trading charts: TradingView integration
- Data management: Store management and historical queries

## Technology Stack

### Frontend
- React 19.1.0 – UI framework
- Vite – Modern build tool
- Recharts 3.1.0 – Data visualization
- TradingView – Trading charts
- React Hooks – State management

### Backend
- FastAPI – High-performance async API framework
- Pydantic – Data validation
- aiohttp – Asynchronous HTTP client
- BeautifulSoup4 – HTML parsing
- SQLite – Lightweight database
- smtplib – Email sending

### AI & Machine Learning
- Bayesian statistics – Probabilistic prediction modeling
- NumPy – Scientific computing
- SciPy – Advanced mathematical algorithms
- Adaptive learning – Self-optimizing models
- Posterior distribution – Dynamic parameter updates

### Data Processing
- Async scraping engine – High-concurrency data collection
- APScheduler / schedule – Task scheduling
- JSON – Model persistence
- Logging – Log management

## Data Engineering

This project includes a production-grade ingestion, transformation, storage, and orchestration layer that demonstrates practical data engineering skills. The components below are implemented and runnable locally.

### Pipeline Overview
- Web scraping ingestion: Asynchronous, concurrent collectors for ShopBack and CashRewards with robust HTML parsing and platform-specific logic. See `back-end/sb_scrap.py:45`, `back-end/sb_scrap.py:185`, and `back-end/sb_scrap.py:903`.
- Batch CSV ingestion: Deterministic importers for broker regulations and ratings to seed and enrich the warehouse. See `back-end/add_brokers_from_csv.py:129` and `back-end/import_broker_ratings.py:100`.
- Derived metrics: After ingestion, statistics like current/high/low cashback rates are computed and maintained incrementally. See `back-end/sb_scrap.py:812` and `back-end/sb_scrap.py:865`.
- Streaming updates: Real‑time ETH model updates over WebSocket for analytics UX, demonstrating streaming ingestion + fan‑out. See `back-end/fapi.py:264` and `back-end/fapi.py:393`.

### Storage & Data Modeling
- Engine: SQLite for local development with strict row factories, indexes, and uniqueness constraints. Core init: `back-end/database.py:19`.
- Operational tables (CFD/Forum/Auth): Created in `back-end/database.py` (e.g., `cfd_brokers`, `cfd_broker_news`, `leverage_*`).
- Analytics tables (cashback): Created and managed in `back-end/sb_scrap.py` (`stores`, `cashback_history`, `rate_statistics`, `price_alerts`, `performance_metrics`). Example DDL with a CHECK constraint: `back-end/sb_scrap.py:302`.
- Platform-aware modeling: Backfilled and maintained `platform` column across related tables for multi-source attribution. Migration utility: `back-end/sb_scrap.py:413`.

### Transformations & Business Logic
- Normalization: Consistent numeric extraction for percent/currency rates with resilient parsing. `back-end/sb_scrap.py:475`.
- Incremental stats: Rolling high/low/current statistics per store/category updated in-place. `back-end/sb_scrap.py:812` and `back-end/sb_scrap.py:865`.
- Cross-source comparison: Compare the same merchant across platforms (ShopBack vs CashRewards). `back-end/sb_scrap.py:515`.
- Ratings enrichment: Weighted scoring and JSON-structured breakdowns applied during import. `back-end/import_broker_ratings.py:61` and `back-end/import_broker_ratings.py:80`.

### Orchestration & Scheduling
- Lightweight scheduler: Recurring jobs for data checks, low-confidence retraining, full retrains, cleanup, and validation using `schedule`. See `back-end/model_scheduler.py:33`, `back-end/model_scheduler.py:76`, `back-end/model_scheduler.py:174`, and `back-end/model_scheduler.py:205`.
- Operational metrics: Scheduler exposes status, update counts, error tracking, and next run times. `back-end/model_scheduler.py:289`.

### Observability & Performance
- Persistence of ingestion and alert pipeline metrics (p95, min/max, successes/failures, concurrency, daily deltas). `back-end/sb_scrap.py:361`.
- Targeted indexing on hot paths for query speed (IDs, timestamps, platform, composite keys). See index creation in `back-end/sb_scrap.py` and `back-end/database.py`.
- Defensive parsing with structured logging for successful and failed extractions.

### Data Quality & Governance
- Schema constraints: Uniqueness on `(name, url, platform)` and validated `threshold_type` via CHECK constraint. `back-end/sb_scrap.py:302`.
- Safe migrations: In-place schema evolution for multi-platform support with idempotent checks. `back-end/sb_scrap.py:413`.
- Post‑load verification: Importers include verification passes and sample outputs for quick sanity checks. `back-end/import_broker_ratings.py:173`.

### Reproducible Local Runs (Quickstart)
1) Initialize environment and backend (creates DB schema on startup):
   - `python3 -m venv .venv && source .venv/bin/activate`
   - `pip install -r back-end/requirements.txt`
   - `python back-end/fapi.py` (once) to initialize core tables

2) Seed and enrich analytics data:
   - Import broker entities and regulators: `python back-end/add_brokers_from_csv.py`
   - Import ratings with weighted breakdowns: `python back-end/import_broker_ratings.py`

3) Run scheduled model/data maintenance (optional):
   - `cd back-end && python model_scheduler.py` (keeps periodic jobs running; Ctrl+C to stop)

4) Run ingestion (scraping) ad‑hoc or from your services:
   - Use `ShopBackSQLiteScraper` programmatically to scrape URLs and persist results. Entrypoints: `back-end/sb_scrap.py:185` and `back-end/sb_scrap.py:903`.

### Source Data Artifacts
- Regulatory and rating sources: `Brokers_Regulation_WithNewAdds.csv`, `Broker_Scoring.csv` (root directory).
- Example generator scripts for rebate workflows: `generate_rebate_csv.py`, `generate_rebate_template.py` (root).

### Notes on Scaling
- The current design cleanly separates ingestion, transformation, storage, and orchestration, making it straightforward to swap SQLite for PostgreSQL and to lift jobs into Prefect/Airflow or containers. The schema migration utilities and explicit indexes are intended to support this evolution path without code churn.

## Installation Guide

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
cd back-end
pip install -r requirements.txt

# Start backend server
python fapi.py
```

### Frontend Installation

```bash
# Install frontend dependencies
cd front-end/shopback-frontend
npm install

# Start development server
npm start
```

### Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Docs (OpenAPI): http://localhost:8001/docs

## API Documentation

### Core Endpoints (Cashback)

Dashboard Data
```http
GET /api/dashboard
```

Response Example:
```json
{
  "total_stores": 25,
  "total_records": 1250,
  "recent_scrapes": 45,
  "upsized_stores": 3,
  "avg_cashback_rate": 4.2
}
```

Store Management
```http
GET /api/stores?limit=50&offset=0&search=amazon

POST /api/add-store
Content-Type: application/json
{
  "url": "https://www.shopback.com.au/amazon-australia"
}
```

Platform Comparison
```http
GET /api/compare/{store_name}
GET /api/compare-all
```

Price Alerts
```http
POST /api/alerts
Content-Type: application/json
{
  "user_email": "user@example.com",
  "store_url": "https://www.shopback.com.au/amazon-australia",
  "threshold_type": "above_current",
  "threshold_value": 5.0
}

GET /api/alerts?email=user@example.com
```

Data Scraping
```http
POST /api/rescrape-all
POST /api/scrape
Content-Type: application/json
{
  "url": "https://www.shopback.com.au/amazon-australia"
}
```

### ETH Streaming (Analytics)
```http
GET  /api/eth/current-price
GET  /api/eth/predictions
GET  /api/eth/candles-3m
GET  /api/eth/model/metrics
WS   /ws/eth/kalman-updates
```

## User Guide

### Dashboard Features
1. Statistics Overview: View total stores, records, recent scrapes, and upsized stores
2. Average Rate: Display average cashback rate across all stores
3. Upsized Stores: View stores with current special offers
4. Platform Comparison: Compare rates for the same store across platforms

### Store Management

Adding New Stores
1. Find the “Add New Store” form in the store list section
2. Enter a valid ShopBack or CashRewards store URL
3. Click “Add”
4. The system will automatically scrape the data

Viewing Store Details
1. Click on any store item
2. View detailed cashback history
3. View historical high/low data
4. View rates for different categories

### Price Alerts

Setting Up Alerts
1. Click “Price Alert Management”
2. Enter your email address
3. Fill in the store URL and alert conditions
4. Select alert type:
   - Above Current: Alert when rate exceeds specified value
   - Fixed Value: Alert when rate reaches specified value
   - Percentage Increase: Alert when rate increase reaches specified percentage

### Trading Charts
1. Click the “TradingView” tab
2. Select trading pairs (BTC/USDT, forex, gold, etc.)
3. Choose theme (dark/light)
4. Use quick switch buttons to change charts rapidly

## Configuration

### Email Configuration
Configure email settings in `fapi.py`:

```python
smtp_server = "smtp.gmail.com"
smtp_port = 587
sender_email = "your-email@gmail.com"
sender_password = "your-app-password"
```

### Database Configuration
The system uses SQLite. Default file: `shopback_data.db`.

Tables include:
- `stores` – store information
- `cashback_history` – cashback history
- `rate_statistics` – rate statistics
- `price_alerts` – price alerts

### CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Troubleshooting

### 1) Frontend cannot connect to backend
- Confirm backend server is running (http://localhost:8001)
- Check CORS configuration
- Verify `API_BASE_URL` is set correctly

### 2) Data scraping fails
- Check network connection
- Verify URL format is correct
- Check if target website has anti-scraping measures
- Review log files for detailed errors

### 3) Email sending fails
- Confirm SMTP settings are correct
- Check app password (Gmail requires app-specific password)
- Verify recipient email address format
- Check firewall settings

### 4) Database errors
- Confirm database file permissions
- Check disk space
- Backup and recreate database
- Run database migration

## Project Structure

```
ShopBack_PP/
├── back-end/
│   ├── fapi.py                 # FastAPI application
│   ├── database.py             # DB init and health checks
│   ├── model_scheduler.py      # Scheduled jobs (data/model maintenance)
│   ├── sb_scrap.py             # Async scraping & analytics tables
│   ├── add_brokers_from_csv.py # CSV ingestion (regulations)
│   ├── import_broker_ratings.py# CSV ingestion (ratings)
│   ├── fix_missing_ratings.py  # Targeted data fixes
│   ├── services/               # Business services
│   ├── routers/                # API routers
│   └── models/                 # Model/state files
├── front-end/
│   ├── index.html              # HTML entry
│   ├── src/                    # React app
│   ├── vite.config.js          # Vite config
│   └── shopback-frontend/      # Frontend app folder
├── Brokers_Regulation_WithNewAdds.csv
├── Broker_Scoring.csv
├── generate_rebate_csv.py
├── generate_rebate_template.py
└── README.md
```

## Adding New Features

1) Backend new endpoints
- Add new API routes in `fapi.py` or under `routers/`
- Define Pydantic models
- Implement business logic
- Add error handling

2) Frontend new components
- Create new components in `components/`
- Add API call functions
- Update the main app component
- Implement responsive design

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing

Contributions are welcome! Please:
1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

## Support

If you encounter issues or need help:
1. Check the Troubleshooting section
2. Review GitHub Issues
3. Open a new Issue with details

---

Last Updated: Oct 2025
