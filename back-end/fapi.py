#!/usr/bin/env python3
"""
ShopBack FastAPI后端
为React前端提供RESTful API接口
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

# 全局变量
scraper_instance = None
db_path = "shopback_data.db"
model_manager = ModelManager(db_path)

# 初始化Square客户端
square_client = Square(
    token=os.environ.get("SQUARE_ACCESS_TOKEN"),
    environment=SquareEnvironment.SANDBOX  # 使用正确的枚举
)

# 日志设置
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
async def auto_rescrape():
    """定时自动抓取函数"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 获取所有商家URL
        cursor.execute("SELECT url FROM stores")
        urls = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        # 执行批量抓取
        await scrape_multiple_background(urls, 2)
        
        # 检查价格提醒
        await check_price_alerts()
        
        logger.info(f"定时抓取完成，共处理 {len(urls)} 个商家")
    except Exception as e:
        logger.error(f"定时抓取失败: {e}")
def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

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
    """后台批量抓取任务"""
    scraper = get_scraper()
    
    for i, url in enumerate(urls):
        try:
            result = scraper.scrape_store_page(url)
            logger.info(f"批量抓取进度 {i+1}/{len(urls)}: {result.name} - {result.main_cashback}")
            
            # 添加延迟，避免过于频繁的请求
            if i < len(urls) - 1:
                time.sleep(delay_seconds)
                
        except Exception as e:
            logger.error(f"批量抓取失败: {url} - {str(e)}")
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
            smtp_server = "smtp.gmail.com"
            smtp_port = 587
            sender_email = "suyingcin@gmail.com"
            sender_password = "xoxl erjc bjrb yxlg"
            
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

if __name__ == "__main__":
    # Start the model scheduler
    start_model_scheduler(db_path)
    logger.info("Started Bayesian model scheduler")
    
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
