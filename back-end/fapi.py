#!/usr/bin/env python3
"""
ShopBack FastAPI后端
为React前端提供RESTful API接口
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, Depends, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
import sqlite3
import asyncio
import threading
import time
from datetime import datetime, timedelta
import logging
from pathlib import Path
import json
import schedule
import asyncio
import aiohttp  
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
# 导入我们的抓取器
from sb_scrap import ShopBackSQLiteScraper, StoreInfo, CashbackRate
from bayesian_model import BayesianCashbackModel, ModelManager, train_model, update_all_models
from model_scheduler import start_model_scheduler, get_scheduler_status
from leverage_trading import LeveragePosition, LeverageCalculator
from eth_kalman_model import ETHKalmanModelManager
from binance_eth_data import BinanceDataManager
import os
from dotenv import load_dotenv
from square import Square
from square.environment import SquareEnvironment  # 正确的导入
import uuid

# 加载环境变量
load_dotenv()

# Pydantic模型定义

class PriceAlertRequest(BaseModel):
    user_email: str
    store_url: str
    threshold_type: str  # 'above_current', 'fixed_value', 'percentage_increase'
    threshold_value: float

class PriceAlertResponse(BaseModel):
    id: int
    user_email: str
    store_url: str
    store_name: str
    threshold_type: str
    threshold_value: float
    is_active: bool
    created_at: str
class AddStoreRequest(BaseModel):  # 在这里添加
    url: str
class StoreResponse(BaseModel):
    id: int
    name: str
    url: str
    created_at: str
    updated_at: str

class CashbackHistoryResponse(BaseModel):
    id: int
    store_name: str
    store_url: str
    main_cashback: str
    main_rate_numeric: float
    category: str
    category_rate: str
    category_rate_numeric: float
    is_upsized: bool
    previous_offer: Optional[str]
    scraped_at: str

class PerformanceMetricsResponse(BaseModel):
    scraping_performance: Dict[str, Any]
    data_scale: Dict[str, int]
    alert_latency: Dict[str, float]
    timestamp: str

class RateStatisticsResponse(BaseModel):
    store_name: str
    category: str
    current_rate: float
    highest_rate: float
    lowest_rate: float
    highest_date: str
    lowest_date: str

class ScrapeRequest(BaseModel):
    url: HttpUrl
    

class ScrapeResponse(BaseModel):
    success: bool
    message: str
    store_name: Optional[str] = None

class LeveragePositionRequest(BaseModel):
    user_email: str
    symbol: str
    direction: str  # 'long' or 'short'
    principal: float
    leverage: float
    position_size: float
    entry_price: float

class LeverageCalculationRequest(BaseModel):
    symbol: str
    direction: str  # 'long' or 'short'
    principal: float
    leverage: float
    entry_price: float
    current_price: Optional[float] = None
    position_size: Optional[float] = None  # Optional custom position size
    
class LeverageTargetLossRequest(BaseModel):
    symbol: str
    direction: str
    principal: float
    leverage: float
    entry_price: float
    max_loss_amount: float

class LeverageAnalysisResponse(BaseModel):
    position_info: Dict[str, Any]
    liquidation_info: Dict[str, Any]
    risk_levels: Dict[str, Any]
    current_pnl: Optional[Dict[str, float]] = None
    current_price: Optional[float] = None
    main_cashback: Optional[str] = None
    detailed_rates_count: Optional[int] = None

class DashboardStats(BaseModel):
    total_stores: int
    total_records: int
    recent_scrapes: int
    upsized_stores: int
    avg_cashback_rate: float

class DonationRequest(BaseModel):
    token: str
    amount: float

# ===== Showcase (Forum-like) Models ===== #
class ShowcaseCategory(BaseModel):
    id: int
    name: str
    image_url: str | None = None
    created_at: str

class ShowcaseCategoryCreate(BaseModel):
    name: str
    image_url: str | None = None

class ShowcaseEvent(BaseModel):
    id: int
    category_id: int
    title: str
    content: str | None = None
    images: list[str] | None = None
    submitted_by: str | None = None
    created_at: str

class ShowcaseEventCreate(BaseModel):
    category_id: int
    title: str
    content: str | None = None
    images: list[str] | None = None
    submitted_by: str | None = None

# ===== CFD (Industry) Models ===== #
class CFDBroker(BaseModel):
    id: int
    name: str
    regulators: str | None = None
    rating: str | None = None
    website: str | None = None
    logo_url: str | None = None
    rating_breakdown: dict | None = None
    created_at: str

class CFDBrokerNews(BaseModel):
    id: int
    broker_id: int
    title: str
    tag: str | None = None
    created_at: str

# 初始化FastAPI应用
app = FastAPI(
    title="ShopBack Cashback API",
    description="RESTful API for ShopBack cashback data management",
    version="1.0.0"
)

# CORS中间件配置 - nginx handles CORS, but keeping for direct access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # nginx reverse proxy will handle CORS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
UPLOAD_DIR = STATIC_DIR / "uploads" / "showcase"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
CFD_UPLOAD_DIR = STATIC_DIR / "uploads" / "cfd"
os.makedirs(CFD_UPLOAD_DIR, exist_ok=True)

# 全局变量
scraper_instance = None
db_path = "shopback_data.db"

# Initialize ETH Kalman model
eth_model_manager = ETHKalmanModelManager(db_path)
eth_data_manager = BinanceDataManager(eth_model_manager)
eth_ws_clients = set()  # WebSocket clients for ETH updates
model_manager = ModelManager(db_path)

# 初始化Square客户端
square_client = Square(
    token=os.environ.get("SQUARE_ACCESS_TOKEN"),
    environment=SquareEnvironment.SANDBOX  # 使用正确的枚举
)

# 日志设置
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _ensure_showcase_write_enabled():
    """Guard write endpoints so only backend-admin (e.g., via notebook) can enable them.
    Set env SHOWCASE_WRITE_ENABLED=true to allow HTTP writes; otherwise raise 403.
    """
    if str(os.getenv("SHOWCASE_WRITE_ENABLED", "false")).lower() not in ("1", "true", "yes"): 
        raise HTTPException(status_code=403, detail="Showcase write API disabled. Use backend admin notebook.")

# Ensure showcase tables exist
def ensure_showcase_tables():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS showcase_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS showcase_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                images_json TEXT,
                submitted_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES showcase_categories (id)
            )
            """
        )
        cur.execute('CREATE INDEX IF NOT EXISTS idx_showcase_events_category ON showcase_events (category_id)')
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to ensure showcase tables: {e}")
    finally:
        try:
            conn.close()
        except Exception:
            pass

# (Call placed after get_db_connection() definition below to avoid NameError)
async def auto_rescrape():
    """定时自动抓取函数"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 获取所有商家URL
        cursor.execute("SELECT url FROM stores")
        urls = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        if not urls:
            logger.info("没有商家需要抓取")
            return
        
        logger.info(f"开始定时抓取 {len(urls)} 个商家")
        
        # 使用异步批量抓取
        await scrape_multiple_background_async(urls, 2)
        
        # 检查价格提醒
        await check_price_alerts()
        
        logger.info(f"定时抓取完成，共处理 {len(urls)} 个商家")
    except Exception as e:
        logger.error(f"定时抓取失败: {e}", exc_info=True)
def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

# Ensure showcase tables now that DB connection helper exists
ensure_showcase_tables()

# Ensure CFD tables exist
def ensure_cfd_tables():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS cfd_brokers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                regulators TEXT,
                rating TEXT,
                website TEXT,
                logo_url TEXT,
                rating_breakdown_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS cfd_broker_news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                broker_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                tag TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (broker_id) REFERENCES cfd_brokers (id)
            )
            """
        )
        cur.execute('CREATE INDEX IF NOT EXISTS idx_cfd_news_broker ON cfd_broker_news (broker_id)')
        # Backfill missing column if needed
        try:
            cur.execute("PRAGMA table_info(cfd_brokers)")
            cols = {r[1] for r in cur.fetchall()}
            if 'rating_breakdown_json' not in cols:
                cur.execute("ALTER TABLE cfd_brokers ADD COLUMN rating_breakdown_json TEXT")
        except Exception:
            pass
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to ensure CFD tables: {e}")
    finally:
        try:
            conn.close()
        except Exception:
            pass

