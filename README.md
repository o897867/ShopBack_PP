# ShopBack Cashback管理平台文档
# ShopBack Cashback Management Platform Documentation

## 目录 / Table of Contents

1. [项目概述 / Project Overview](#项目概述--project-overview)
2. [系统架构 / System Architecture](#系统架构--system-architecture)
3. [功能特性 / Features](#功能特性--features)
4. [技术栈 / Technology Stack](#技术栈--technology-stack)
5. [安装指南 / Installation Guide](#安装指南--installation-guide)
6. [API文档 / API Documentation](#api文档--api-documentation)
7. [用户指南 / User Guide](#用户指南--user-guide)
8. [配置说明 / Configuration](#配置说明--configuration)
9. [故障排除 / Troubleshooting](#故障排除--troubleshooting)

## 项目概述 / Project Overview

### 中文
ShopBack Cashback管理平台是一个全面的返现监控和管理系统，支持多平台数据抓取，包括ShopBack和CashRewards。该平台提供实时数据监控、价格提醒、平台比较和交易图表等功能。

### English
The ShopBack Cashback Management Platform is a comprehensive cashback monitoring and management system that supports multi-platform data scraping, including ShopBack and CashRewards. The platform provides real-time data monitoring, price alerts, platform comparison, and trading charts.

## 系统架构 / System Architecture

### 中文
```
前端 (React) ←→ 后端 (FastAPI) ←→ 数据库 (SQLite)
                      ↓
              网页抓取器 (aiohttp + BeautifulSoup)
                      ↓
             外部平台 (ShopBack, CashRewards)
```

### English
```
Frontend (React) ←→ Backend (FastAPI) ←→ Database (SQLite)
                        ↓
              Web Scraper (aiohttp + BeautifulSoup)
                        ↓
           External Platforms (ShopBack, CashRewards)
```

## 功能特性 / Features

### 中文
- **多平台支持**: 支持ShopBack和CashRewards平台
- **实时数据抓取**: 异步批量抓取cashback数据
- **平台比较**: 对比同一商家在不同平台的费率
- **价格提醒**: 邮件通知价格变化
- **数据可视化**: 历史趋势图表和统计
- **交易图表**: 集成TradingView图表
- **数据管理**: 商家管理和历史数据查询

### English
- **Multi-platform Support**: Supports ShopBack and CashRewards platforms
- **Real-time Data Scraping**: Asynchronous batch scraping of cashback data
- **Platform Comparison**: Compare rates for the same store across different platforms
- **Price Alerts**: Email notifications for price changes
- **Data Visualization**: Historical trend charts and statistics
- **Trading Charts**: Integrated TradingView charts
- **Data Management**: Store management and historical data queries

## 技术栈 / Technology Stack

### 前端 / Frontend
- **React** 19.1.0 - 用户界面框架 / UI Framework
- **Recharts** 3.1.0 - 数据可视化 / Data Visualization
- **TradingView** - 交易图表 / Trading Charts

### 后端 / Backend
- **FastAPI** - RESTful API框架 / RESTful API Framework
- **aiohttp** - 异步HTTP客户端 / Asynchronous HTTP Client
- **BeautifulSoup4** - HTML解析 / HTML Parsing
- **SQLite** - 数据库 / Database
- **smtplib** - 邮件发送 / Email Sending

### 数据抓取 / Web Scraping
- **异步抓取** / Asynchronous Scraping
- **多线程安全** / Thread-safe
- **错误处理** / Error Handling
- **速率限制** / Rate Limiting

## 安装指南 / Installation Guide

### 环境要求 / Prerequisites

#### 中文
- Python 3.8+
- Node.js 16+
- npm 或 yarn

#### English
- Python 3.8+
- Node.js 16+
- npm or yarn

### 后端安装 / Backend Installation

```bash
# 克隆项目 / Clone repository
git clone <repository-url>
cd shopback-platform

# 创建虚拟环境 / Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖 / Install dependencies
cd back-end
pip install -r requirements.txt

# 启动后端服务 / Start backend server
python fapi.py
```

### 前端安装 / Frontend Installation

```bash
# 安装前端依赖 / Install frontend dependencies
cd front-end/shopback-frontend
npm install

# 启动开发服务器 / Start development server
npm start
```

### 访问应用 / Access Application

- **前端 / Frontend**: http://localhost:3000
- **后端API / Backend API**: http://localhost:8001
- **API文档 / API Documentation**: http://localhost:8001/docs

## API文档 / API Documentation

### 核心端点 / Core Endpoints

#### 仪表盘数据 / Dashboard Data
```http
GET /api/dashboard
```

**响应示例 / Response Example:**
```json
{
    "total_stores": 25,
    "total_records": 1250,
    "recent_scrapes": 45,
    "upsized_stores": 3,
    "avg_cashback_rate": 4.2
}
```

#### 商家管理 / Store Management

**获取商家列表 / Get Stores**
```http
GET /api/stores?limit=50&offset=0&search=amazon
```

**添加新商家 / Add New Store**
```http
POST /api/add-store
Content-Type: application/json

{
    "url": "https://www.shopback.com.au/amazon-australia"
}
```

#### 平台比较 / Platform Comparison

**比较商家费率 / Compare Store Rates**
```http
GET /api/compare/{store_name}
```

**获取可比较商家 / Get Comparable Stores**
```http
GET /api/compare-all
```

#### 价格提醒 / Price Alerts

**创建提醒 / Create Alert**
```http
POST /api/alerts
Content-Type: application/json

{
    "user_email": "user@example.com",
    "store_url": "https://www.shopback.com.au/amazon-australia",
    "threshold_type": "above_current",
    "threshold_value": 5.0
}
```

**获取用户提醒 / Get User Alerts**
```http
GET /api/alerts?email=user@example.com
```

#### 数据抓取 / Data Scraping

**重新抓取所有数据 / Rescrape All Data**
```http
POST /api/rescrape-all
```

**抓取单个商家 / Scrape Single Store**
```http
POST /api/scrape
Content-Type: application/json

{
    "url": "https://www.shopback.com.au/amazon-australia"
}
```

## 用户指南 / User Guide

### 仪表盘功能 / Dashboard Features

#### 中文
1. **统计概览**: 查看总商家数、记录数、近期抓取和Upsized商家
2. **平均费率**: 显示所有商家的平均cashback率
3. **Upsized商家**: 查看当前有特殊优惠的商家
4. **平台比较**: 比较同一商家在不同平台的费率

#### English
1. **Statistics Overview**: View total stores, records, recent scrapes, and upsized stores
2. **Average Rate**: Display average cashback rate across all stores
3. **Upsized Stores**: View stores with current special offers
4. **Platform Comparison**: Compare rates for the same store across platforms

### 商家管理 / Store Management

#### 添加新商家 / Adding New Stores

##### 中文
1. 在商家列表部分找到"添加新商家"表单
2. 输入有效的ShopBack或CashRewards商家URL
3. 点击"添加"按钮
4. 系统将自动抓取数据

##### English
1. Find the "Add New Store" form in the store list section
2. Enter a valid ShopBack or CashRewards store URL
3. Click the "Add" button
4. The system will automatically scrape the data

#### 查看商家详情 / Viewing Store Details

##### 中文
1. 点击任意商家项目
2. 查看详细的cashback历史记录
3. 查看史高史低数据
4. 查看不同分类的费率

##### English
1. Click on any store item
2. View detailed cashback history
3. View historical high/low data
4. View rates for different categories

### 价格提醒 / Price Alerts

#### 设置提醒 / Setting Up Alerts

##### 中文
1. 点击"价格提醒管理"按钮
2. 输入您的邮箱地址
3. 填写商家URL和提醒条件
4. 选择提醒类型：
   - 高于当前：当费率超过指定值时提醒
   - 达到固定值：当费率达到指定值时提醒
   - 涨幅百分比：当费率涨幅达到指定百分比时提醒

##### English
1. Click the "Price Alert Management" button
2. Enter your email address
3. Fill in the store URL and alert conditions
4. Select alert type:
   - Above Current: Alert when rate exceeds specified value
   - Fixed Value: Alert when rate reaches specified value
   - Percentage Increase: Alert when rate increase reaches specified percentage

### 交易图表 / Trading Charts

#### 中文
1. 点击"TradingView"标签
2. 选择交易对（BTC/USDT、外汇、黄金等）
3. 选择主题（深色/浅色）
4. 使用快速切换按钮快速更换图表

#### English
1. Click the "TradingView" tab
2. Select trading pairs (BTC/USDT, forex, gold, etc.)
3. Choose theme (dark/light)
4. Use quick switch buttons to change charts rapidly

## 配置说明 / Configuration

### 环境变量 / Environment Variables

#### 邮件配置 / Email Configuration

##### 中文
在 `fapi.py` 中配置邮件设置：

##### English
Configure email settings in `fapi.py`:

```python
smtp_server = "smtp.gmail.com"
smtp_port = 587
sender_email = "your-email@gmail.com"
sender_password = "your-app-password"
```

### 数据库配置 / Database Configuration

#### 中文
系统使用SQLite数据库，数据库文件：`shopback_data.db`

##### English
The system uses SQLite database, database file: `shopback_data.db`

**表结构 / Table Structure:**
- `stores` - 商家信息 / Store information
- `cashback_history` - Cashback历史 / Cashback history
- `rate_statistics` - 费率统计 / Rate statistics
- `price_alerts` - 价格提醒 / Price alerts

### CORS配置 / CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 故障排除 / Troubleshooting

### 常见问题 / Common Issues

#### 1. 前端无法连接后端 / Frontend Cannot Connect to Backend

##### 中文
**问题**: 前端显示连接错误
**解决方案**:
- 确认后端服务器正在运行 (http://localhost:8001)
- 检查CORS配置
- 确认API_BASE_URL设置正确

##### English
**Issue**: Frontend shows connection error
**Solution**:
- Confirm backend server is running (http://localhost:8001)
- Check CORS configuration
- Verify API_BASE_URL is set correctly

#### 2. 数据抓取失败 / Data Scraping Fails

##### 中文
**问题**: 抓取器无法获取数据
**解决方案**:
- 检查网络连接
- 验证URL格式是否正确
- 检查目标网站是否有反爬虫措施
- 查看日志文件了解详细错误信息

##### English
**Issue**: Scraper cannot fetch data
**Solution**:
- Check network connection
- Verify URL format is correct
- Check if target website has anti-scraping measures
- Review log files for detailed error information

#### 3. 邮件发送失败 / Email Sending Fails

##### 中文
**问题**: 价格提醒邮件无法发送
**解决方案**:
- 确认SMTP设置正确
- 检查应用密码（Gmail需要应用专用密码）
- 验证收件人邮箱地址格式
- 检查网络防火墙设置

##### English
**Issue**: Price alert emails fail to send
**Solution**:
- Confirm SMTP settings are correct
- Check app password (Gmail requires app-specific password)
- Verify recipient email address format
- Check network firewall settings

#### 4. 数据库错误 / Database Errors

##### 中文
**问题**: SQLite数据库相关错误
**解决方案**:
- 确认数据库文件权限
- 检查磁盘空间
- 备份并重新创建数据库
- 运行数据库迁移

##### English
**Issue**: SQLite database related errors
**Solution**:
- Confirm database file permissions
- Check disk space
- Backup and recreate database
- Run database migration

### 性能优化 / Performance Optimization

#### 中文
1. **抓取优化**:
   - 调整并发数量限制
   - 设置合适的延迟间隔
   - 使用数据库连接池

2. **前端优化**:
   - 实现数据分页
   - 使用虚拟滚动
   - 优化图表渲染

3. **缓存策略**:
   - 实现API响应缓存
   - 使用浏览器缓存
   - 数据库查询优化

#### English
1. **Scraping Optimization**:
   - Adjust concurrent request limits
   - Set appropriate delay intervals
   - Use database connection pooling

2. **Frontend Optimization**:
   - Implement data pagination
   - Use virtual scrolling
   - Optimize chart rendering

3. **Caching Strategy**:
   - Implement API response caching
   - Use browser caching
   - Database query optimization

## 开发指南 / Development Guide

### 项目结构 / Project Structure

```
ShopBack_PP/
├── .claude/
│   └── settings.local.json  # Claude设置 / Claude settings
├── back-end/
│   ├── bayesian_model.py    # 贝叶斯模型 / Bayesian model
│   ├── fapi.py              # 主API服务器 / Main API server
│   ├── fapi copy.py         # API服务器备份 / API server backup
│   ├── model_scheduler.py   # 模型调度器 / Model scheduler
│   ├── sb_scrap.py          # 抓取器模块 / Scraper module
│   ├── sb_scrap copy.py     # 抓取器备份 / Scraper backup
│   ├── requirements.txt     # Python依赖 / Python dependencies
│   ├── shopback_data.db     # SQLite数据库 / SQLite database
│   ├── shopback_test.db     # 测试数据库 / Test database
│   ├── test.db              # 测试数据库 / Test database
│   ├── test_debug.db        # 调试数据库 / Debug database
│   ├── test.ipynb           # Jupyter测试笔记 / Jupyter test notebook
│   ├── shopback_scraper.log # 抓取日志 / Scraping logs
│   ├── 1.txt                # 临时文件 / Temporary file
│   └── venv/                # Python虚拟环境 / Python virtual environment
├── front-end/
│   ├── build/               # 构建输出 / Build output
│   │   └── assets/          # 静态资源 / Static assets
│   ├── shopback-frontend/
│   │   └── src/
│   │       └── App copy.js  # 应用备份 / App backup
│   ├── src/
│   │   ├── App.jsx          # 主应用组件 / Main app component
│   │   ├── main.jsx         # 入口文件 / Entry point
│   │   ├── App.css          # 应用样式 / App styles
│   │   ├── index.css        # 全局样式 / Global styles
│   │   ├── assets/          # 前端资源 / Frontend assets
│   │   │   └── react.svg    # React图标 / React icon
│   │   ├── components/      # 组件目录 / Components directory
│   │   │   ├── Alerts/
│   │   │   │   └── AlertManagement.jsx
│   │   │   ├── Comparison/
│   │   │   │   ├── ComparableStoresList.jsx
│   │   │   │   └── CompareModal.jsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── AverageCashback.jsx
│   │   │   │   ├── StatsCards.jsx
│   │   │   │   └── UpsizedStoresList.jsx
│   │   │   ├── Stores/
│   │   │   │   ├── StoreDetails.jsx
│   │   │   │   └── StoreList.jsx
│   │   │   ├── LanguageSelector.jsx
│   │   │   ├── ModelConfidence.jsx
│   │   │   ├── ModelConfidence.css
│   │   │   ├── Navigation.jsx
│   │   │   ├── PredictionCard.jsx
│   │   │   ├── PredictionCard.css
│   │   │   ├── ProbabilityChart.jsx
│   │   │   ├── ProbabilityChart.css
│   │   │   ├── SquarePaymentForm.jsx
│   │   │   └── tradingWidget.jsx
│   │   ├── config/
│   │   │   └── api.js        # API配置 / API configuration
│   │   ├── hooks/           # React Hooks
│   │   │   ├── useAlerts.js
│   │   │   ├── useBayesianModel.jsx
│   │   │   ├── useComparison.js
│   │   │   ├── useDashboard.js
│   │   │   ├── useLanguage.jsx
│   │   │   └── useStores.js
│   │   ├── pages/           # 页面目录 / Pages directory
│   │   │   ├── BayesianDashboard.jsx
│   │   │   ├── BayesianDashboard.css
│   │   │   ├── DonationPage.jsx
│   │   │   └── trading.jsx
│   │   ├── services/        # 服务层 / Service layer
│   │   │   ├── alertService.js
│   │   │   ├── apiService.js
│   │   │   └── comparisonService.js
│   │   ├── translations/    # 国际化 / Internationalization
│   │   │   └── index.js
│   │   └── utils/           # 工具函数 / Utility functions
│   │       ├── bayesianModel.js
│   │       ├── dataProcessing.js
│   │       ├── dateFormatter.js
│   │       ├── languageDetection.js
│   │       ├── modelUpdater.js
│   │       ├── platformDetector.js
│   │       └── thresholdTypes.js
│   ├── public/              # 静态文件 / Static files
│   │   └── vite.svg         # Vite图标 / Vite icon
│   ├── node_modules/        # Node模块 / Node modules
│   ├── package.json         # npm依赖 / npm dependencies
│   ├── package-lock.json    # npm锁定文件 / npm lock file
│   ├── vite.config.js       # Vite配置 / Vite configuration
│   ├── eslint.config.js     # ESLint配置 / ESLint configuration
│   ├── index.html           # HTML入口 / HTML entry
│   └── README.md            # 前端文档 / Frontend documentation
├── node_modules/            # 根级Node模块 / Root level Node modules
├── package.json             # 根级npm依赖 / Root level npm dependencies
├── package-lock.json        # 根级npm锁定文件 / Root level npm lock file
├── deploy.sh                # 部署脚本 / Deployment script
└── README.md                # 项目文档 / Project documentation
```

### 添加新功能 / Adding New Features

#### 中文
1. **后端新端点**:
   - 在 `fapi.py` 中添加新的API路由
   - 定义Pydantic模型
   - 实现业务逻辑
   - 添加错误处理

2. **前端新组件**:
   - 在 `components/` 目录创建新组件
   - 添加API调用函数
   - 更新主应用组件
   - 实现响应式设计

#### English
1. **Backend New Endpoints**:
   - Add new API routes in `fapi.py`
   - Define Pydantic models
   - Implement business logic
   - Add error handling

2. **Frontend New Components**:
   - Create new components in `components/` directory
   - Add API call functions
   - Update main app component
   - Implement responsive design

## 许可证 / License

### 中文
本项目采用MIT许可证。详细信息请查看LICENSE文件。

### English
This project is licensed under the MIT License. See the LICENSE file for details.

## 贡献指南 / Contributing

### 中文
欢迎贡献代码！请遵循以下步骤：
1. Fork本项目
2. 创建功能分支
3. 提交变更
4. 创建Pull Request

### English
Contributions are welcome! Please follow these steps:
1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Create a Pull Request

## 支持 / Support

### 中文
如果您遇到问题或需要帮助，请：
1. 查看本文档的故障排除部分
2. 检查GitHub Issues
3. 创建新的Issue描述问题

### English
If you encounter issues or need help, please:
1. Check the troubleshooting section in this documentation
2. Check GitHub Issues
3. Create a new Issue describing the problem

---

*最后更新 / Last Updated: 2025年8月*