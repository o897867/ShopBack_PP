#!/usr/bin/env python3
"""
Generate broker rebate data CSV template
"""
import sqlite3
import csv

# Connect to database
db_path = '/root/shopback/ShopBack_PP/back-end/shopback_data.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all brokers
cursor.execute("SELECT id, name FROM cfd_brokers ORDER BY name")
brokers = cursor.fetchall()
conn.close()

# Create rebate data CSV
output_file = '/root/shopback/ShopBack_PP/broker_rebate_template.csv'

headers = [
    'Broker ID',
    'Broker Name',
    'Account Type',
    'Rebate Per Lot (USD)',
    'Min Deposit (USD)',
    'Trading Instruments',
    'Max Rebate Period (Days)',
    'Payment Frequency',
    'Special Conditions',
    'Notes'
]

with open(output_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)

    # Write headers
    writer.writerow(headers)

    # Write data rows
    for broker_id, broker_name in brokers:
        for account_type in ['Standard', 'ECN', 'VIP']:
            writer.writerow([
                broker_id,
                broker_name,
                account_type,
                '',  # Rebate Per Lot
                '',  # Min Deposit
                '',  # Trading Instruments
                '',  # Max Rebate Period
                '',  # Payment Frequency
                '',  # Special Conditions
                ''   # Notes
            ])

# Create instructions file
instructions_file = '/root/shopback/ShopBack_PP/rebate_instructions.txt'

with open(instructions_file, 'w', encoding='utf-8') as f:
    f.write("""
==========================================
Broker Rebate Data Template - Instructions
==========================================

FIELD DESCRIPTIONS:
-------------------

1. Broker ID
   - Auto-filled from database
   - Do NOT modify this field

2. Broker Name
   - Auto-filled from database
   - Do NOT modify this field

3. Account Type
   - Pre-filled: Standard / ECN / VIP
   - Each broker has 3 rows for 3 account types

4. Rebate Per Lot (USD)
   - Amount in USD per standard lot
   - Example: 5.00, 8.50, 12.00
   - Use decimal format (e.g., 6.50, not 6.5 or $6.50)

5. Min Deposit (USD)
   - Minimum deposit required for this account type
   - Example: 100, 500, 10000
   - Whole numbers only

6. Trading Instruments
   - Comma-separated list
   - Example: Forex,CFD,Metals,Indices,Crypto
   - Common values: Forex, CFD, Metals, Indices, Crypto, Commodities

7. Max Rebate Period (Days)
   - How many days the rebate is valid for
   - Example: 30, 60, 90, 365
   - Use 0 for unlimited/ongoing rebates

8. Payment Frequency
   - How often rebate is paid
   - Values: Daily, Weekly, Monthly, Quarterly

9. Special Conditions
   - Any special requirements or conditions
   - Example: "Min 10 lots per month", "New clients only"
   - Leave blank if no special conditions

10. Notes
    - Additional notes or comments
    - Example: "Promotion valid until Dec 2025"
    - Leave blank if no notes

EXAMPLE ROW:
-----------
1,TMGM,Standard,6.50,100,Forex;CFD;Metals,30,Monthly,Min 10 lots per month,Promotion until Dec 2025

TIPS:
-----
- Fill in all empty fields with accurate data
- Use consistent formatting (e.g., always use "Forex" not "forex" or "FX")
- For rebates that don't apply to an account type, you can delete that row
- Save as CSV when done
""")

print(f"✅ CSV template generated: {output_file}")
print(f"📋 Instructions file: {instructions_file}")
print(f"📊 Total rows: {len(brokers) * 3} ({len(brokers)} brokers × 3 account types)")
print(f"\n🏦 Brokers included ({len(brokers)} total):")
for i, (broker_id, broker_name) in enumerate(brokers[:10], 1):
    print(f"  {i}. {broker_name}")
if len(brokers) > 10:
    print(f"  ... and {len(brokers) - 10} more")
