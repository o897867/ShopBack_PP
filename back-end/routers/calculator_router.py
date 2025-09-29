#!/usr/bin/env python3
"""
交易计算器相关API路由
"""

from fastapi import APIRouter, HTTPException
from typing import List
from models.calculator_models import (
    LeverageCalculationRequest,
    LeverageTargetLossRequest,
    LeveragePositionRequest,
    LeverageAnalysisResponse,
    LeveragePosition,
    PositionCloseRequest,
    TradeHistoryEntry
)
from services.calculator_service import CalculatorService

# 创建路由器
router = APIRouter()

@router.post("/calculate", response_model=LeverageAnalysisResponse, summary="杠杆交易计算")
async def calculate_leverage_analysis(request: LeverageCalculationRequest):
    """
    计算杠杆交易的盈亏分析

    参数:
    - entry_price: 入场价格
    - exit_price: 出场价格
    - position_size: 仓位大小
    - leverage: 杠杆倍数
    - position_type: 仓位类型 ('long' 或 'short')

    返回详细的盈亏分析，包括：
    - 价格变化和百分比
    - 杠杆后的盈亏
    - 强制平仓价格
    - 风险评估和建议
    """
    return CalculatorService.calculate_leverage_analysis(
        request.entry_price,
        request.exit_price,
        request.position_size,
        request.leverage,
        request.position_type
    )

@router.post("/target-loss", summary="计算目标亏损价格")
async def calculate_target_loss_price(request: LeverageTargetLossRequest):
    """
    计算达到目标亏损金额时的价格

    参数:
    - entry_price: 入场价格
    - position_size: 仓位大小
    - leverage: 杠杆倍数
    - target_loss_amount: 目标亏损金额
    - position_type: 仓位类型 ('long' 或 'short')

    返回达到目标亏损时的价格和相关分析
    """
    return CalculatorService.calculate_target_loss_price(
        request.entry_price,
        request.position_size,
        request.leverage,
        request.target_loss_amount,
        request.position_type
    )

@router.post("/position", response_model=LeveragePosition, summary="创建杠杆持仓")
async def create_leverage_position(request: LeveragePositionRequest):
    """
    创建新的杠杆交易持仓

    参数:
    - user_email: 用户邮箱
    - symbol: 交易品种
    - position_type: 仓位类型 ('long' 或 'short')
    - entry_price: 入场价格
    - position_size: 仓位大小
    - leverage: 杠杆倍数
    - stop_loss: 止损价格 (可选)
    - take_profit: 止盈价格 (可选)

    返回创建的持仓信息
    """
    return CalculatorService.create_position(
        request.user_email,
        request.symbol,
        request.position_type,
        request.entry_price,
        request.position_size,
        request.leverage,
        request.stop_loss,
        request.take_profit
    )

@router.get("/positions/{user_email}", response_model=List[LeveragePosition], summary="获取用户持仓")
async def get_user_positions(user_email: str, include_closed: bool = False):
    """
    获取用户的杠杆交易持仓

    参数:
    - user_email: 用户邮箱
    - include_closed: 是否包含已平仓的持仓

    返回用户的持仓列表
    """
    return CalculatorService.get_user_positions(user_email, include_closed)

@router.put("/position/{position_id}/close", response_model=LeveragePosition, summary="平仓")
async def close_position(position_id: int, request: PositionCloseRequest):
    """
    平仓操作

    参数:
    - position_id: 持仓ID
    - exit_price: 平仓价格
    - close_reason: 平仓原因 (可选)

    返回平仓后的持仓信息
    """
    return CalculatorService.close_position(
        position_id,
        request.exit_price,
        request.close_reason
    )

@router.get("/history/{user_email}", response_model=List[TradeHistoryEntry], summary="获取交易历史")
async def get_trade_history(user_email: str):
    """
    获取用户的交易历史记录

    参数:
    - user_email: 用户邮箱

    返回用户的完整交易历史
    """
    return CalculatorService.get_trade_history(user_email)