ensure_cfd_tables()

def get_scraper():
    """获取抓取器实例"""
    global scraper_instance
    if scraper_instance is None:
        scraper_instance = ShopBackSQLiteScraper(db_path)
    return scraper_instance
def validate_cashback_url(url: str) -> bool:  # 改名并支持两个平台
    shopback_pattern = r'^https://www\.shopback\.com\.(au|sg|my|ph|tw|nz|hk|th|vn|in)/[a-zA-Z0-9\-_]+/?$'
    cashrewards_pattern = r'^https://www\.cashrewards\.com\.au/store/[a-zA-Z0-9\-_]+/?$'
    
    return bool(re.match(shopback_pattern, url)) or bool(re.match(cashrewards_pattern, url))
# API路由
@app.post("/api/trigger-auto-rescrape", summary="手动触发自动抓取")
async def trigger_auto_rescrape():
    """手动触发自动抓取任务（用于测试）"""
    try:
        await auto_rescrape()
        return {
            "success": True,
            "message": "自动抓取任务已完成"
        }
    except Exception as e:
        logger.error(f"手动触发自动抓取失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rescrape-all", summary="异步重新抓取所有商家")
async def rescrape_all_stores(background_tasks: BackgroundTasks):
    """异步重新抓取所有商家的数据"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT url FROM stores")
        urls = [row[0] for row in cursor.fetchall()]
        
        # 在后台执行异步批量抓取
        background_tasks.add_task(
            lambda: asyncio.run(scrape_multiple_background_async(urls, 0))
        )
        
        return {
            "success": True,
            "message": f"异步重新抓取任务已启动，共{len(urls)}个商家"
        }
    finally:
        conn.close()
@app.get("/", summary="API根路径")
async def root():
    """API欢迎信息"""
    return {
        "message": "ShopBack Cashback API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# ============= Showcase (Forum-like) Endpoints =============

@app.get("/api/showcase/categories", response_model=List[ShowcaseCategory], summary="List showcase categories")
async def list_showcase_categories():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, name, image_url, created_at FROM showcase_categories ORDER BY id DESC")
        rows = cur.fetchall()
        categories = []
        for row in rows:
            cat_dict = dict(row)
            # Convert relative URLs to absolute backend URLs
            if cat_dict.get('image_url') and cat_dict['image_url'].startswith('/static/'):
                cat_dict['image_url'] = f"http://localhost:8001{cat_dict['image_url']}"
            categories.append(ShowcaseCategory(**cat_dict))
        return categories
    finally:
        conn.close()

@app.post("/api/showcase/categories", response_model=ShowcaseCategory, summary="Create showcase category")
async def create_showcase_category(payload: ShowcaseCategoryCreate):
    _ensure_showcase_write_enabled()
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO showcase_categories (name, image_url) VALUES (?, ?)",
            (payload.name, payload.image_url)
        )
        cat_id = cur.lastrowid
        conn.commit()
        cur.execute("SELECT id, name, image_url, created_at FROM showcase_categories WHERE id = ?", (cat_id,))
        row = cur.fetchone()
        return ShowcaseCategory(**dict(row))
    finally:
        conn.close()

@app.get("/api/showcase/categories/{category_id}/events", response_model=List[ShowcaseEvent], summary="List events by category")
async def list_showcase_events(category_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT id, category_id, title, content, images_json, submitted_by, created_at
            FROM showcase_events
            WHERE category_id = ?
            ORDER BY created_at DESC, id DESC
            """,
            (category_id,)
        )
        rows = cur.fetchall()
        result: List[ShowcaseEvent] = []
        for r in rows:
            d = dict(r)
            images = []
            try:
                images_raw = json.loads(d.get('images_json') or '[]')
                # Convert relative URLs to absolute backend URLs
                images = []
                for img in images_raw:
                    if img and img.startswith('/static/'):
                        images.append(f"http://localhost:8001{img}")
                    else:
                        images.append(img)
            except Exception:
                images = []
            result.append(ShowcaseEvent(
                id=d['id'],
                category_id=d['category_id'],
                title=d['title'],
                content=d.get('content') or None,
                images=images,
                submitted_by=d.get('submitted_by') or None,
                created_at=d['created_at']
            ))
        return result
    finally:
        conn.close()

