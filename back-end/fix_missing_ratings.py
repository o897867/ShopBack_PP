#!/usr/bin/env python3
"""
修复缺失的评分数据
手动为特定的经纪商实体添加评分
"""

import sqlite3
import json

DB_PATH = "/root/shopback/ShopBack_PP/back-end/shopback_data.db"

def get_db_connection():
    return sqlite3.connect(DB_PATH)

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

def fix_missing_ratings():
    """为缺失评分的经纪商手动添加评分"""

    # 根据CSV文件中的数据手动匹配
    missing_ratings = {
        # IG相关实体 - 使用 "IG" 的 A++ 评分
        17: {  # IG Australia Pty Ltd
            'rating': 'A++',
            'breakdown': {
                '监管强度': {'score': 95, 'weight': 0.3},
                '透明度与合规': {'score': 88, 'weight': 0.15},
                '交易成本': {'score': 85, 'weight': 0.15},
                '执行与流动性': {'score': 86, 'weight': 0.15},
                '平台与产品': {'score': 83, 'weight': 0.1},
                '服务与教育': {'score': 82, 'weight': 0.1},
                '稳定性与口碑': {'score': 90, 'weight': 0.05}
            }
        },
        18: {  # IG Markets Limited
            'rating': 'A++',
            'breakdown': {
                '监管强度': {'score': 95, 'weight': 0.3},
                '透明度与合规': {'score': 88, 'weight': 0.15},
                '交易成本': {'score': 85, 'weight': 0.15},
                '执行与流动性': {'score': 86, 'weight': 0.15},
                '平台与产品': {'score': 83, 'weight': 0.1},
                '服务与教育': {'score': 82, 'weight': 0.1},
                '稳定性与口碑': {'score': 90, 'weight': 0.05}
            }
        },

        # Plus500相关实体 - 使用 "Plus500" 的 B- 评分
        23: {  # Plus500CY Ltd
            'rating': 'B-',
            'breakdown': {
                '监管强度': {'score': 70, 'weight': 0.3},
                '透明度与合规': {'score': 65, 'weight': 0.15},
                '交易成本': {'score': 70, 'weight': 0.15},
                '执行与流动性': {'score': 68, 'weight': 0.15},
                '平台与产品': {'score': 65, 'weight': 0.1},
                '服务与教育': {'score': 65, 'weight': 0.1},
                '稳定性与口碑': {'score': 68, 'weight': 0.05}
            }
        },
        21: {  # Plus500SEY Ltd
            'rating': 'B-',
            'breakdown': {
                '监管强度': {'score': 70, 'weight': 0.3},
                '透明度与合规': {'score': 65, 'weight': 0.15},
                '交易成本': {'score': 70, 'weight': 0.15},
                '执行与流动性': {'score': 68, 'weight': 0.15},
                '平台与产品': {'score': 65, 'weight': 0.1},
                '服务与教育': {'score': 65, 'weight': 0.1},
                '稳定性与口碑': {'score': 68, 'weight': 0.05}
            }
        },
        20: {  # Plus500SG Pte Ltd
            'rating': 'B-',
            'breakdown': {
                '监管强度': {'score': 70, 'weight': 0.3},
                '透明度与合规': {'score': 65, 'weight': 0.15},
                '交易成本': {'score': 70, 'weight': 0.15},
                '执行与流动性': {'score': 68, 'weight': 0.15},
                '平台与产品': {'score': 65, 'weight': 0.1},
                '服务与教育': {'score': 65, 'weight': 0.1},
                '稳定性与口碑': {'score': 68, 'weight': 0.05}
            }
        },
        22: {  # Plus500UK Ltd
            'rating': 'B-',
            'breakdown': {
                '监管强度': {'score': 70, 'weight': 0.3},
                '透明度与合规': {'score': 65, 'weight': 0.15},
                '交易成本': {'score': 70, 'weight': 0.15},
                '执行与流动性': {'score': 68, 'weight': 0.15},
                '平台与产品': {'score': 65, 'weight': 0.1},
                '服务与教育': {'score': 65, 'weight': 0.1},
                '稳定性与口碑': {'score': 68, 'weight': 0.05}
            }
        },

        # Tickmill相关实体 - 使用 "Tickmill" 的 A- 评分
        28: {  # Tickmill Europe Ltd
            'rating': 'A-',
            'breakdown': {
                '监管强度': {'score': 88, 'weight': 0.3},
                '透明度与合规': {'score': 80, 'weight': 0.15},
                '交易成本': {'score': 78, 'weight': 0.15},
                '执行与流动性': {'score': 80, 'weight': 0.15},
                '平台与产品': {'score': 78, 'weight': 0.1},
                '服务与教育': {'score': 77, 'weight': 0.1},
                '稳定性与口碑': {'score': 82, 'weight': 0.05}
            }
        },
        27: {  # Tickmill Ltd
            'rating': 'A-',
            'breakdown': {
                '监管强度': {'score': 88, 'weight': 0.3},
                '透明度与合规': {'score': 80, 'weight': 0.15},
                '交易成本': {'score': 78, 'weight': 0.15},
                '执行与流动性': {'score': 80, 'weight': 0.15},
                '平台与产品': {'score': 78, 'weight': 0.1},
                '服务与教育': {'score': 77, 'weight': 0.1},
                '稳定性与口碑': {'score': 82, 'weight': 0.05}
            }
        },
        29: {  # Tickmill South Africa
            'rating': 'A-',
            'breakdown': {
                '监管强度': {'score': 88, 'weight': 0.3},
                '透明度与合规': {'score': 80, 'weight': 0.15},
                '交易成本': {'score': 78, 'weight': 0.15},
                '执行与流动性': {'score': 80, 'weight': 0.15},
                '平台与产品': {'score': 78, 'weight': 0.1},
                '服务与教育': {'score': 77, 'weight': 0.1},
                '稳定性与口碑': {'score': 82, 'weight': 0.05}
            }
        },
        26: {  # Tickmill UK Ltd
            'rating': 'A-',
            'breakdown': {
                '监管强度': {'score': 88, 'weight': 0.3},
                '透明度与合规': {'score': 80, 'weight': 0.15},
                '交易成本': {'score': 78, 'weight': 0.15},
                '执行与流动性': {'score': 80, 'weight': 0.15},
                '平台与产品': {'score': 78, 'weight': 0.1},
                '服务与教育': {'score': 77, 'weight': 0.1},
                '稳定性与口碑': {'score': 82, 'weight': 0.05}
            }
        },

        # XM相关实体 - XM / Trading.com
        34: {  # XM / Trading.com
            'rating': 'B-',
            'breakdown': {
                '监管强度': {'score': 70, 'weight': 0.3},
                '透明度与合规': {'score': 65, 'weight': 0.15},
                '交易成本': {'score': 70, 'weight': 0.15},
                '执行与流动性': {'score': 68, 'weight': 0.15},
                '平台与产品': {'score': 65, 'weight': 0.1},
                '服务与教育': {'score': 65, 'weight': 0.1},
                '稳定性与口碑': {'score': 68, 'weight': 0.05}
            }
        }
    }

    conn = get_db_connection()
    cursor = conn.cursor()

    updated_count = 0

    for broker_id, rating_data in missing_ratings.items():
        # 获取经纪商名称
        cursor.execute("SELECT name FROM cfd_brokers WHERE id = ?", (broker_id,))
        result = cursor.fetchone()

        if result:
            broker_name = result[0]

            if update_broker_rating(broker_id, rating_data['rating'], rating_data['breakdown']):
                print(f"✅ 更新成功: {broker_name} (ID: {broker_id}) - {rating_data['rating']}")
                updated_count += 1
            else:
                print(f"❌ 更新失败: {broker_name} (ID: {broker_id})")
        else:
            print(f"❌ 未找到经纪商 ID: {broker_id}")

    conn.close()
    print(f"\n修复完成: 成功更新 {updated_count} 个经纪商的评分")

def verify_fix():
    """验证修复结果"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 检查之前缺失评分的经纪商
    cursor.execute("""
        SELECT id, name, rating FROM cfd_brokers
        WHERE name LIKE '%IG%' OR name LIKE '%Plus500%' OR name LIKE '%Tickmill%' OR name LIKE '%XM%'
        ORDER BY name
    """)

    print("\n修复后的经纪商评分:")
    for broker_id, name, rating in cursor.fetchall():
        status = "✅" if rating else "❌"
        print(f"{status} {name} (ID: {broker_id}): {rating or '无评分'}")

    conn.close()

if __name__ == "__main__":
    print("开始修复缺失的评分数据...")
    fix_missing_ratings()
    verify_fix()
    print("\n修复完成!")