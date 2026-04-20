#!/usr/bin/env python3
"""Test XAU validity API with optimized parameters"""

import requests
import json
import time

# Wait for service to start
time.sleep(5)

# Test the XAU validity endpoint
response = requests.get('http://localhost:8000/api/xau/validity', params={
    'limit': 1000,
    'interval': '1m',
    'minutes': 10080  # 7 days
})

if response.status_code == 200:
    data = response.json()
    print('✅ API call successful!')
    print(f"Symbol: {data.get('symbol')}")
    print(f"Interval: {data.get('interval')}")

    # Check validity summary
    validity = data.get('validity_summary', {})
    indicators = validity.get('indicators', {})

    print('\n📊 Indicator Validity Results (with optimized XAU parameters):')
    for indicator, results in indicators.items():
        count = results.get('valid_count', 0)
        print(f'  {indicator}: {count} valid signals')

    # Show parameters used
    params = data.get('parameters_used', {})
    print(f'\n⚙️ Parameters used:')
    print(f'  ATR Multiplier: {params.get("atr_multiplier")}')
    print(f'  RSI Threshold: {params.get("rsi_thr")}')
    print(f'  RSI Overbought: {params.get("rsi_overbought")}')
    print(f'  RSI Oversold: {params.get("rsi_oversold")}')
    print(f'  MA Tolerance: {params.get("ma_tol")}')
    print(f'  MA Threshold: {params.get("ma_thr")}')

    # Show some recent events if available
    print(f'\n📈 Recent Valid Signals:')
    for indicator, results in indicators.items():
        events = results.get('events', [])
        if events:
            latest = events[-1] if events else None
            if latest:
                print(f'  {indicator}: {latest.get("type")} at price ${latest.get("price", 0):.2f}')
else:
    print(f'❌ API call failed with status {response.status_code}')
    print(response.text[:500])