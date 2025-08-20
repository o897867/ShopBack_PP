#!/usr/bin/env python3
"""
杠杆交易计算模块
提供杠杆交易的各种计算功能，包括强制平仓线、盈亏计算等
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import math

@dataclass
class LeveragePosition:
    """杠杆持仓数据类"""
    principal: float  # 本金
    leverage: float  # 杠杆倍数
    position_size: float  # 手数/仓位大小
    entry_price: float  # 入场价格
    direction: str  # 'long' 或 'short'
    symbol: str  # 交易对
    liquidation_threshold: float = 0.4  # 强制平仓线（保证金比例）
    
    @property
    def total_position_value(self) -> float:
        """计算总仓位价值"""
        return self.position_size * self.entry_price
    
    @property
    def required_margin(self) -> float:
        """计算所需保证金"""
        return self.total_position_value / self.leverage
    
    @property
    def liquidation_price(self) -> float:
        """计算强制平仓价格
        
        强平条件: Margin Level = Equity / Margin ≤ 40%
        即: Equity ≤ 0.4 * Margin
        
        对于多仓: Equity = Principal + (Current_Price - Entry_Price) * Position_Size
        对于空仓: Equity = Principal + (Entry_Price - Current_Price) * Position_Size
        """
        margin = self.required_margin
        min_equity = self.liquidation_threshold * margin
        
        if self.direction == 'long':
            # Principal + (Liquidation_Price - Entry_Price) * Position_Size = min_equity
            # Liquidation_Price = (min_equity - Principal) / Position_Size + Entry_Price
            return (min_equity - self.principal) / self.position_size + self.entry_price
        else:
            # Principal + (Entry_Price - Liquidation_Price) * Position_Size = min_equity
            # Liquidation_Price = Entry_Price - (min_equity - Principal) / Position_Size
            return self.entry_price - (min_equity - self.principal) / self.position_size
    
    def calculate_pnl(self, current_price: float) -> Dict[str, float]:
        """
        计算当前价格下的盈亏
        
        Args:
            current_price: 当前价格
            
        Returns:
            包含盈亏信息的字典
        """
        # 计算浮动盈亏
        if self.direction == 'long':
            pnl_amount = (current_price - self.entry_price) * self.position_size
        else:
            pnl_amount = (self.entry_price - current_price) * self.position_size
        
        pnl_percentage = (pnl_amount / self.principal) * 100
        
        # 计算权益
        current_equity = self.principal + pnl_amount
        
        # 计算保证金水平 (Margin Level)
        margin = self.required_margin
        margin_level = current_equity / margin if margin > 0 else 0
        
        return {
            'pnl_amount': pnl_amount,
            'pnl_percentage': pnl_percentage,
            'margin_level': margin_level,  # 这是真正的保证金水平
            'margin_level_percentage': margin_level * 100,  # 百分比形式
            'is_liquidated': margin_level <= self.liquidation_threshold,
            'current_equity': current_equity,
            'required_margin': margin,
            'margin_ratio': margin_level  # 保持兼容性
        }
    
    def price_for_target_loss(self, max_loss_amount: float) -> Optional[float]:
        """
        计算达到目标亏损金额时的价格
        
        Args:
            max_loss_amount: 最大可接受亏损金额（正数）
            
        Returns:
            触发目标亏损的价格
        """
        if max_loss_amount >= self.principal * (1 - self.liquidation_threshold):
            # 亏损超过强制平仓线
            return self.liquidation_price
        
        # 基于实际仓位计算目标亏损价格
        # 亏损 = Position_Size * |Entry_Price - Target_Price|
        if self.direction == 'long':
            # max_loss_amount = (entry_price - target_price) * position_size
            # target_price = entry_price - max_loss_amount / position_size
            return self.entry_price - max_loss_amount / self.position_size
        else:
            # max_loss_amount = (target_price - entry_price) * position_size
            # target_price = entry_price + max_loss_amount / position_size
            return self.entry_price + max_loss_amount / self.position_size
    
    def price_for_target_profit(self, target_profit_amount: float) -> float:
        """
        计算达到目标盈利金额时的价格
        
        Args:
            target_profit_amount: 目标盈利金额
            
        Returns:
            触发目标盈利的价格
        """
        # 基于实际仓位计算目标盈利价格
        if self.direction == 'long':
            # profit = (target_price - entry_price) * position_size
            # target_price = entry_price + profit / position_size
            return self.entry_price + target_profit_amount / self.position_size
        else:
            # profit = (entry_price - target_price) * position_size
            # target_price = entry_price - profit / position_size
            return self.entry_price - target_profit_amount / self.position_size
    
    def price_change_to_liquidation(self) -> Dict[str, float]:
        """
        计算到强制平仓的价格变动
        
        Returns:
            包含价格变动信息的字典
        """
        liquidation_price = self.liquidation_price
        
        if self.direction == 'long':
            price_change = self.entry_price - liquidation_price
            price_change_percentage = (price_change / self.entry_price) * 100
        else:
            price_change = liquidation_price - self.entry_price
            price_change_percentage = (price_change / self.entry_price) * 100
        
        return {
            'liquidation_price': liquidation_price,
            'price_change': abs(price_change),
            'price_change_percentage': abs(price_change_percentage),
            'direction_description': '下跌' if self.direction == 'long' else '上涨'
        }
    
    def get_risk_levels(self) -> Dict[str, Dict[str, float]]:
        """
        获取不同风险级别的价格和盈亏信息
        
        Returns:
            不同风险级别的详细信息
        """
        risk_levels = {}
        
        # 计算不同亏损比例对应的价格
        loss_percentages = [10, 20, 30, 50, 60]  # 本金亏损百分比
        
        for loss_pct in loss_percentages:
            loss_amount = self.principal * (loss_pct / 100)
            if loss_amount < self.principal * (1 - self.liquidation_threshold):
                target_price = self.price_for_target_loss(loss_amount)
                pnl_info = self.calculate_pnl(target_price)
                risk_levels[f'loss_{loss_pct}%'] = {
                    'price': target_price,
                    'loss_amount': loss_amount,
                    'margin_ratio': pnl_info['margin_ratio']
                }
        
        # 添加强制平仓信息
        risk_levels['liquidation'] = {
            'price': self.liquidation_price,
            'loss_amount': self.principal * (1 - self.liquidation_threshold),
            'margin_ratio': self.liquidation_threshold
        }
        
        return risk_levels


class LeverageCalculator:
    """杠杆交易计算器"""
    
    @staticmethod
    def calculate_position_size(principal: float, leverage: float, 
                               entry_price: float, lot_size: float = 1.0) -> float:
        """
        计算仓位大小（手数）
        
        Args:
            principal: 本金
            leverage: 杠杆倍数
            entry_price: 入场价格
            lot_size: 每手的单位数量
            
        Returns:
            可开仓手数
        """
        total_value = principal * leverage
        position_size = total_value / (entry_price * lot_size)
        return position_size
    
    @staticmethod
    def calculate_margin_requirement(position_size: float, entry_price: float, 
                                    leverage: float, lot_size: float = 1.0) -> float:
        """
        计算所需保证金
        
        Args:
            position_size: 仓位大小（手数）
            entry_price: 入场价格
            leverage: 杠杆倍数
            lot_size: 每手的单位数量
            
        Returns:
            所需保证金
        """
        total_value = position_size * entry_price * lot_size
        margin = total_value / leverage
        return margin
    
    @staticmethod
    def analyze_position(position: LeveragePosition, 
                        current_price: Optional[float] = None) -> Dict[str, Any]:
        """
        综合分析杠杆持仓
        
        Args:
            position: 杠杆持仓对象
            current_price: 当前价格（可选）
            
        Returns:
            包含完整分析结果的字典
        """
        analysis = {
            'position_info': {
                'symbol': position.symbol,
                'direction': position.direction,
                'principal': position.principal,
                'leverage': position.leverage,
                'position_size': position.position_size,
                'entry_price': position.entry_price,
                'total_position_value': position.total_position_value
            },
            'liquidation_info': position.price_change_to_liquidation(),
            'risk_levels': position.get_risk_levels()
        }
        
        if current_price:
            analysis['current_pnl'] = position.calculate_pnl(current_price)
            analysis['current_price'] = current_price
        
        return analysis
    
    @staticmethod
    def calculate_optimal_position_size(principal: float, max_loss_percentage: float,
                                       stop_loss_percentage: float, leverage: float) -> float:
        """
        根据风险管理原则计算最优仓位大小
        
        Args:
            principal: 本金
            max_loss_percentage: 最大可接受亏损百分比（相对于本金）
            stop_loss_percentage: 止损百分比（相对于入场价）
            leverage: 杠杆倍数
            
        Returns:
            建议的仓位比例（0-1之间）
        """
        # 凯利公式简化版本
        # 仓位比例 = 最大可接受亏损 / (止损百分比 * 杠杆)
        position_ratio = max_loss_percentage / (stop_loss_percentage * leverage)
        
        # 限制在0-1之间
        return min(max(position_ratio, 0), 1)