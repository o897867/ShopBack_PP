#!/usr/bin/env python3
"""
添加杠杆交易相关的数据库表
"""

import sqlite3
from datetime import datetime

def add_leverage_tables():
    """创建杠杆交易相关的数据库表"""
    conn = sqlite3.connect('shopback_data.db')
    cursor = conn.cursor()
    
    # 创建杠杆持仓表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leverage_positions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            symbol TEXT NOT NULL,
            direction TEXT NOT NULL CHECK(direction IN ('long', 'short')),
            principal REAL NOT NULL,
            leverage REAL NOT NULL,
            position_size REAL NOT NULL,
            entry_price REAL NOT NULL,
            liquidation_price REAL NOT NULL,
            current_price REAL,
            pnl_amount REAL DEFAULT 0,
            pnl_percentage REAL DEFAULT 0,
            margin_ratio REAL DEFAULT 1,
            status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'liquidated')),
            close_price REAL,
            close_time TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    
    # 创建杠杆交易历史表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leverage_trade_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            position_id INTEGER NOT NULL,
            user_email TEXT NOT NULL,
            symbol TEXT NOT NULL,
            direction TEXT NOT NULL,
            principal REAL NOT NULL,
            leverage REAL NOT NULL,
            position_size REAL NOT NULL,
            entry_price REAL NOT NULL,
            close_price REAL NOT NULL,
            pnl_amount REAL NOT NULL,
            pnl_percentage REAL NOT NULL,
            close_reason TEXT NOT NULL CHECK(close_reason IN ('manual', 'liquidated', 'stop_loss', 'take_profit')),
            open_time TEXT NOT NULL,
            close_time TEXT NOT NULL,
            FOREIGN KEY (position_id) REFERENCES leverage_positions(id)
        )
    ''')
    
    # 创建杠杆交易分析记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leverage_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            symbol TEXT NOT NULL,
            analysis_type TEXT NOT NULL CHECK(analysis_type IN ('liquidation', 'target_loss', 'target_profit', 'risk_levels')),
            principal REAL NOT NULL,
            leverage REAL NOT NULL,
            entry_price REAL NOT NULL,
            direction TEXT NOT NULL,
            analysis_result TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    
    # 创建索引以提高查询性能
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_positions_user ON leverage_positions(user_email)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_positions_status ON leverage_positions(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_history_user ON leverage_trade_history(user_email)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_analysis_user ON leverage_analysis(user_email)')
    
    conn.commit()
    conn.close()
    print("杠杆交易相关数据表创建成功！")

if __name__ == "__main__":
    add_leverage_tables()