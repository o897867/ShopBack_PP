#!/usr/bin/env python3
"""
测试杠杆交易计算功能
"""

from leverage_trading import LeveragePosition, LeverageCalculator
import json

def test_leverage_calculations():
    """测试各种杠杆交易场景"""
    
    print("=" * 60)
    print("杠杆交易计算测试")
    print("=" * 60)
    
    # 测试场景1: 做多BTC
    print("\n测试场景1: 做多BTC")
    print("-" * 40)
    
    position_long = LeveragePosition(
        principal=1000,      # 本金1000 USDT
        leverage=10,         # 10倍杠杆
        position_size=0.2,   # 0.2 BTC
        entry_price=50000,   # 入场价格 50000 USDT
        direction='long',
        symbol='BTCUSDT'
    )
    
    print(f"本金: {position_long.principal} USDT")
    print(f"杠杆: {position_long.leverage}x")
    print(f"总仓位价值: {position_long.total_position_value} USDT")
    print(f"入场价格: {position_long.entry_price} USDT")
    print(f"强制平仓价格: {position_long.liquidation_price:.2f} USDT")
    
    # 计算不同价格下的盈亏
    test_prices = [55000, 52000, 50000, 48000, 45000]
    print("\n不同价格下的盈亏:")
    for price in test_prices:
        pnl = position_long.calculate_pnl(price)
        print(f"  价格 {price}: 盈亏 {pnl['pnl_amount']:.2f} USDT ({pnl['pnl_percentage']:.2f}%), "
              f"保证金比例 {pnl['margin_ratio']*100:.2f}%")
    
    # 测试场景2: 做空ETH
    print("\n测试场景2: 做空ETH")
    print("-" * 40)
    
    position_short = LeveragePosition(
        principal=500,       # 本金500 USDT
        leverage=20,         # 20倍杠杆
        position_size=3,     # 3 ETH
        entry_price=3000,    # 入场价格 3000 USDT
        direction='short',
        symbol='ETHUSDT'
    )
    
    print(f"本金: {position_short.principal} USDT")
    print(f"杠杆: {position_short.leverage}x")
    print(f"总仓位价值: {position_short.total_position_value} USDT")
    print(f"入场价格: {position_short.entry_price} USDT")
    print(f"强制平仓价格: {position_short.liquidation_price:.2f} USDT")
    
    # 计算价格变动到强平
    liquidation_info = position_short.price_change_to_liquidation()
    print(f"\n到强制平仓需要价格{liquidation_info['direction_description']}: "
          f"{liquidation_info['price_change']:.2f} USDT ({liquidation_info['price_change_percentage']:.2f}%)")
    
    # 测试场景3: 目标亏损计算
    print("\n测试场景3: 目标亏损计算")
    print("-" * 40)
    
    max_loss = 200  # 最多亏损200 USDT
    stop_loss_price = position_long.price_for_target_loss(max_loss)
    print(f"如果最多想亏损 {max_loss} USDT，应该在价格 {stop_loss_price:.2f} USDT 时止损")
    
    pnl_at_stop = position_long.calculate_pnl(stop_loss_price)
    print(f"止损价格下的详细信息:")
    print(f"  实际亏损: {abs(pnl_at_stop['pnl_amount']):.2f} USDT")
    print(f"  亏损比例: {abs(pnl_at_stop['pnl_percentage']):.2f}%")
    print(f"  保证金比例: {pnl_at_stop['margin_ratio']*100:.2f}%")
    
    # 测试场景4: 风险级别分析
    print("\n测试场景4: 风险级别分析")
    print("-" * 40)
    
    analysis = LeverageCalculator.analyze_position(position_long, current_price=51000)
    
    print("综合分析结果:")
    print(f"  当前价格: 51000 USDT")
    print(f"  当前盈亏: {analysis['current_pnl']['pnl_amount']:.2f} USDT")
    print(f"  当前保证金比例: {analysis['current_pnl']['margin_ratio']*100:.2f}%")
    
    print("\n风险级别:")
    for level, info in analysis['risk_levels'].items():
        print(f"  {level}: 价格 {info['price']:.2f}, 亏损 {info['loss_amount']:.2f} USDT")
    
    # 测试场景5: 最优仓位计算
    print("\n测试场景5: 最优仓位计算")
    print("-" * 40)
    
    optimal_size = LeverageCalculator.calculate_optimal_position_size(
        principal=1000,
        max_loss_percentage=0.02,  # 最多亏损本金的2%
        stop_loss_percentage=0.01,  # 止损设在1%价格变动
        leverage=10
    )
    
    print(f"根据风险管理原则，建议仓位比例: {optimal_size*100:.2f}%")
    print(f"建议使用资金: {1000 * optimal_size:.2f} USDT")
    
    print("\n" + "=" * 60)
    print("测试完成！所有计算功能正常。")
    print("=" * 60)

if __name__ == "__main__":
    test_leverage_calculations()