from leverage_trading import LeveragePosition

# Test with your example: 4000 open price, 200 leverage
position = LeveragePosition(
    principal=1000,
    leverage=200,
    position_size=0.05,  # Small position size
    entry_price=4000,
    direction='long',
    symbol='TEST'
)

print('=== Corrected Margin Calculation ===')
print(f'Entry Price: ${position.entry_price}')
print(f'Position Size: {position.position_size}')
print(f'Leverage: {position.leverage}x')
print(f'Principal: ${position.principal}')
print()

print('Total Position Value:', position.total_position_value)
print('Required Margin:', position.required_margin)
print(f'Expected Margin (4000*0.05/200): {4000*0.05/200}')
print()

print('Liquidation Price:', position.liquidation_price)
print()

# Test P&L at different prices
test_prices = [3900, 3950, 4000, 4050, 4100]
for price in test_prices:
    pnl = position.calculate_pnl(price)
    print(f'Price ${price}: P&L=${pnl["pnl_amount"]:.2f}, Margin Level={pnl["margin_level_percentage"]:.1f}%, Liquidated={pnl["is_liquidated"]}')