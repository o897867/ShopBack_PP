#!/usr/bin/env python3
"""
数据库连接和初始化管理
"""

import sqlite3
import logging
from pathlib import Path
from config import DATABASE_PATH

logger = logging.getLogger(__name__)

def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # This makes rows behave like dictionaries
    return conn

def init_database():
    """初始化数据库表"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 初始化核心表 - CFD经纪商
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cfd_brokers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                regulators TEXT,
                regulator_details_json TEXT,
                rating TEXT,
                website TEXT,
                logo_url TEXT,
                rating_breakdown_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # CFD经纪商新闻
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cfd_broker_news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                broker_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                url TEXT,
                tag TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (broker_id) REFERENCES cfd_brokers (id)
            )
        """)

        # 杠杆交易持仓
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leverage_positions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                symbol TEXT NOT NULL,
                position_type TEXT NOT NULL,
                entry_price REAL NOT NULL,
                position_size REAL NOT NULL,
                leverage REAL NOT NULL,
                stop_loss REAL,
                take_profit REAL,
                current_pnl REAL DEFAULT 0,
                is_open INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                closed_at TIMESTAMP,
                exit_price REAL
            )
        """)

        # 杠杆交易历史
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leverage_trade_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                symbol TEXT NOT NULL,
                action TEXT NOT NULL,
                price REAL NOT NULL,
                quantity REAL NOT NULL,
                leverage REAL NOT NULL,
                pnl REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 杠杆分析记录
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leverage_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                symbol TEXT NOT NULL,
                entry_price REAL NOT NULL,
                target_price REAL NOT NULL,
                stop_loss REAL NOT NULL,
                position_size REAL NOT NULL,
                leverage REAL NOT NULL,
                max_profit REAL NOT NULL,
                max_loss REAL NOT NULL,
                risk_reward_ratio REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 创建索引
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_cfd_news_broker ON cfd_broker_news (broker_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_leverage_positions_user ON leverage_positions (user_email)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_leverage_history_user ON leverage_trade_history (user_email)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_leverage_analysis_user ON leverage_analysis (user_email)')

        conn.commit()
        logger.info("核心数据库表初始化完成")

        # 检查并添加缺失的列
        _update_schema(cursor, conn)

    except Exception as e:
        logger.error(f"数据库初始化失败: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

def _update_schema(cursor, conn):
    """更新数据库架构，添加缺失的列"""
    try:
        # 检查 cfd_brokers 表是否有所需列
        cursor.execute("PRAGMA table_info(cfd_brokers)")
        columns = {row[1] for row in cursor.fetchall()}

        updates = []
        if 'rating_breakdown_json' not in columns:
            updates.append("ALTER TABLE cfd_brokers ADD COLUMN rating_breakdown_json TEXT")
        if 'regulator_details_json' not in columns:
            updates.append("ALTER TABLE cfd_brokers ADD COLUMN regulator_details_json TEXT")
        if 'updated_at' not in columns:
            updates.append("ALTER TABLE cfd_brokers ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

        for update in updates:
            cursor.execute(update)

        if updates:
            conn.commit()
            logger.info(f"数据库架构更新完成，添加了 {len(updates)} 个列")

    except Exception as e:
        logger.warning(f"数据库架构更新失败: {e}")

def init_legacy_tables():
    """初始化Legacy功能表 (仅在启用Legacy功能时调用)"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # ShopBack相关表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                url TEXT NOT NULL,
                category TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cashback_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                store_id INTEGER,
                main_cashback TEXT,
                main_rate_numeric REAL,
                category TEXT,
                category_rate TEXT,
                category_rate_numeric REAL,
                is_upsized INTEGER DEFAULT 0,
                previous_offer TEXT,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (store_id) REFERENCES stores (id)
            )
        """)

        # ETH相关表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS eth_candles_3m (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER NOT NULL,
                open_price REAL NOT NULL,
                high_price REAL NOT NULL,
                low_price REAL NOT NULL,
                close_price REAL NOT NULL,
                volume REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS eth_predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER NOT NULL,
                current_price REAL NOT NULL,
                predicted_price_1h REAL NOT NULL,
                predicted_price_4h REAL NOT NULL,
                predicted_price_24h REAL NOT NULL,
                confidence_score REAL NOT NULL,
                model_version TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 其他Legacy表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS price_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                store_url TEXT NOT NULL,
                store_name TEXT NOT NULL,
                threshold_type TEXT NOT NULL,
                threshold_value REAL NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS showcase_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS showcase_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                image_url TEXT,
                external_url TEXT,
                start_date DATE,
                end_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES showcase_categories (id)
            )
        """)

        conn.commit()
        logger.info("Legacy数据库表初始化完成")

    except Exception as e:
        logger.error(f"Legacy数据库初始化失败: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

def check_database_health():
    """检查数据库健康状态"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 检查核心表
        cursor.execute("SELECT COUNT(*) FROM cfd_brokers")
        broker_count = cursor.fetchone()[0]

        try:
            cursor.execute("SELECT COUNT(*) FROM leverage_positions WHERE is_open = 1")
            active_positions = cursor.fetchone()[0]
        except sqlite3.OperationalError:
            # 如果leverage_positions表不存在或列不存在，返回0
            active_positions = 0

        conn.close()

        return {
            "status": "healthy",
            "broker_count": broker_count,
            "active_positions": active_positions
        }

    except Exception as e:
        logger.error(f"数据库健康检查失败: {e}")
        return {
            "status": "error",
            "error": str(e)
        }