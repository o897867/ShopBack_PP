#!/usr/bin/env python3
"""
导入经纪商评分数据脚本
从 Broker_Scoring.csv 文件中读取评分数据并更新到数据库
"""

import sqlite3
import csv
import json
import os
import sys
from pathlib import Path

# 数据库连接
DB_PATH = "/root/shopback/ShopBack_PP/back-end/shopback_data.db"
CSV_PATH = "/root/shopback/ShopBack_PP/Broker_Scoring.csv"

def get_db_connection():
    """获取数据库连接"""
    return sqlite3.connect(DB_PATH)

def load_existing_brokers():
    """加载现有的经纪商数据"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, name FROM cfd_brokers")
    brokers = {row[1].strip().lower(): row[0] for row in cursor.fetchall()}

    conn.close()
    return brokers

def normalize_broker_name(name):
    """标准化经纪商名称进行匹配"""
    # 移除常见的后缀和前缀
    name = name.strip().lower()
    name = name.replace(" ltd", "").replace(" limited", "")
    name = name.replace(" pty", "").replace(" inc", "")
    name = name.replace(" (au)", "").replace(" australia", "")
    name = name.replace(" uk", "").replace(" europe", "")
    name = name.replace(" global", "").replace(" prime", "")
    name = name.replace(" markets", "").replace(" capital", "")
    return name.strip()

def find_broker_id(broker_name, existing_brokers):
    """根据名称查找经纪商ID"""
    normalized_name = normalize_broker_name(broker_name)

    # 直接匹配
    if normalized_name in existing_brokers:
        return existing_brokers[normalized_name]

    # 模糊匹配
    for db_name, broker_id in existing_brokers.items():
        db_normalized = normalize_broker_name(db_name)
        if normalized_name in db_normalized or db_normalized in normalized_name:
            return broker_id

    return None

def calculate_weighted_score(scores):
    """计算加权总分"""
    weights = {
        '监管强度': 0.3,
        '透明度与合规': 0.15,
        '交易成本': 0.15,
        '执行与流动性': 0.15,
        '平台与产品': 0.1,
        '服务与教育': 0.1,
        '稳定性与口碑': 0.05
    }

    total_score = 0
    for category, weight in weights.items():
        if category in scores:
            total_score += scores[category] * weight

    return round(total_score, 1)

def update_broker_rating(broker_id, overall_rating, rating_breakdown):
    """更新经纪商评分"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE cfd_brokers
            SET rating = ?, rating_breakdown_json = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (overall_rating, json.dumps(rating_breakdown, ensure_ascii=False), broker_id))

        conn.commit()
        return True
    except Exception as e:
        print(f"Error updating broker {broker_id}: {e}")
        return False
    finally:
        conn.close()

def import_ratings():
    """导入评分数据"""
    if not os.path.exists(CSV_PATH):
        print(f"CSV文件不存在: {CSV_PATH}")
        return

    existing_brokers = load_existing_brokers()
    print(f"数据库中现有经纪商数量: {len(existing_brokers)}")

    updated_count = 0
    not_found_count = 0

    with open(CSV_PATH, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)

        for row in reader:
            broker_name = row['经纪商名称'].strip()
            if not broker_name:
                continue

            # 查找对应的数据库ID
            broker_id = find_broker_id(broker_name, existing_brokers)

            if broker_id is None:
                print(f"未找到经纪商: {broker_name}")
                not_found_count += 1
                continue

            # 构建评分详情
            rating_breakdown = {
                '监管强度': {
                    'score': int(row['监管强度(30%)']),
                    'weight': 0.3
                },
                '透明度与合规': {
                    'score': int(row['透明度与合规(15%)']),
                    'weight': 0.15
                },
                '交易成本': {
                    'score': int(row['交易成本(15%)']),
                    'weight': 0.15
                },
                '执行与流动性': {
                    'score': int(row['执行与流动性(15%)']),
                    'weight': 0.15
                },
                '平台与产品': {
                    'score': int(row['平台与产品(10%)']),
                    'weight': 0.1
                },
                '服务与教育': {
                    'score': int(row['服务与教育(10%)']),
                    'weight': 0.1
                },
                '稳定性与口碑': {
                    'score': int(row['稳定性与口碑(5%)']),
                    'weight': 0.05
                }
            }

            overall_rating = row['总体评分'].strip()

            # 更新数据库
            if update_broker_rating(broker_id, overall_rating, rating_breakdown):
                print(f"✅ 更新成功: {broker_name} (ID: {broker_id}) - {overall_rating}")
                updated_count += 1
            else:
                print(f"❌ 更新失败: {broker_name} (ID: {broker_id})")

    print(f"\n导入完成:")
    print(f"- 成功更新: {updated_count} 个经纪商")
    print(f"- 未找到匹配: {not_found_count} 个经纪商")

def verify_import():
    """验证导入结果"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN rating IS NOT NULL AND rating != '' THEN 1 END) as rated
        FROM cfd_brokers
    """)

    total, rated = cursor.fetchone()

    print(f"\n数据库状态:")
    print(f"- 总经纪商数: {total}")
    print(f"- 已评分经纪商: {rated}")
    print(f"- 未评分经纪商: {total - rated}")

    # 显示最新的评分数据样例
    cursor.execute("""
        SELECT name, rating, rating_breakdown_json
        FROM cfd_brokers
        WHERE rating IS NOT NULL AND rating != ''
        ORDER BY updated_at DESC
        LIMIT 5
    """)

    print(f"\n最近更新的评分 (前5个):")
    for name, rating, breakdown_json in cursor.fetchall():
        print(f"- {name}: {rating}")

    conn.close()

if __name__ == "__main__":
    print("开始导入经纪商评分数据...")
    import_ratings()
    verify_import()
    print("\n导入完成!")