@app.get("/api/showcase/events/{event_id}", response_model=ShowcaseEvent, summary="Get event detail")
async def get_showcase_event(event_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT id, category_id, title, content, images_json, submitted_by, created_at FROM showcase_events WHERE id = ?",
            (event_id,)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")
        d = dict(row)
        images = []
        try:
            images_raw = json.loads(d.get('images_json') or '[]')
            # Convert relative URLs to absolute backend URLs
            images = []
            for img in images_raw:
                if img and img.startswith('/static/'):
                    images.append(f"http://localhost:8001{img}")
                else:
                    images.append(img)
        except Exception:
            images = []
        return ShowcaseEvent(
            id=d['id'],
            category_id=d['category_id'],
            title=d['title'],
            content=d.get('content') or None,
            images=images,
            submitted_by=d.get('submitted_by') or None,
            created_at=d['created_at']
        )
    finally:
        conn.close()

@app.post("/api/showcase/events", response_model=ShowcaseEvent, summary="Create event")
async def create_showcase_event(payload: ShowcaseEventCreate):
    _ensure_showcase_write_enabled()
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # ensure category exists
        cur.execute("SELECT id FROM showcase_categories WHERE id = ?", (payload.category_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Category not found")
        images_json = json.dumps(payload.images or [])
        cur.execute(
            """
            INSERT INTO showcase_events (category_id, title, content, images_json, submitted_by)
            VALUES (?, ?, ?, ?, ?)
            """,
            (payload.category_id, payload.title, payload.content, images_json, payload.submitted_by)
        )
        ev_id = cur.lastrowid
        conn.commit()
        cur.execute(
            "SELECT id, category_id, title, content, images_json, submitted_by, created_at FROM showcase_events WHERE id = ?",
            (ev_id,)
        )
        row = cur.fetchone()
        d = dict(row)
        return ShowcaseEvent(
            id=d['id'],
            category_id=d['category_id'],
            title=d['title'],
            content=d.get('content') or None,
            images=json.loads(d.get('images_json') or '[]'),
            submitted_by=d.get('submitted_by') or None,
            created_at=d['created_at']
        )
    finally:
        conn.close()

@app.post("/api/showcase/upload-image", summary="Upload image for showcase")
async def upload_showcase_image(file: UploadFile = File(...)):
    """Upload an image file and return its public URL.
    Requires SHOWCASE_WRITE_ENABLED to be true.
    """
    _ensure_showcase_write_enabled()
    # Basic validation
    content_type = (file.content_type or "").lower()
    if not any(ct in content_type for ct in ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]):
        raise HTTPException(status_code=400, detail="Unsupported image type")

    # Safe filename with uuid
    import uuid
    suffix = os.path.splitext(file.filename or "")[1].lower()
    if suffix not in [".png", ".jpg", ".jpeg", ".webp", ".gif"]:
        # map content-type to default suffix
        mapping = {
            "image/png": ".png",
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/webp": ".webp",
            "image/gif": ".gif"
        }
        suffix = mapping.get(content_type, ".jpg")
    fname = f"{uuid.uuid4().hex}{suffix}"
    dest = UPLOAD_DIR / fname
    try:
        with open(dest, "wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
    finally:
        await file.close()

    public_url = f"/static/uploads/showcase/{fname}"
    return {"url": public_url, "filename": fname}

# ============= CFD (Industry) Endpoints =============

@app.get("/api/cfd/brokers", response_model=List[CFDBroker], summary="List CFD brokers")
async def list_cfd_brokers():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT id, name, regulators, rating, website, logo_url, rating_breakdown_json, created_at FROM cfd_brokers ORDER BY id DESC"
        )
        rows = cur.fetchall()
        result: List[CFDBroker] = []
        for r in rows:
            d = dict(r)
            logo = d.get('logo_url')
            if logo and logo.startswith('/static/'):
                d['logo_url'] = f"http://localhost:8001{logo}"
            rb = None
            try:
                rb = json.loads(d.get('rating_breakdown_json') or 'null')
            except Exception:
                rb = None
            d['rating_breakdown'] = rb
            d.pop('rating_breakdown_json', None)
            result.append(CFDBroker(**d))
        return result
    finally:
        conn.close()

@app.get("/api/cfd/brokers/{broker_id}", response_model=CFDBroker, summary="Get CFD broker detail")
async def get_cfd_broker(broker_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT id, name, regulators, rating, website, logo_url, rating_breakdown_json, created_at FROM cfd_brokers WHERE id = ?",
            (broker_id,)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Broker not found")
        d = dict(row)
        logo = d.get('logo_url')
        if logo and logo.startswith('/static/'):
            d['logo_url'] = f"http://localhost:8001{logo}"
        rb = None
        try:
            rb = json.loads(d.get('rating_breakdown_json') or 'null')
        except Exception:
            rb = None
        d['rating_breakdown'] = rb
        d.pop('rating_breakdown_json', None)
        return CFDBroker(**d)
    finally:
        conn.close()

@app.get("/api/cfd/brokers/{broker_id}/news", response_model=List[CFDBrokerNews], summary="List news for a broker")
async def list_cfd_broker_news(broker_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # ensure broker exists
        cur.execute("SELECT 1 FROM cfd_brokers WHERE id = ?", (broker_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Broker not found")
        cur.execute(
            "SELECT id, broker_id, title, tag, created_at FROM cfd_broker_news WHERE broker_id = ? ORDER BY created_at DESC, id DESC",
            (broker_id,)
        )
        rows = cur.fetchall()
        return [CFDBrokerNews(**dict(r)) for r in rows]
    finally:
        conn.close()
@app.post("/api/add-store", summary="添加新商家")
async def add_store(request: AddStoreRequest, background_tasks: BackgroundTasks):
    """添加新的ShopBack或CashRewards商家"""
    url = request.url.strip()
    
    # 验证URL格式 - 支持两个平台
    if not validate_cashback_url(url):
        raise HTTPException(status_code=400, detail="URL必须是有效的ShopBack或CashRewards商家页面")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 检查是否已存在
        cursor.execute("SELECT id FROM stores WHERE url = ?", (url,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="该商家已存在")
        
        # 在后台执行抓取任务
        background_tasks.add_task(scrape_store_background, url)
        
        return {
            "success": True,
            "message": "商家添加成功，正在后台抓取数据"
        }
    finally:
        conn.close()
@app.get("/api/compare/{store_name}", summary="比较商家在不同平台的费率")
async def compare_store_platforms(store_name: str):
    """比较同一商家在ShopBack和CashRewards的费率"""
    scraper = get_scraper()
    comparison = scraper.compare_platforms_for_store(store_name)
    
    if not comparison['platforms']:
        raise HTTPException(status_code=404, detail="未找到该商家的数据")
    
    return comparison

@app.get("/api/compare-all", summary="获取所有可比较的商家")
async def get_comparable_stores():
    """获取在多个平台都有数据的商家列表"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT name, COUNT(DISTINCT platform) as platform_count,
                   GROUP_CONCAT(DISTINCT platform) as platforms
            FROM stores 
            GROUP BY LOWER(name)
            HAVING platform_count > 1
            ORDER BY name
        ''')
        
        results = cursor.fetchall()
        return [dict(result) for result in results]
    finally:
        conn.close()
@app.get("/api/dashboard", response_model=DashboardStats, summary="获取仪表盘统计数据")
async def get_dashboard_stats():
    """获取仪表盘统计数据"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 总商家数
        cursor.execute("SELECT COUNT(*) FROM stores")
        total_stores = cursor.fetchone()[0]
        
        # 总记录数
        cursor.execute("SELECT COUNT(*) FROM cashback_history")
        total_records = cursor.fetchone()[0]
        
        # 最近24小时的抓取数
        yesterday = (datetime.now() - timedelta(days=1)).isoformat()
        cursor.execute("SELECT COUNT(*) FROM cashback_history WHERE scraped_at > ?", (yesterday,))
        recent_scrapes = cursor.fetchone()[0]
        
        # 当前upsized的商家数
        cursor.execute("""
            SELECT COUNT(DISTINCT store_id) FROM cashback_history 
            WHERE is_upsized = 1 AND id IN (
                SELECT MAX(id) FROM cashback_history GROUP BY store_id
            )
        """)
        upsized_stores = cursor.fetchone()[0]
        
        # 平均cashback比例
        cursor.execute("""
            SELECT AVG(main_rate_numeric) FROM (
                SELECT DISTINCT store_id, main_rate_numeric 
                FROM cashback_history 
                WHERE id IN (
                    SELECT MAX(id) FROM cashback_history GROUP BY store_id
                )
            )
        """)
        avg_rate = cursor.fetchone()[0] or 0.0
        
        return DashboardStats(
            total_stores=total_stores,
            total_records=total_records,
            recent_scrapes=recent_scrapes,
            upsized_stores=upsized_stores,
            avg_cashback_rate=round(avg_rate, 2)
        )
    
    finally:
        conn.close()

@app.get("/api/performance", response_model=PerformanceMetricsResponse, summary="获取性能指标")
async def get_performance_metrics():
    """获取系统性能指标"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 获取最近的性能指标
        cursor.execute("""
            SELECT * FROM performance_metrics 
            WHERE metric_type = 'batch_scrape' 
            ORDER BY timestamp DESC 
            LIMIT 1
        """)
        latest_metric = cursor.fetchone()
        
        # 获取最近24小时的平均指标
        yesterday = (datetime.now() - timedelta(days=1)).isoformat()
        cursor.execute("""
            SELECT 
                AVG(requests_count) as avg_requests,
                AVG(success_count) as avg_success,
                AVG(failure_count) as avg_failure,
                AVG(avg_response_time) as avg_response_time,
                AVG(p95_response_time) as avg_p95_response_time,
                AVG(concurrency_level) as avg_concurrency,
                SUM(requests_count) as total_requests,
                SUM(success_count) as total_success
            FROM performance_metrics 
            WHERE timestamp > ? AND metric_type = 'batch_scrape'
        """, (yesterday,))
        daily_stats = cursor.fetchone()
        
        # 计算成功率
        success_rate = 0
        if daily_stats and daily_stats['total_requests'] and daily_stats['total_requests'] > 0:
            success_rate = (daily_stats['total_success'] / daily_stats['total_requests']) * 100
        
        # 获取数据规模
        cursor.execute("SELECT COUNT(*) FROM stores")
        total_stores = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM cashback_history")
        total_records = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM cashback_history 
            WHERE DATE(scraped_at) = DATE('now', 'localtime')
        """)
        daily_new_records = cursor.fetchone()[0]
        
        # 计算告警延迟 - 暂时设为固定值，因为缺少触发时间跟踪
        # TODO: 需要添加alert_triggers表来准确跟踪从价格变化到通知的延迟
        alert_latency_p95 = 5.0  # 假设5分钟内处理告警
        
        # 计算每分钟请求数
        requests_per_minute = 0
        if latest_metric:
            try:
                metadata = json.loads(latest_metric['metadata']) if latest_metric['metadata'] else {}
                requests_per_minute = metadata.get('requests_per_minute', 0)
            except:
                pass
        
        return PerformanceMetricsResponse(
            scraping_performance={
                'concurrency': latest_metric['concurrency_level'] if latest_metric else 0,
                'requests_per_minute': round(requests_per_minute, 2),
                'avg_response_time': round(daily_stats['avg_response_time'], 2) if daily_stats and daily_stats['avg_response_time'] is not None else 0,
                'success_rate': round(success_rate, 2)
            },
            data_scale={
                'total_stores': total_stores,
                'total_records': total_records,
                'daily_new_records': daily_new_records
            },
            alert_latency={
                'p95_minutes': round(alert_latency_p95, 2)
            },
            timestamp=datetime.now().isoformat()
        )
    
    finally:
        conn.close()

@app.get("/api/stores", response_model=List[StoreResponse], summary="获取所有商家")
async def get_stores(
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None, description="按名称搜索商家")
):
    """获取商家列表"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if search:
            cursor.execute("""
                SELECT * FROM stores 
                WHERE name LIKE ? 
                ORDER BY updated_at DESC 
                LIMIT ? OFFSET ?
            """, (f"%{search}%", limit, offset))
        else:
            cursor.execute("""
                SELECT * FROM stores 
                ORDER BY updated_at DESC 
                LIMIT ? OFFSET ?
            """, (limit, offset))
        
        stores = cursor.fetchall()
        return [StoreResponse(**dict(store)) for store in stores]
    
    finally:
        conn.close()

@app.get("/api/stores/{store_id}/history", response_model=List[CashbackHistoryResponse], summary="获取商家历史数据")
async def get_store_history(
    store_id: int,
    limit: int = Query(50, ge=1, le=1000),
    category: Optional[str] = Query(None, description="按分类筛选")
):
    """获取特定商家的历史数据"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if category:
            cursor.execute("""
                SELECT ch.*, s.name as store_name, s.url as store_url
                FROM cashback_history ch
                JOIN stores s ON ch.store_id = s.id
                WHERE ch.store_id = ? AND ch.category = ?
                AND ch.scraped_at = (
                    SELECT MAX(scraped_at) 
                    FROM cashback_history 
                    WHERE store_id = ch.store_id
                )
                ORDER BY ch.category
                LIMIT ?
            """, (store_id, category, limit))
        else:
            cursor.execute("""
                SELECT ch.*, s.name as store_name, s.url as store_url
                FROM cashback_history ch
                JOIN stores s ON ch.store_id = s.id
                WHERE ch.store_id = ?
                AND ch.scraped_at = (
                    SELECT MAX(scraped_at) 
                    FROM cashback_history 
                    WHERE store_id = ch.store_id
                )
                ORDER BY ch.category
                LIMIT ?
            """, (store_id, limit))
        
        history = cursor.fetchall()
        return [CashbackHistoryResponse(**dict(record)) for record in history]
    
    finally:
        conn.close()

@app.get("/api/history", response_model=List[CashbackHistoryResponse], summary="获取所有历史数据")
async def get_all_history(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    store_name: Optional[str] = Query(None, description="按商家名称筛选"),
    is_upsized: Optional[bool] = Query(None, description="按是否upsized筛选"),
    min_rate: Optional[float] = Query(None, description="最小cashback比例"),
    max_rate: Optional[float] = Query(None, description="最大cashback比例")
):
    """获取所有历史数据（支持多种筛选条件）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 构建查询条件
    conditions = []
    params = []
    
    if store_name:
        conditions.append("s.name LIKE ?")
        params.append(f"%{store_name}%")
    
    if is_upsized is not None:
        conditions.append("ch.is_upsized = ?")
        params.append(is_upsized)
    
    if min_rate is not None:
        conditions.append("ch.category_rate_numeric >= ?")
        params.append(min_rate)
    
    if max_rate is not None:
        conditions.append("ch.category_rate_numeric <= ?")
        params.append(max_rate)
    
    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)
    
    query = f"""
        SELECT ch.*, s.name as store_name, s.url as store_url
        FROM cashback_history ch
        JOIN stores s ON ch.store_id = s.id
        {where_clause}
        ORDER BY ch.scraped_at DESC
        LIMIT ? OFFSET ?
    """
    
    params.extend([limit, offset])
    
    try:
        cursor.execute(query, params)
        history = cursor.fetchall()
        return [CashbackHistoryResponse(**dict(record)) for record in history]
    
    finally:
        conn.close()

@app.get("/api/statistics", response_model=List[RateStatisticsResponse], summary="获取比例统计")
async def get_statistics(
    store_name: Optional[str] = Query(None, description="按商家名称筛选")
):
    """获取比例统计信息"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if store_name:
            cursor.execute("""
                SELECT s.name as store_name, rs.category, rs.current_rate, 
                       rs.highest_rate, rs.lowest_rate, rs.highest_date, rs.lowest_date
                FROM rate_statistics rs
                JOIN stores s ON rs.store_id = s.id
                WHERE s.name LIKE ?
                ORDER BY s.name, rs.category
            """, (f"%{store_name}%",))
        else:
            cursor.execute("""
                SELECT s.name as store_name, rs.category, rs.current_rate, 
                       rs.highest_rate, rs.lowest_rate, rs.highest_date, rs.lowest_date
                FROM rate_statistics rs
                JOIN stores s ON rs.store_id = s.id
                ORDER BY s.name, rs.category
            """)
        
        stats = cursor.fetchall()
        return [RateStatisticsResponse(**dict(stat)) for stat in stats]
    
    finally:
        conn.close()

@app.get("/api/top-cashback", summary="获取最高cashback商家")
async def get_top_cashback(
    limit: int = Query(10, ge=1, le=50),
    category: Optional[str] = Query(None, description="按分类筛选")
):
    """获取cashback比例最高的商家"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if category and category != "Main":
            # 查询特定分类
            cursor.execute("""
                SELECT s.name, s.url, ch.category, ch.category_rate, ch.category_rate_numeric,
                       ch.is_upsized, ch.scraped_at
                FROM cashback_history ch
                JOIN stores s ON ch.store_id = s.id
                WHERE ch.category = ? AND ch.id IN (
                    SELECT MAX(id) FROM cashback_history 
                    WHERE category = ?
                    GROUP BY store_id
                )
                ORDER BY ch.category_rate_numeric DESC
                LIMIT ?
            """, (category, category, limit))
        else:
            # 查询主要cashback
            cursor.execute("""
                SELECT s.name, s.url, ch.main_cashback, ch.main_rate_numeric,
                       ch.is_upsized, ch.scraped_at
                FROM cashback_history ch
                JOIN stores s ON ch.store_id = s.id
                WHERE ch.category = 'Main' AND ch.id IN (
                    SELECT MAX(id) FROM cashback_history 
                    WHERE category = 'Main'
                    GROUP BY store_id
                )
                ORDER BY ch.main_rate_numeric DESC
                LIMIT ?
            """, (limit,))
        
        results = cursor.fetchall()
        return [dict(result) for result in results]
    
    finally:
        conn.close()

@app.get("/api/upsized-stores", summary="获取当前upsized的商家")
async def get_upsized_stores():
    """获取当前有upsized优惠的商家"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT s.name, s.url, ch.main_cashback, ch.main_rate_numeric,
                   ch.previous_offer, ch.scraped_at
            FROM cashback_history ch
            JOIN stores s ON ch.store_id = s.id
            WHERE ch.is_upsized = 1 AND ch.category = 'Main' AND ch.id IN (
                SELECT MAX(id) FROM cashback_history 
                WHERE category = 'Main'
                GROUP BY store_id
            )
            ORDER BY ch.main_rate_numeric DESC
        """)
        
        results = cursor.fetchall()
        return [dict(result) for result in results]
    
    finally:
        conn.close()

@app.post("/api/scrape", response_model=ScrapeResponse, summary="抓取单个商家")
async def scrape_store(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """抓取单个商家的cashback数据"""
    url = str(request.url)
    
    # 验证URL是否为ShopBack
    if "shopback.com" not in url:
        raise HTTPException(status_code=400, detail="URL必须是ShopBack商家页面")
    
    # 在后台执行抓取任务
    background_tasks.add_task(scrape_store_background, url)
    
    return ScrapeResponse(
        success=True,
        message="抓取任务已启动，请稍后查看结果"
    )

async def scrape_store_background(url: str):
    """后台抓取任务"""
    try:
        scraper = get_scraper()
        result = scraper.scrape_store_page(url)
        logger.info(f"后台抓取完成: {result.name} - {result.main_cashback}")
    except Exception as e:
        logger.error(f"后台抓取失败: {url} - {str(e)}")

@app.post("/api/scrape-multiple", summary="批量抓取多个商家")
async def scrape_multiple_stores(
    urls: List[HttpUrl], 
    background_tasks: BackgroundTasks,
    delay_seconds: int = Query(2, ge=1, le=10, description="每次抓取间隔秒数")
):
    """批量抓取多个商家的cashback数据"""
    # 验证所有URL
    for url in urls:
        if "shopback.com" not in str(url):
            raise HTTPException(status_code=400, detail=f"URL必须是ShopBack商家页面: {url}")
    
    # 在后台执行批量抓取任务
    background_tasks.add_task(scrape_multiple_background, [str(url) for url in urls], delay_seconds)
    
    return {
        "success": True,
        "message": f"批量抓取任务已启动，共{len(urls)}个商家",
        "estimated_time": f"{len(urls) * delay_seconds // 60}分钟"
    }
async def scrape_multiple_background_async(urls: List[str], delay_seconds: int = 0):
    """异步后台批量抓取任务"""
    scraper = ShopBackSQLiteScraper(db_path)
    
    async with scraper:
        if delay_seconds > 0:
            # 有延迟的串行处理
            for i, url in enumerate(urls):
                try:
                    result = await scraper.scrape_store_page(url)  # 调用您修改的异步方法
                    logger.info(f"异步批量抓取进度 {i+1}/{len(urls)}: {result.name}")
                    
                    if i < len(urls) - 1:
                        await asyncio.sleep(delay_seconds)
                        
                except Exception as e:
                    logger.error(f"异步批量抓取失败: {url} - {str(e)}")
        else:
            # 无延迟的并发处理
            if hasattr(scraper, 'scrape_multiple_stores_async'):
                results = await scraper.scrape_multiple_stores_async(urls)
                logger.info(f"并发异步抓取完成，共处理 {len(results)} 个商家")
            else:
                # 如果没有批量方法，就并发调用单个方法
                tasks = [scraper.scrape_store_page(url) for url in urls]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                success_count = sum(1 for r in results if not isinstance(r, Exception))
                logger.info(f"并发异步抓取完成: {success_count}/{len(urls)} 成功")
async def scrape_multiple_background(urls: List[str], delay_seconds: int):
    """后台批量抓取任务 - 同步版本包装器"""
    # 直接调用异步版本
    await scrape_multiple_background_async(urls, delay_seconds)
async def scrape_multiple_background_async(urls: List[str], delay_seconds: int = 0):
    """异步后台批量抓取任务"""
    async with ShopBackSQLiteScraper(db_path, max_concurrent=5) as scraper:
        if delay_seconds > 0:
            # 如果需要延迟，分批处理
            for i, url in enumerate(urls):
                try:
                    result = await scraper.scrape_store_page(url)
                    logger.info(f"异步批量抓取进度 {i+1}/{len(urls)}: {result.name}")
                    
                    if i < len(urls) - 1:
                        await asyncio.sleep(delay_seconds)
                        
                except Exception as e:
                    logger.error(f"异步批量抓取失败: {url} - {str(e)}")
        else:
            # 无延迟，并发处理
            results = await scraper.scrape_multiple_stores_async(urls)
            logger.info(f"并发异步抓取完成，共处理 {len(results)} 个商家")

@app.get("/api/trends/{store_id}", summary="获取商家趋势数据")
async def get_store_trends(
    store_id: int,
    days: int = Query(30, ge=1, le=365, description="查询天数"),
    category: str = Query("Main", description="分类名称")
):
    """获取商家的cashback趋势数据"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        start_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        cursor.execute("""
            SELECT DATE(scraped_at) as date, 
                   AVG(category_rate_numeric) as avg_rate,
                   MAX(category_rate_numeric) as max_rate,
                   MIN(category_rate_numeric) as min_rate,
                   COUNT(*) as count
            FROM cashback_history
            WHERE store_id = ? AND category = ? AND scraped_at >= ?
            GROUP BY DATE(scraped_at)
            ORDER BY date
        """, (store_id, category, start_date))
        
        trends = cursor.fetchall()
        return [dict(trend) for trend in trends]
    
    finally:
        conn.close()

@app.delete("/api/stores/{store_id}", summary="删除商家及其所有数据")
async def delete_store(store_id: int):
    """删除商家及其所有相关数据"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 检查商家是否存在
        cursor.execute("SELECT name FROM stores WHERE id = ?", (store_id,))
        store = cursor.fetchone()
        if not store:
            raise HTTPException(status_code=404, detail="商家不存在")
        
        store_name = store[0]
        
        # 删除相关数据
        cursor.execute("DELETE FROM rate_statistics WHERE store_id = ?", (store_id,))
        cursor.execute("DELETE FROM cashback_history WHERE store_id = ?", (store_id,))
        cursor.execute("DELETE FROM stores WHERE id = ?", (store_id,))
        
        conn.commit()
        
        return {
            "success": True,
            "message": f"商家 '{store_name}' 及其所有数据已删除"
        }
    
    finally:
        conn.close()
@app.post("/api/alerts", summary="创建价格提醒")
async def create_alert(request: PriceAlertRequest, background_tasks: BackgroundTasks):
    """创建价格提醒"""
    # 验证邮箱格式
    import re
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, request.user_email):
        raise HTTPException(status_code=400, detail="邮箱格式不正确")
    
    # 验证URL
    if not validate_cashback_url(request.store_url):
        raise HTTPException(status_code=400, detail="URL必须是有效的ShopBack商家页面")
    
    # 验证阈值类型和值
    if request.threshold_type not in ['above_current', 'fixed_value', 'percentage_increase']:
        raise HTTPException(status_code=400, detail="无效的阈值类型")
    
    if request.threshold_value <= 0:
        raise HTTPException(status_code=400, detail="阈值必须大于0")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 检查商家是否存在，不存在则添加
        cursor.execute("SELECT name FROM stores WHERE url = ?", (request.store_url,))
        store = cursor.fetchone()
        
        if not store:
            # 添加新商家并抓取
            background_tasks.add_task(scrape_store_background, request.store_url)
            store_name = "新添加的商家"
        else:
            store_name = store[0]
        
        # 检查是否已有相同提醒
        cursor.execute("""
            SELECT id FROM price_alerts 
            WHERE user_email = ? AND store_url = ? AND is_active = 1
        """, (request.user_email, request.store_url))
        
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="您已为该商家设置了提醒")
        
        # 创建提醒
        cursor.execute("""
            INSERT INTO price_alerts 
            (user_email, store_url, store_name, threshold_type, threshold_value)
            VALUES (?, ?, ?, ?, ?)
        """, (request.user_email, request.store_url, store_name, 
              request.threshold_type, request.threshold_value))
        
        conn.commit()
        
        return {
            "success": True,
            "message": f"价格提醒创建成功！当{store_name}满足条件时将发送邮件通知"
        }
    
    finally:
        conn.close()

@app.get("/api/alerts", summary="获取用户提醒")
async def get_user_alerts(email: str = Query(..., description="用户邮箱")):
    """获取用户的所有提醒"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT * FROM price_alerts 
            WHERE user_email = ? AND is_active = 1
            ORDER BY created_at DESC
        """, (email,))
        
        alerts = cursor.fetchall()
        return [PriceAlertResponse(**dict(alert)) for alert in alerts]
    
    finally:
        conn.close()

@app.delete("/api/alerts/{alert_id}", summary="删除提醒")
async def delete_alert(alert_id: int):
    """删除价格提醒"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id FROM price_alerts WHERE id = ?", (alert_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="提醒不存在")
        
        cursor.execute("UPDATE price_alerts SET is_active = 0 WHERE id = ?", (alert_id,))
        conn.commit()
        
        return {"success": True, "message": "提醒已删除"}
    
    finally:
        conn.close()

@app.get("/api/test-email", summary="测试邮件发送")
async def test_email(email: str = Query(..., description="测试邮箱")):
    """测试邮件发送功能"""
    try:
        # 创建模拟提醒数据
        test_alert = {
            'user_email': email,
            'store_name': '测试商家',
            'store_url': 'https://www.shopback.com.au/test',
            'threshold_value': 5.0
        }
        
        await send_alert_email(test_alert, 6.5)
        return {"success": True, "message": "测试邮件发送成功"}
    except Exception as e:
        return {"success": False, "message": f"邮件发送失败: {str(e)}"}

# Bayesian Model API Endpoints
@app.get("/api/predictions", summary="获取所有预测结果")
async def get_all_predictions():
    """获取所有商家的预测结果"""
    try:
        predictions = model_manager.get_all_predictions()
        return {
            "success": True,
            "predictions": predictions,
            "count": len(predictions)
        }
    except Exception as e:
        logger.error(f"获取预测失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predictions/global", summary="获取全局预测模型")
async def get_global_predictions():
    """获取全局预测模型的结果"""
    try:
        model = model_manager.load_model()  # None for global model
        if not model:
            raise HTTPException(status_code=404, detail="全局模型尚未训练")
        
        summary = model.get_model_summary()
        return {
            "success": True,
            "prediction": summary
        }
    except Exception as e:
        logger.error(f"获取全局预测失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predictions/scheduler-status", summary="获取模型调度器状态")
async def get_model_scheduler_status():
    """获取后台模型更新调度器的状态"""
    try:
        status = get_scheduler_status()
        if status is None:
            return {
                "success": False,
                "scheduler_status": {
                    "running": False,
                    "message": "Scheduler not initialized"
                }
            }
        return {
            "success": True,
            **status  # Spread the status dict directly
        }
    except Exception as e:
        logger.error(f"获取调度器状态失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predictions/{store_id}", summary="获取特定商家的预测")
async def get_store_predictions(store_id: int):
    """获取特定商家的详细预测"""
    try:
        model = model_manager.load_model(store_id)
        if not model:
            raise HTTPException(status_code=404, detail="该商家暂无预测模型")
        
        summary = model.get_model_summary()
        return {
            "success": True,
            "prediction": summary
        }
    except Exception as e:
        logger.error(f"获取商家预测失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predictions/retrain", summary="重新训练预测模型")
async def retrain_models(background_tasks: BackgroundTasks, store_id: Optional[int] = None):
    """重新训练预测模型"""
    try:
        if store_id:
            # 重新训练特定商家模型
            background_tasks.add_task(retrain_single_model, store_id)
            return {
                "success": True,
                "message": f"商家 {store_id} 的模型正在后台重新训练"
            }
        else:
            # 重新训练所有模型
            background_tasks.add_task(retrain_all_models)
            return {
                "success": True,
                "message": "所有模型正在后台重新训练"
            }
    except Exception as e:
        logger.error(f"重新训练模型失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predictions/insights", summary="获取AI洞察")
async def get_ai_insights():
    """获取基于预测模型的AI洞察"""
    try:
        predictions = model_manager.get_all_predictions()
        insights = generate_insights(predictions)
        return {
            "success": True,
            "insights": insights
        }
    except Exception as e:
        logger.error(f"获取AI洞察失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predictions/anomalies", summary="检测异常情况")
async def detect_anomalies():
    """检测cashback rate的异常变化"""
    try:
        # Get recent data
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT ch.*, s.name as store_name
            FROM cashback_history ch
            JOIN stores s ON ch.store_id = s.id
            WHERE ch.scraped_at > datetime('now', '-7 days')
            ORDER BY ch.scraped_at DESC
        """)
        
        recent_data = cursor.fetchall()
        conn.close()
        
        anomalies = []
        
        for row in recent_data:
            rate = row[3] or row[5]  # main_rate_numeric or category_rate_numeric
            if rate and rate > 20:  # Very high cashback rate
                anomalies.append({
                    'type': 'unusually_high_rate',
                    'store_name': row[-1],
                    'rate': rate,
                    'date': row[8],  # scraped_at
                    'severity': 'high' if rate > 30 else 'medium'
                })
        
        return {
            "success": True,
            "anomalies": anomalies,
            "count": len(anomalies)
        }
        
    except Exception as e:
        logger.error(f"检测异常失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def retrain_single_model(store_id: int):
    """后台任务：重新训练单个商家模型"""
    try:
        model = train_model(db_path, store_id)
        model_manager.save_model(model)
        logger.info(f"Successfully retrained model for store {store_id}")
    except Exception as e:
        logger.error(f"Failed to retrain model for store {store_id}: {e}")

async def retrain_all_models():
    """后台任务：重新训练所有模型"""
    try:
        update_all_models(db_path)
        logger.info("Successfully retrained all models")
    except Exception as e:
        logger.error(f"Failed to retrain all models: {e}")

def generate_insights(predictions: List[Dict]) -> List[Dict]:
    """根据预测结果生成AI洞察"""
    insights = []
    
    if not predictions:
        return insights
    
    # 即将发生变化的商家
    soon_changing = [p for p in predictions if p.get('next_change_days', 999) < 7]
    if soon_changing:
        insights.append({
            'type': 'urgent',
            'title': '即将变化的cashback rates',
            'message': f'{len(soon_changing)}家商家可能在一周内改变cashback rates',
            'stores': [p['store_name'] for p in soon_changing[:5]]
        })
    
    # 高增长预期
    high_increase = [p for p in predictions if p.get('magnitude_change', 0) > 2]
    if high_increase:
        insights.append({
            'type': 'opportunity',
            'title': '预期大幅增长',
            'message': f'{len(high_increase)}家商家预期cashback rate将大幅提升',
            'stores': [p['store_name'] for p in high_increase[:5]]
        })
    
    # 高upsize概率
    likely_upsized = [p for p in predictions if p.get('upsize_probability', 0) > 70]
    if likely_upsized:
        insights.append({
            'type': 'promotion',
            'title': '即将到来的upsize优惠',
            'message': f'{len(likely_upsized)}家商家很可能推出upsize促销',
            'stores': [p['store_name'] for p in likely_upsized[:5]]
        })
    
    # 低信心预测
    low_confidence = [p for p in predictions if p.get('confidence', 100) < 40]
    if low_confidence:
        insights.append({
            'type': 'warning',
            'title': '数据不足',
            'message': f'{len(low_confidence)}家商家的预测置信度较低，建议增加观测数据',
            'stores': [p['store_name'] for p in low_confidence[:5]]
        })
    
    return insights

async def check_price_alerts():
    """检查价格提醒条件"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 获取所有活跃提醒
        cursor.execute("""
            SELECT pa.*, s.name as current_store_name
            FROM price_alerts pa
            LEFT JOIN stores s ON pa.store_url = s.url
            WHERE pa.is_active = 1
        """)
        
        alerts = cursor.fetchall()
        
        for alert in alerts:
            # 获取最新的cashback数据
            cursor.execute("""
                SELECT ch.main_rate_numeric
                FROM cashback_history ch
                JOIN stores s ON ch.store_id = s.id
                WHERE s.url = ? AND ch.category = 'Main'
                ORDER BY ch.scraped_at DESC
                LIMIT 1
            """, (alert['store_url'],))
            
            latest_rate = cursor.fetchone()
            if not latest_rate:
                continue
                
            current_rate = latest_rate[0]
            should_notify = False
                    # 检查提醒条件
            if alert['threshold_type'] == 'above_current':
                should_notify = current_rate > alert['threshold_value']
            elif alert['threshold_type'] == 'fixed_value':
                should_notify = current_rate >= alert['threshold_value']
            elif alert['threshold_type'] == 'percentage_increase':
                # 这里需要计算与之前的比较，暂时简化
                should_notify = current_rate >= alert['threshold_value']
            
            if should_notify:
                # 发送邮件通知
                await send_alert_email(alert, current_rate)
                
                # 更新最后通知时间
                cursor.execute("""
                    UPDATE price_alerts 
                    SET last_notified_at = CURRENT_TIMESTAMP 
                    WHERE id = ?
                """, (alert['id'],))
        
        conn.commit()
        
    except Exception as e:
        logger.error(f"检查价格提醒失败: {e}")
    finally:
        conn.close()

async def send_alert_email(alert, current_rate):
    """异步发送提醒邮件"""
    import asyncio
    import concurrent.futures
    
    def _send_email():
        # 原来的同步邮件发送代码
        try:
            smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
            smtp_port = int(os.getenv("SMTP_PORT", "587"))
            sender_email = os.getenv("SMTP_EMAIL", "")
            sender_password = os.getenv("SMTP_PASSWORD", "")
            
            msg = MIMEMultipart()
            msg['From'] = sender_email
            msg['To'] = alert['user_email']
            msg['Subject'] = f"ShopBack价格提醒 - {alert['store_name']}"
            
            body = f"""
            您好！
            
            您关注的商家 {alert['store_name']} 的cashback率已达到提醒条件：
            
            当前cashback率: {current_rate}%
            您的提醒阈值: {alert['threshold_value']}%
            
            立即前往查看: {alert['store_url']}
            
            ---
            ShopBack Cashback 监控平台
            """
            
            msg.attach(MIMEText(body, 'plain', 'utf-8'))
            
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
            server.quit()
            
            return True
        except Exception as e:
            logger.error(f"发送邮件失败: {e}")
            return False
    
    # 在线程池中执行同步邮件发送
    loop = asyncio.get_event_loop()
    with concurrent.futures.ThreadPoolExecutor() as executor:
        success = await loop.run_in_executor(executor, _send_email)
        if success:
            logger.info(f"提醒邮件已发送到: {alert['user_email']}")

@app.post("/api/donations/pay", summary="处理捐赠支付")
async def process_donation(request: DonationRequest):
    """
    接收前端生成的支付Token和金额，使用Square API完成实际扣款。
    """
    try:
        # 将金额从浮点数（例如 10.50）转换为美分（1050）
        amount_micros = int(request.amount * 100)

        # 调用Square API（使用关键字参数）
        api_response = square_client.payments.create(
            source_id=request.token,
            idempotency_key=str(uuid.uuid4()), # 防止重复支付的唯一键
            amount_money={
                'amount': amount_micros,
                'currency': 'USD' # 假设货币为美元
            }
        )

        if api_response.is_success():
            payment_id = api_response.body['payment']['id']
            # TODO: 在第四阶段，在这里将交易记录存入数据库
            print(f"Payment successful, Square Payment ID: {payment_id}")
            return {"status": "success", "message": "Donation successful!", "payment_id": payment_id}
        elif api_response.is_error():
            errors = api_response.errors
            print(f"Payment failed with errors: {errors}")
            # 返回给前端的第一个错误信息
            error_message = errors[0].get('detail', 'Unknown payment error')
            raise HTTPException(status_code=400, detail=f"Payment failed: {error_message}")

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

# ==================== 杠杆交易 API ==================== #

@app.post("/api/leverage/calculate", response_model=LeverageAnalysisResponse, summary="计算杠杆交易分析")
async def calculate_leverage_position(request: LeverageCalculationRequest):
    """
    计算杠杆交易的各种参数，包括强制平仓价格、盈亏等
    """
    try:
        # 计算最大可用仓位
        max_position_size = request.principal * request.leverage / request.entry_price
        
        # 使用自定义仓位或最大仓位
        if request.position_size is not None:
            # 验证自定义仓位不超过最大值
            if request.position_size > max_position_size:
                raise HTTPException(
                    status_code=400, 
                    detail=f"仓位大小不能超过最大值: {max_position_size:.4f}"
                )
            if request.position_size <= 0:
                raise HTTPException(
                    status_code=400,
                    detail="仓位大小必须大于0"
                )
            actual_position_size = request.position_size
        else:
            actual_position_size = max_position_size
        
        # 创建杠杆持仓对象
        position = LeveragePosition(
            principal=request.principal,
            leverage=request.leverage,
            position_size=actual_position_size,
            entry_price=request.entry_price,
            direction=request.direction,
            symbol=request.symbol
        )
        
        # 执行分析
        analysis = LeverageCalculator.analyze_position(position, request.current_price)
        
        # 保存分析记录到数据库
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO leverage_analysis 
            (user_email, symbol, analysis_type, principal, leverage, entry_price, direction, analysis_result, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "anonymous",  # 如果没有用户登录，使用anonymous
            request.symbol,
            "liquidation",
            request.principal,
            request.leverage,
            request.entry_price,
            request.direction,
            json.dumps(analysis),
            datetime.now().isoformat()
        ))
        conn.commit()
        conn.close()
        
        return LeverageAnalysisResponse(**analysis)
    
    except Exception as e:
        logger.error(f"杠杆计算错误: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/leverage/target-loss", summary="计算达到目标亏损的价格")
async def calculate_target_loss_price(request: LeverageTargetLossRequest):
    """
    计算达到目标亏损金额时的价格
    """
    try:
        position = LeveragePosition(
            principal=request.principal,
            leverage=request.leverage,
            position_size=request.principal * request.leverage / request.entry_price,
            entry_price=request.entry_price,
            direction=request.direction,
            symbol=request.symbol
        )
        
        target_price = position.price_for_target_loss(request.max_loss_amount)
        
        # 计算该价格下的详细信息
        pnl_info = position.calculate_pnl(target_price) if target_price else None
        
        return {
            "target_price": target_price,
            "max_loss_amount": request.max_loss_amount,
            "price_change": abs(target_price - request.entry_price) if target_price else None,
            "price_change_percentage": abs((target_price - request.entry_price) / request.entry_price * 100) if target_price else None,
            "pnl_info": pnl_info
        }
    
    except Exception as e:
        logger.error(f"目标亏损计算错误: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/leverage/position", summary="创建杠杆持仓")
async def create_leverage_position(request: LeveragePositionRequest):
    """
    创建新的杠杆持仓记录
    """
    try:
        position = LeveragePosition(
            principal=request.principal,
            leverage=request.leverage,
            position_size=request.position_size,
            entry_price=request.entry_price,
            direction=request.direction,
            symbol=request.symbol
        )
        
        liquidation_price = position.liquidation_price
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO leverage_positions 
            (user_email, symbol, direction, principal, leverage, position_size, 
             entry_price, liquidation_price, current_price, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            request.user_email,
            request.symbol,
            request.direction,
            request.principal,
            request.leverage,
            request.position_size,
            request.entry_price,
            liquidation_price,
            request.entry_price,
            datetime.now().isoformat(),
            datetime.now().isoformat()
        ))
        
        position_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            "position_id": position_id,
            "liquidation_price": liquidation_price,
            "message": "持仓创建成功"
        }
    
    except Exception as e:
        logger.error(f"创建持仓错误: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/leverage/positions/{user_email}", summary="获取用户杠杆持仓")
async def get_user_positions(user_email: str, status: Optional[str] = Query(None)):
    """
    获取用户的杠杆持仓列表
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if status:
            cursor.execute("""
                SELECT * FROM leverage_positions 
                WHERE user_email = ? AND status = ?
                ORDER BY created_at DESC
            """, (user_email, status))
        else:
            cursor.execute("""
                SELECT * FROM leverage_positions 
                WHERE user_email = ?
                ORDER BY created_at DESC
            """, (user_email,))
        
        positions = cursor.fetchall()
        return [dict(pos) for pos in positions]
    
    finally:
        conn.close()

@app.put("/api/leverage/position/{position_id}/close", summary="平仓")
async def close_position(position_id: int, close_price: float):
    """
    平仓并记录交易历史
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 获取持仓信息
        cursor.execute("SELECT * FROM leverage_positions WHERE id = ?", (position_id,))
        position_data = cursor.fetchone()
        
        if not position_data:
            raise HTTPException(status_code=404, detail="持仓不存在")
        
        if position_data['status'] != 'open':
            raise HTTPException(status_code=400, detail="持仓已关闭")
        
        # 创建持仓对象计算盈亏
        position = LeveragePosition(
            principal=position_data['principal'],
            leverage=position_data['leverage'],
            position_size=position_data['position_size'],
            entry_price=position_data['entry_price'],
            direction=position_data['direction'],
            symbol=position_data['symbol']
        )
        
        pnl_info = position.calculate_pnl(close_price)
        
        # 更新持仓状态
        cursor.execute("""
            UPDATE leverage_positions 
            SET status = ?, close_price = ?, close_time = ?, 
                pnl_amount = ?, pnl_percentage = ?, updated_at = ?
            WHERE id = ?
        """, (
            'closed',
            close_price,
            datetime.now().isoformat(),
            pnl_info['pnl_amount'],
            pnl_info['pnl_percentage'],
            datetime.now().isoformat(),
            position_id
        ))
        
        # 记录交易历史
        cursor.execute("""
            INSERT INTO leverage_trade_history 
            (position_id, user_email, symbol, direction, principal, leverage, 
             position_size, entry_price, close_price, pnl_amount, pnl_percentage, 
             close_reason, open_time, close_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            position_id,
            position_data['user_email'],
            position_data['symbol'],
            position_data['direction'],
            position_data['principal'],
            position_data['leverage'],
            position_data['position_size'],
            position_data['entry_price'],
            close_price,
            pnl_info['pnl_amount'],
            pnl_info['pnl_percentage'],
            'manual',
            position_data['created_at'],
            datetime.now().isoformat()
        ))
        
        conn.commit()
        
        return {
            "message": "平仓成功",
            "pnl_amount": pnl_info['pnl_amount'],
            "pnl_percentage": pnl_info['pnl_percentage']
        }
    
    finally:
        conn.close()

@app.get("/api/leverage/history/{user_email}", summary="获取交易历史")
async def get_trade_history(user_email: str, limit: int = Query(50)):
    """
    获取用户的交易历史记录
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT * FROM leverage_trade_history 
            WHERE user_email = ?
            ORDER BY close_time DESC
            LIMIT ?
        """, (user_email, limit))
        
        history = cursor.fetchall()
        return [dict(trade) for trade in history]
    
    finally:
        conn.close()

