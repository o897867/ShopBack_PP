#!/usr/bin/env python3
"""
交易计算器业务逻辑服务
"""

import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from database import get_db_connection
from models.calculator_models import (
    LeverageAnalysisResponse,
    LeveragePosition,
    TradeHistoryEntry,
    PortfolioSummary,
    RiskAnalysis,
    CalculatorSettings
)

class CalculatorService:
    """交易计算器业务逻辑类"""

    # 默认设置
    DEFAULT_SETTINGS = CalculatorSettings()

    @staticmethod
    def calculate_leverage_analysis(
        entry_price: float,
        exit_price: float,
        position_size: float,
        leverage: float,
        position_type: str
    ) -> LeverageAnalysisResponse:
        """计算杠杆交易分析"""

        if entry_price <= 0 or position_size <= 0 or leverage <= 0:
            raise HTTPException(status_code=400, detail="价格、仓位大小和杠杆倍数必须大于0")

        if position_type not in ['long', 'short']:
            raise HTTPException(status_code=400, detail="仓位类型必须是 'long' 或 'short'")

        # 计算价格变化
        price_change = exit_price - entry_price
        price_change_percent = (price_change / entry_price) * 100

        # 根据仓位类型调整价格变化
        if position_type == 'short':
            price_change = -price_change
            price_change_percent = -price_change_percent

        # 计算杠杆后的收益变化
        leveraged_change_percent = price_change_percent * leverage

        # 计算盈亏
        profit_loss = position_size * (leveraged_change_percent / 100)
        profit_loss_percent = leveraged_change_percent

        # 计算保证金要求
        margin_required = position_size / leverage

        # 计算最大亏损 (100%保证金)
        max_loss = margin_required

        # 计算强制平仓价格
        liquidation_price = CalculatorService._calculate_liquidation_price(
            entry_price, leverage, position_type
        )

        # 风险评估
        risk_level = CalculatorService._assess_risk_level(leverage, abs(leveraged_change_percent))
        recommendation = CalculatorService._generate_recommendation(risk_level, leveraged_change_percent)

        return LeverageAnalysisResponse(
            entry_price=entry_price,
            exit_price=exit_price,
            position_size=position_size,
            leverage=leverage,
            position_type=position_type,
            price_change=price_change,
            price_change_percent=price_change_percent,
            leveraged_change_percent=leveraged_change_percent,
            profit_loss=profit_loss,
            profit_loss_percent=profit_loss_percent,
            liquidation_price=liquidation_price,
            margin_required=margin_required,
            max_loss=max_loss,
            risk_level=risk_level,
            recommendation=recommendation
        )

    @staticmethod
    def calculate_target_loss_price(
        entry_price: float,
        position_size: float,
        leverage: float,
        target_loss_amount: float,
        position_type: str
    ) -> Dict[str, Any]:
        """计算达到目标亏损的价格"""

        if entry_price <= 0 or position_size <= 0 or leverage <= 0:
            raise HTTPException(status_code=400, detail="价格、仓位大小和杠杆倍数必须大于0")

        if target_loss_amount <= 0:
            raise HTTPException(status_code=400, detail="目标亏损金额必须大于0")

        margin_required = position_size / leverage

        if target_loss_amount > margin_required:
            raise HTTPException(
                status_code=400,
                detail=f"目标亏损金额不能超过保证金 ({margin_required:.2f})"
            )

        # 计算亏损百分比
        loss_percent = (target_loss_amount / position_size) * 100

        # 计算价格变化百分比 (考虑杠杆)
        price_change_percent = loss_percent / leverage

        # 计算目标价格
        if position_type == 'long':
            target_price = entry_price * (1 - price_change_percent / 100)
        elif position_type == 'short':
            target_price = entry_price * (1 + price_change_percent / 100)
        else:
            raise HTTPException(status_code=400, detail="仓位类型必须是 'long' 或 'short'")

        # 计算强制平仓价格
        liquidation_price = CalculatorService._calculate_liquidation_price(
            entry_price, leverage, position_type
        )

        return {
            "entry_price": entry_price,
            "target_price": target_price,
            "target_loss_amount": target_loss_amount,
            "price_change_needed": abs(target_price - entry_price),
            "price_change_percent": price_change_percent,
            "liquidation_price": liquidation_price,
            "margin_required": margin_required,
            "is_achievable": target_price != liquidation_price,
            "warning": "目标价格接近强制平仓价格" if abs(target_price - liquidation_price) < entry_price * 0.01 else None
        }

    @staticmethod
    def create_position(
        user_email: str,
        symbol: str,
        position_type: str,
        entry_price: float,
        position_size: float,
        leverage: float,
        stop_loss: Optional[float] = None,
        take_profit: Optional[float] = None
    ) -> LeveragePosition:
        """创建杠杆持仓"""

        # 验证输入
        if entry_price <= 0 or position_size <= 0 or leverage <= 0:
            raise HTTPException(status_code=400, detail="价格、仓位大小和杠杆倍数必须大于0")

        if position_type not in ['long', 'short']:
            raise HTTPException(status_code=400, detail="仓位类型必须是 'long' 或 'short'")

        # 验证止损和止盈价格
        if stop_loss:
            if position_type == 'long' and stop_loss >= entry_price:
                raise HTTPException(status_code=400, detail="多头仓位的止损价格必须低于入场价格")
            if position_type == 'short' and stop_loss <= entry_price:
                raise HTTPException(status_code=400, detail="空头仓位的止损价格必须高于入场价格")

        if take_profit:
            if position_type == 'long' and take_profit <= entry_price:
                raise HTTPException(status_code=400, detail="多头仓位的止盈价格必须高于入场价格")
            if position_type == 'short' and take_profit >= entry_price:
                raise HTTPException(status_code=400, detail="空头仓位的止盈价格必须低于入场价格")

        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO leverage_positions (
                    user_email, symbol, position_type, entry_price, position_size,
                    leverage, stop_loss, take_profit
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_email, symbol, position_type, entry_price, position_size,
                leverage, stop_loss, take_profit
            ))

            position_id = cursor.lastrowid

            # 记录交易历史
            cursor.execute("""
                INSERT INTO leverage_trade_history (
                    user_email, symbol, action, price, quantity, leverage
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (user_email, symbol, 'open', entry_price, position_size, leverage))

            conn.commit()

            # 获取创建的持仓
            cursor.execute("""
                SELECT id, user_email, symbol, position_type, entry_price, position_size,
                       leverage, stop_loss, take_profit, current_pnl, is_open, created_at,
                       closed_at, exit_price
                FROM leverage_positions WHERE id = ?
            """, (position_id,))

            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=500, detail="创建持仓失败")

            position_data = dict(zip([col[0] for col in cursor.description], row))
            return LeveragePosition(**position_data)

        except Exception as e:
            conn.rollback()
            if "UNIQUE constraint failed" in str(e):
                raise HTTPException(status_code=400, detail="持仓已存在")
            raise HTTPException(status_code=500, detail=f"创建持仓失败: {str(e)}")
        finally:
            conn.close()

    @staticmethod
    def get_user_positions(user_email: str, include_closed: bool = False) -> List[LeveragePosition]:
        """获取用户的杠杆持仓"""
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            if include_closed:
                cursor.execute("""
                    SELECT id, user_email, symbol, position_type, entry_price, position_size,
                           leverage, stop_loss, take_profit, current_pnl, is_open, created_at,
                           closed_at, exit_price
                    FROM leverage_positions WHERE user_email = ?
                    ORDER BY created_at DESC
                """, (user_email,))
            else:
                cursor.execute("""
                    SELECT id, user_email, symbol, position_type, entry_price, position_size,
                           leverage, stop_loss, take_profit, current_pnl, is_open, created_at,
                           closed_at, exit_price
                    FROM leverage_positions WHERE user_email = ? AND is_open = 1
                    ORDER BY created_at DESC
                """, (user_email,))

            rows = cursor.fetchall()
            positions = []

            for row in rows:
                position_data = dict(zip([col[0] for col in cursor.description], row))
                positions.append(LeveragePosition(**position_data))

            return positions

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"获取持仓失败: {str(e)}")
        finally:
            conn.close()

    @staticmethod
    def close_position(position_id: int, exit_price: float, close_reason: str = "manual") -> LeveragePosition:
        """平仓"""
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            # 获取持仓信息
            cursor.execute("""
                SELECT id, user_email, symbol, position_type, entry_price, position_size,
                       leverage, is_open
                FROM leverage_positions WHERE id = ? AND is_open = 1
            """, (position_id,))

            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="持仓不存在或已平仓")

            position_data = dict(zip([col[0] for col in cursor.description], row))

            # 计算盈亏
            analysis = CalculatorService.calculate_leverage_analysis(
                position_data['entry_price'],
                exit_price,
                position_data['position_size'],
                position_data['leverage'],
                position_data['position_type']
            )

            # 更新持仓状态
            cursor.execute("""
                UPDATE leverage_positions
                SET is_open = 0, exit_price = ?, current_pnl = ?, closed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (exit_price, analysis.profit_loss, position_id))

            # 记录交易历史
            cursor.execute("""
                INSERT INTO leverage_trade_history (
                    user_email, symbol, action, price, quantity, leverage, pnl
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                position_data['user_email'],
                position_data['symbol'],
                f'close_{close_reason}',
                exit_price,
                position_data['position_size'],
                position_data['leverage'],
                analysis.profit_loss
            ))

            conn.commit()

            # 返回更新后的持仓
            cursor.execute("""
                SELECT id, user_email, symbol, position_type, entry_price, position_size,
                       leverage, stop_loss, take_profit, current_pnl, is_open, created_at,
                       closed_at, exit_price
                FROM leverage_positions WHERE id = ?
            """, (position_id,))

            row = cursor.fetchone()
            position_data = dict(zip([col[0] for col in cursor.description], row))
            return LeveragePosition(**position_data)

        except HTTPException:
            raise
        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=500, detail=f"平仓失败: {str(e)}")
        finally:
            conn.close()

    @staticmethod
    def get_trade_history(user_email: str) -> List[TradeHistoryEntry]:
        """获取交易历史"""
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                SELECT id, user_email, symbol, action, price, quantity, leverage, pnl, created_at
                FROM leverage_trade_history
                WHERE user_email = ?
                ORDER BY created_at DESC
            """, (user_email,))

            rows = cursor.fetchall()
            history = []

            for row in rows:
                history_data = dict(zip([col[0] for col in cursor.description], row))
                history.append(TradeHistoryEntry(**history_data))

            return history

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"获取交易历史失败: {str(e)}")
        finally:
            conn.close()

    @staticmethod
    def _calculate_liquidation_price(entry_price: float, leverage: float, position_type: str) -> float:
        """计算强制平仓价格"""
        # 简化计算：假设维持保证金为1%
        maintenance_margin_percent = 1.0

        if position_type == 'long':
            # 多头：价格下跌到 entry_price * (1 - (100/leverage + maintenance_margin)/100)
            liquidation_price = entry_price * (1 - (100 / leverage + maintenance_margin_percent) / 100)
        else:  # short
            # 空头：价格上涨到 entry_price * (1 + (100/leverage + maintenance_margin)/100)
            liquidation_price = entry_price * (1 + (100 / leverage + maintenance_margin_percent) / 100)

        return liquidation_price

    @staticmethod
    def _assess_risk_level(leverage: float, change_percent: float) -> str:
        """评估风险等级"""
        if leverage >= 100:
            return 'extreme'
        elif leverage >= 50 or abs(change_percent) >= 50:
            return 'high'
        elif leverage >= 20 or abs(change_percent) >= 20:
            return 'medium'
        else:
            return 'low'

    @staticmethod
    def _generate_recommendation(risk_level: str, change_percent: float) -> str:
        """生成交易建议"""
        if risk_level == 'extreme':
            return "极高风险：建议立即降低杠杆倍数或减少仓位大小"
        elif risk_level == 'high':
            return "高风险：建议谨慎操作，设置止损"
        elif risk_level == 'medium':
            return "中等风险：建议设置合理的止损和止盈"
        else:
            if change_percent > 0:
                return "低风险：盈利状态，可考虑适当止盈"
            else:
                return "低风险：可考虑持有或加仓"