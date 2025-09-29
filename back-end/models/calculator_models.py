#!/usr/bin/env python3
"""
交易计算器相关的数据模型
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class LeverageCalculationRequest(BaseModel):
    """杠杆交易计算请求"""
    entry_price: float
    exit_price: float
    position_size: float
    leverage: float
    position_type: str  # 'long' or 'short'

class LeverageTargetLossRequest(BaseModel):
    """目标亏损价格计算请求"""
    entry_price: float
    position_size: float
    leverage: float
    target_loss_amount: float
    position_type: str  # 'long' or 'short'

class LeveragePositionRequest(BaseModel):
    """杠杆持仓创建请求"""
    user_email: str
    symbol: str
    position_type: str  # 'long' or 'short'
    entry_price: float
    position_size: float
    leverage: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None

class LeverageAnalysisResponse(BaseModel):
    """杠杆分析响应"""
    entry_price: float
    exit_price: float
    position_size: float
    leverage: float
    position_type: str

    # 计算结果
    price_change: float
    price_change_percent: float
    leveraged_change_percent: float
    profit_loss: float
    profit_loss_percent: float

    # 风险指标
    liquidation_price: Optional[float] = None
    margin_required: float
    max_loss: float

    # 分析建议
    risk_level: str  # 'low', 'medium', 'high', 'extreme'
    recommendation: str

class LeveragePosition(BaseModel):
    """杠杆持仓模型"""
    id: int
    user_email: str
    symbol: str
    position_type: str
    entry_price: float
    position_size: float
    leverage: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    current_pnl: float = 0.0
    is_open: bool = True
    created_at: str
    closed_at: Optional[str] = None
    exit_price: Optional[float] = None

class PositionCloseRequest(BaseModel):
    """持仓平仓请求"""
    exit_price: float
    close_reason: Optional[str] = "manual"  # 'manual', 'stop_loss', 'take_profit'

class TradeHistoryEntry(BaseModel):
    """交易历史记录"""
    id: int
    user_email: str
    symbol: str
    action: str  # 'open', 'close', 'partial_close'
    price: float
    quantity: float
    leverage: float
    pnl: float
    created_at: str

class PortfolioSummary(BaseModel):
    """投资组合摘要"""
    user_email: str
    total_positions: int
    open_positions: int
    closed_positions: int
    total_pnl: float
    total_pnl_percent: float
    win_rate: float
    avg_win: float
    avg_loss: float
    largest_win: float
    largest_loss: float
    active_margin: float

class RiskAnalysis(BaseModel):
    """风险分析"""
    position_size: float
    leverage: float
    symbol: str

    # 风险指标
    var_95: float  # 95% Value at Risk
    var_99: float  # 99% Value at Risk
    max_drawdown_potential: float

    # 建议
    recommended_position_size: float
    recommended_leverage: float
    risk_warnings: List[str]

class MarketDataPoint(BaseModel):
    """市场数据点"""
    symbol: str
    price: float
    timestamp: str
    volume: Optional[float] = None
    volatility: Optional[float] = None

class CalculatorSettings(BaseModel):
    """计算器设置"""
    default_leverage: float = 10.0
    max_leverage: float = 100.0
    default_position_size: float = 1000.0
    risk_free_rate: float = 0.02

    # 风险参数
    high_risk_threshold: float = 50.0  # 杠杆倍数
    extreme_risk_threshold: float = 100.0

    # 保证金要求
    margin_requirement: float = 0.01  # 1%
    maintenance_margin: float = 0.005  # 0.5%