# 错误处理
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "资源未找到"}
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "服务器内部错误"}
    )
def run_auto_rescrape():
    """包装函数，用于在线程中运行异步函数"""
    asyncio.run(auto_rescrape())

# 设置定时任务
schedule.every(6).hours.do(run_auto_rescrape)  # 改为调用包装函数

def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(60)

# 启动定时器线程
threading.Thread(target=run_scheduler, daemon=True).start()

# ============= ETH Kalman Model Endpoints =============

@app.on_event("startup")
async def startup_eth_model():
    """Initialize ETH model on startup"""
    try:
        # Load saved state if exists
        if eth_model_manager.load_state():
            logger.info("Loaded ETH Kalman model state from database")
        
        # Create wrapper for broadcasting updates
        async def broadcast_candle_updates(candle: dict):
            """Wrapper to broadcast candle updates via WebSocket"""
            try:
                # Call the original on_new_candle method
                predictions = await eth_data_manager.on_new_candle(candle)
                
                # Broadcast to WebSocket clients if we have predictions
                if predictions and eth_ws_clients:
                    await broadcast_eth_update({
                        "type": "update",
                        "candle": candle,
                        "predictions": predictions,
                        "model_state": eth_model_manager.get_model_metrics()
                    })
                
                return predictions
            except Exception as e:
                logger.error(f"Error in broadcast_candle_updates: {e}")
                return None
        
        # Start data manager with the broadcasting callback
        async def start_with_callback():
            await eth_data_manager.initialize()
            await eth_data_manager.fetcher.start_websocket_stream(broadcast_candle_updates)
        
        asyncio.create_task(start_with_callback())
        logger.info("Started ETH data manager with Binance WebSocket")
    except Exception as e:
        logger.error(f"Failed to start ETH model: {e}")