@router.get("/portfolio/{user_email}", summary="获取投资组合摘要")
async def get_portfolio_summary(user_email: str):
    """
    获取用户的投资组合摘要统计

    参数:
    - user_email: 用户邮箱

    返回投资组合的统计信息，包括：
    - 总持仓数量
    - 盈亏统计
    - 胜率分析
    - 风险指标
    """
    try:
        positions = CalculatorService.get_user_positions(user_email, include_closed=True)
        history = CalculatorService.get_trade_history(user_email)

        # 计算统计数据
        total_positions = len(positions)
        open_positions = len([p for p in positions if p.is_open])
        closed_positions = total_positions - open_positions

        # 计算总盈亏
        total_pnl = sum(p.current_pnl for p in positions if not p.is_open)

        # 计算胜率和平均盈亏
        closed_trades = [p for p in positions if not p.is_open and p.current_pnl != 0]
        if closed_trades:
            winning_trades = [p for p in closed_trades if p.current_pnl > 0]
            losing_trades = [p for p in closed_trades if p.current_pnl < 0]

            win_rate = len(winning_trades) / len(closed_trades) * 100
            avg_win = sum(p.current_pnl for p in winning_trades) / len(winning_trades) if winning_trades else 0
            avg_loss = sum(p.current_pnl for p in losing_trades) / len(losing_trades) if losing_trades else 0
            largest_win = max([p.current_pnl for p in winning_trades], default=0)
            largest_loss = min([p.current_pnl for p in losing_trades], default=0)
        else:
            win_rate = 0
            avg_win = 0
            avg_loss = 0
            largest_win = 0
            largest_loss = 0

        # 计算活跃保证金
        active_margin = sum(p.position_size / p.leverage for p in positions if p.is_open)

        return {
            "user_email": user_email,
            "total_positions": total_positions,
            "open_positions": open_positions,
            "closed_positions": closed_positions,
            "total_pnl": total_pnl,
            "win_rate": win_rate,
            "avg_win": avg_win,
            "avg_loss": avg_loss,
            "largest_win": largest_win,
            "largest_loss": largest_loss,
            "active_margin": active_margin
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取投资组合摘要失败: {str(e)}")

@router.get("/risk-analysis", summary="风险分析工具")
async def risk_analysis(position_size: float, leverage: float, symbol: str = "BTCUSD"):
    """
    风险分析工具

    参数:
    - position_size: 仓位大小
    - leverage: 杠杆倍数
    - symbol: 交易品种

    返回风险分析报告和建议
    """
    if position_size <= 0 or leverage <= 0:
        raise HTTPException(status_code=400, detail="仓位大小和杠杆倍数必须大于0")

    # 简化的风险分析
    margin_required = position_size / leverage

    # 基于杠杆倍数的风险评估
    risk_warnings = []

    if leverage >= 100:
        risk_warnings.append("极高杠杆风险：价格微小变动可能导致重大损失")
    elif leverage >= 50:
        risk_warnings.append("高杠杆风险：建议设置严格的止损")
    elif leverage >= 20:
        risk_warnings.append("中等杠杆风险：注意资金管理")

    if margin_required > 10000:
        risk_warnings.append("大额保证金：建议分批建仓")

    # 推荐参数
    recommended_leverage = min(leverage, 20)  # 推荐最大20倍杠杆
    recommended_position_size = position_size if leverage <= 20 else position_size * 20 / leverage

    # VaR计算 (简化版本，假设日波动率为5%)
    daily_volatility = 0.05
    var_95 = margin_required * daily_volatility * 1.65  # 95% VaR
    var_99 = margin_required * daily_volatility * 2.33  # 99% VaR

    max_drawdown_potential = margin_required  # 最大可能亏损为全部保证金

    return {
        "position_size": position_size,
        "leverage": leverage,
        "symbol": symbol,
        "var_95": var_95,
        "var_99": var_99,
        "max_drawdown_potential": max_drawdown_potential,
        "recommended_position_size": recommended_position_size,
        "recommended_leverage": recommended_leverage,
        "risk_warnings": risk_warnings,
        "margin_required": margin_required
    }

@router.get("/health", summary="计算器服务健康检查")
async def calculator_service_health():
    """
    计算器服务健康检查

    返回计算器服务的状态信息
    """
    try:
        from database import check_database_health
        health_status = check_database_health()

        return {
            "service": "calculator_service",
            "status": "healthy",
            "database": health_status,
            "endpoints": [
                "/calculate",
                "/target-loss",
                "/position",
                "/positions/{user_email}",
                "/position/{id}/close",
                "/history/{user_email}",
                "/portfolio/{user_email}",
                "/risk-analysis"
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"计算器服务不可用: {str(e)}"
        )