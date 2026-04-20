#!/usr/bin/env python3
"""
Health Module Database Models and Initialization
健康模块数据库模型 - 体重K线拟合系统
"""

import sqlite3
import logging
from datetime import datetime
from typing import Optional, Dict, List
from database import get_db_connection

logger = logging.getLogger(__name__)


def init_health_tables():
    """初始化健康模块相关数据表"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 1. 健康档案表 - 用户基础信息和目标
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS health_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL UNIQUE,
                age INTEGER,
                gender TEXT CHECK(gender IN ('male', 'female', 'other')),
                height_cm REAL,
                activity_level TEXT DEFAULT 'moderate',
                target_weight REAL,
                current_weight REAL,
                target_date DATE,
                target_type TEXT DEFAULT 'loss' CHECK(target_type IN ('loss', 'gain', 'maintain')),
                daily_calorie_budget INTEGER DEFAULT 2000,
                risk_tolerance TEXT DEFAULT 'moderate' CHECK(risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 2. 体重记录表 - 每日体重/体脂数据
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS weight_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                log_date DATE NOT NULL,
                weight_kg REAL NOT NULL,
                body_fat_pct REAL,
                muscle_mass_kg REAL,
                water_pct REAL,
                notes TEXT,
                market_sentiment TEXT,  -- 市场情绪: bullish/bearish/neutral
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_email, log_date),
                FOREIGN KEY (user_email) REFERENCES health_profiles(user_email)
            )
        """)

        # 3. 训练偏好表 - 用户训练喜好设置
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS training_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL UNIQUE,
                preferred_activities TEXT,  -- JSON array of activities
                training_days_per_week INTEGER DEFAULT 3,
                session_duration_min INTEGER DEFAULT 45,
                intensity_preference TEXT DEFAULT 'moderate',
                equipment_available TEXT,  -- JSON array
                injuries_limitations TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_email) REFERENCES health_profiles(user_email)
            )
        """)

        # 4. K线匹配记录表 - 体重曲线与金融K线匹配历史
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS match_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                weight_sequence TEXT NOT NULL,  -- JSON array of weight changes
                matched_symbol TEXT NOT NULL,  -- e.g., BTC, ETH, GOLD
                matched_timeframe TEXT NOT NULL,  -- e.g., 1m, 5m, 1h
                similarity_score REAL NOT NULL,  -- 0-100 similarity percentage
                match_period_start TIMESTAMP,
                match_period_end TIMESTAMP,
                market_performance REAL,  -- Market return during that period
                weight_performance REAL,  -- User weight change %
                match_details TEXT,  -- JSON with detailed match info
                shared BOOLEAN DEFAULT 0,
                share_count INTEGER DEFAULT 0,
                FOREIGN KEY (user_email) REFERENCES health_profiles(user_email)
            )
        """)

        # 5. 训练活动表 - 训练记录
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS training_activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                activity_date DATE NOT NULL,
                activity_type TEXT NOT NULL,
                duration_min INTEGER,
                calories_burned INTEGER,
                intensity TEXT,
                heart_rate_avg INTEGER,
                distance_km REAL,
                notes TEXT,
                market_correlation TEXT,  -- 关联的市场事件
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_email) REFERENCES health_profiles(user_email)
            )
        """)

        # 6. 卡路里预算表 - 每日卡路里收支
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS calorie_ledger (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                ledger_date DATE NOT NULL,
                calorie_income INTEGER DEFAULT 0,  -- 摄入
                calorie_expense INTEGER DEFAULT 0,  -- 消耗
                calorie_balance INTEGER DEFAULT 0,  -- 净值
                budget_remaining INTEGER,
                risk_level TEXT,  -- 'safe', 'warning', 'danger'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_email, ledger_date),
                FOREIGN KEY (user_email) REFERENCES health_profiles(user_email)
            )
        """)

        # 7. 成就徽章表 - 游戏化元素
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS health_achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                achievement_type TEXT NOT NULL,
                achievement_name TEXT NOT NULL,
                achievement_description TEXT,
                earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                milestone_value REAL,  -- e.g., 5kg loss, 90% similarity
                badge_level TEXT DEFAULT 'bronze',  -- bronze, silver, gold, diamond
                FOREIGN KEY (user_email) REFERENCES health_profiles(user_email)
            )
        """)

        # 创建索引以提高查询性能
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_email, log_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_match_sessions_user ON match_sessions(user_email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_training_activities_user_date ON training_activities(user_email, activity_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_calorie_ledger_user_date ON calorie_ledger(user_email, ledger_date)")

        conn.commit()
        logger.info("✅ 健康模块数据表初始化成功")

    except Exception as e:
        logger.error(f"❌ 健康模块数据表初始化失败: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


class HealthProfile:
    """健康档案模型"""

    @staticmethod
    def create_or_update(user_email: str, data: Dict) -> bool:
        """创建或更新用户健康档案"""
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            # Check if profile exists
            cursor.execute("SELECT id FROM health_profiles WHERE user_email = ?", (user_email,))
            exists = cursor.fetchone()

            if exists:
                # Update existing profile
                update_fields = []
                values = []
                for key, value in data.items():
                    if key != 'user_email':
                        update_fields.append(f"{key} = ?")
                        values.append(value)

                if update_fields:
                    values.append(datetime.now())
                    values.append(user_email)
                    query = f"""
                        UPDATE health_profiles
                        SET {', '.join(update_fields)}, updated_at = ?
                        WHERE user_email = ?
                    """
                    cursor.execute(query, values)
            else:
                # Create new profile
                data['user_email'] = user_email
                columns = ', '.join(data.keys())
                placeholders = ', '.join(['?' for _ in data])
                query = f"INSERT INTO health_profiles ({columns}) VALUES ({placeholders})"
                cursor.execute(query, list(data.values()))

            conn.commit()
            return True

        except Exception as e:
            logger.error(f"Error creating/updating health profile: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()

    @staticmethod
    def get(user_email: str) -> Optional[Dict]:
        """获取用户健康档案"""
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("SELECT * FROM health_profiles WHERE user_email = ?", (user_email,))
            row = cursor.fetchone()

            if row:
                return dict(row)
            return None

        except Exception as e:
            logger.error(f"Error fetching health profile: {e}")
            return None
        finally:
            conn.close()


class WeightLog:
    """体重记录模型"""

    @staticmethod
    def add(user_email: str, weight_kg: float, log_date: str = None, **kwargs) -> bool:
        """添加体重记录"""
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            if not log_date:
                log_date = datetime.now().strftime('%Y-%m-%d')

            # Determine market sentiment based on weight change
            cursor.execute("""
                SELECT weight_kg FROM weight_logs
                WHERE user_email = ?
                ORDER BY log_date DESC
                LIMIT 1
            """, (user_email,))

            last_weight = cursor.fetchone()
            market_sentiment = 'neutral'

            if last_weight:
                change_pct = ((weight_kg - last_weight[0]) / last_weight[0]) * 100
                if change_pct < -0.5:
                    market_sentiment = 'bullish'  # Weight loss = bullish
                elif change_pct > 0.5:
                    market_sentiment = 'bearish'  # Weight gain = bearish

            data = {
                'user_email': user_email,
                'log_date': log_date,
                'weight_kg': weight_kg,
                'market_sentiment': market_sentiment,
                **kwargs
            }

            columns = ', '.join(data.keys())
            placeholders = ', '.join(['?' for _ in data])
            query = f"""
                INSERT OR REPLACE INTO weight_logs ({columns})
                VALUES ({placeholders})
            """
            cursor.execute(query, list(data.values()))

            conn.commit()
            return True

        except Exception as e:
            logger.error(f"Error adding weight log: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()

    @staticmethod
    def get_history(user_email: str, days: int = 30) -> List[Dict]:
        """获取体重历史记录"""
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            query = """
                SELECT * FROM weight_logs
                WHERE user_email = ?
                AND log_date >= date('now', '-' || ? || ' days')
                ORDER BY log_date ASC
            """
            cursor.execute(query, (user_email, days))

            rows = cursor.fetchall()
            return [dict(row) for row in rows]

        except Exception as e:
            logger.error(f"Error fetching weight history: {e}")
            return []
        finally:
            conn.close()


class TrainingActivity:
    """训练活动模型"""

    @staticmethod
    def log(user_email: str, activity_type: str, calories_burned: int, **kwargs) -> bool:
        """记录训练活动"""
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            data = {
                'user_email': user_email,
                'activity_date': kwargs.get('activity_date', datetime.now().strftime('%Y-%m-%d')),
                'activity_type': activity_type,
                'calories_burned': calories_burned,
                **kwargs
            }

            columns = ', '.join(data.keys())
            placeholders = ', '.join(['?' for _ in data])
            query = f"INSERT INTO training_activities ({columns}) VALUES ({placeholders})"
            cursor.execute(query, list(data.values()))

            # Update calorie ledger
            CalorieLedger.update_expense(
                user_email,
                calories_burned,
                data['activity_date']
            )

            conn.commit()
            return True

        except Exception as e:
            logger.error(f"Error logging training activity: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()


class CalorieLedger:
    """卡路里账本模型"""

    @staticmethod
    def update_expense(user_email: str, calories: int, date: str = None) -> bool:
        """更新卡路里支出"""
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            if not date:
                date = datetime.now().strftime('%Y-%m-%d')

            # Get user's daily budget
            cursor.execute("""
                SELECT daily_calorie_budget FROM health_profiles
                WHERE user_email = ?
            """, (user_email,))

            budget_row = cursor.fetchone()
            budget = budget_row[0] if budget_row else 2000

            # Update or create ledger entry
            cursor.execute("""
                INSERT INTO calorie_ledger
                (user_email, ledger_date, calorie_expense, budget_remaining)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_email, ledger_date)
                DO UPDATE SET
                    calorie_expense = calorie_expense + ?,
                    budget_remaining = ? - (calorie_income - (calorie_expense + ?))
            """, (user_email, date, calories, budget - calories,
                  calories, budget, calories))

            conn.commit()
            return True

        except Exception as e:
            logger.error(f"Error updating calorie ledger: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()


if __name__ == "__main__":
    # Initialize health tables when module is run directly
    init_health_tables()