@app.get("/api/eth/current-price", summary="Get current ETH price and model state")
async def get_eth_current_price():
    """Get current ETH price with model state"""
    try:
        current_price = eth_data_manager.fetcher.get_current_price()
        model_metrics = eth_model_manager.get_model_metrics()
        
        return {
            "current_price": current_price,
            "model_state": model_metrics,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/eth/predictions", summary="Get ETH price predictions")
async def get_eth_predictions():
    """Get ETH price predictions for multiple horizons"""
    try:
        # Get latest candle
        candles = eth_data_manager.fetcher.get_recent_candles(2)
        if len(candles) < 2:
            return {"error": "Insufficient data for predictions"}
        
        # Generate predictions
        predictions = eth_model_manager.update_with_new_candle(candles[-1])
        
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/eth/candles-3m", summary="Get historical 3-minute candles")
async def get_eth_candles(limit: int = Query(100, le=500)):
    """Get historical 3-minute ETH candles"""
    try:
        candles = eth_data_manager.fetcher.get_recent_candles(limit)
        return {
            "candles": candles,
            "count": len(candles)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/eth/model/half-life", summary="Adjust Kalman filter half-life")
async def set_eth_half_life(half_life_candles: int = Query(..., ge=4, le=6)):
    """Adjust the half-life parameter (4-6 candles, i.e., 12-18 minutes)"""
    try:
        eth_model_manager.model.set_half_life(half_life_candles)
        eth_model_manager.save_state()
        
        return {
            "half_life_candles": half_life_candles,
            "half_life_minutes": half_life_candles * 3,
            "delta": eth_model_manager.model.delta
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/eth/model/metrics", summary="Get model performance metrics")
async def get_eth_model_metrics():
    """Get detailed model metrics and parameters"""
    try:
        metrics = eth_model_manager.get_model_metrics()
        state = eth_model_manager.model.get_state()
        
        return {
            "metrics": metrics,
            "state": state,
            "config": {
                "half_life_candles": eth_model_manager.model.half_life,
                "c_level": eth_model_manager.model.c_level,
                "c_trend": eth_model_manager.model.c_trend,
                "r0_mult": eth_model_manager.model.r0_mult
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/eth/kalman-updates")
async def eth_kalman_websocket(websocket: WebSocket):
    """WebSocket for real-time ETH Kalman model updates"""
    await websocket.accept()
    eth_ws_clients.add(websocket)
    
    try:
        # Send initial state
        current_price = eth_data_manager.fetcher.get_current_price()
        initial_data = {
            "type": "initial",
            "current_price": current_price,
            "model_state": eth_model_manager.get_model_metrics()
        }
        await websocket.send_json(initial_data)
        logger.info(f"New WebSocket client connected. Total clients: {len(eth_ws_clients)}")
        
        # Keep connection alive with periodic ping
        ping_interval = 30  # Send ping every 30 seconds
        last_ping = time.time()
        
        while True:
            try:
                # Check if we should send a ping
                current_time = time.time()
                if current_time - last_ping > ping_interval:
                    await websocket.send_json({"type": "ping", "timestamp": current_time})
                    last_ping = current_time
                
                # Try to receive data with timeout
                try:
                    await asyncio.wait_for(websocket.receive_text(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue  # No data received, continue loop
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error in WebSocket loop: {e}")
                break
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected. Remaining clients: {len(eth_ws_clients) - 1}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if websocket in eth_ws_clients:
            eth_ws_clients.remove(websocket)
        try:
            await websocket.close()
        except:
            pass

# Broadcast function for ETH updates
async def broadcast_eth_update(update_data: dict):
    """Broadcast ETH model updates to all WebSocket clients"""
    disconnected = set()
    for ws in eth_ws_clients:
        try:
            await ws.send_json(update_data)
        except:
            disconnected.add(ws)
    
    # Remove disconnected clients
    for ws in disconnected:
        eth_ws_clients.remove(ws)

# Note: The callback for broadcasting is now set in startup_eth_model()
# This prevents the recursion issue that was causing the maximum recursion depth error

if __name__ == "__main__":
    # Start the model scheduler
    start_model_scheduler(db_path)
    logger.info("Started Bayesian model scheduler")
    
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
