#!/usr/bin/env python3
"""
Generate broker rebate data Excel template
"""
import sqlite3
import pandas as pd
from datetime import datetime

# Connect to database
db_path = '/root/shopback/ShopBack_PP/back-end/shopback_data.db'
conn = sqlite3.connect(db_path)

# Get all brokers
brokers_df = pd.read_sql_query("SELECT id, name FROM cfd_brokers ORDER BY name", conn)
conn.close()

# Create rebate data structure
rebate_data = []

for _, broker in brokers_df.iterrows():
    # Add three account types per broker
    for account_type in ['Standard', 'ECN', 'VIP']:
        rebate_data.append({
            'Broker ID': broker['id'],
            'Broker Name': broker['name'],
            'Account Type': account_type,
            'Rebate Per Lot (USD)': '',  # To be filled
            'Min Deposit (USD)': '',     # To be filled
            'Trading Instruments': '',    # e.g., Forex, CFD, Metals, etc.
            'Max Rebate Period (Days)': '', # How long rebate is valid
            'Payment Frequency': '',      # Daily/Weekly/Monthly
            'Special Conditions': '',     # Any special requirements
            'Notes': ''
        })

# Create DataFrame
df = pd.DataFrame(rebate_data)

# Add a summary sheet with instructions
instructions = pd.DataFrame({
    'Field': [
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
    ],
    'Description': [
        'Auto-filled from database (Do not modify)',
        'Auto-filled from database (Do not modify)',
        'Standard/ECN/VIP account type',
        'Rebate amount in USD per standard lot (e.g., 5.00, 8.50, 12.00)',
        'Minimum deposit required for this account type',
        'Comma-separated list (e.g., Forex,CFD,Metals,Indices)',
        'How many days the rebate is valid for',
        'How often rebate is paid: Daily/Weekly/Monthly',
        'Any special requirements or conditions',
        'Additional notes or comments'
    ],
    'Example': [
        '1',
        'TMGM',
        'Standard',
        '6.50',
        '100',
        'Forex,CFD,Metals',
        '30',
        'Monthly',
        'Min 10 lots per month',
        'Promotion valid until Dec 2025'
    ]
})

# Create Excel file with multiple sheets
output_file = '/root/shopback/ShopBack_PP/broker_rebate_template.xlsx'

with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
    # Instructions sheet
    instructions.to_excel(writer, sheet_name='Instructions', index=False)

    # Main data sheet
    df.to_excel(writer, sheet_name='Rebate Data', index=False)

    # Get workbook to format
    workbook = writer.book

    # Format Instructions sheet
    ws_instructions = workbook['Instructions']
    ws_instructions.column_dimensions['A'].width = 25
    ws_instructions.column_dimensions['B'].width = 60
    ws_instructions.column_dimensions['C'].width = 35

    # Format Rebate Data sheet
    ws_data = workbook['Rebate Data']
    ws_data.column_dimensions['A'].width = 12
    ws_data.column_dimensions['B'].width = 20
    ws_data.column_dimensions['C'].width = 15
    ws_data.column_dimensions['D'].width = 20
    ws_data.column_dimensions['E'].width = 20
    ws_data.column_dimensions['F'].width = 25
    ws_data.column_dimensions['G'].width = 25
    ws_data.column_dimensions['H'].width = 20
    ws_data.column_dimensions['I'].width = 30
    ws_data.column_dimensions['J'].width = 35

print(f"✅ Excel template generated: {output_file}")
print(f"📊 Total rows: {len(df)} ({len(brokers_df)} brokers × 3 account types)")
print(f"📋 Brokers included: {', '.join(brokers_df['name'].tolist()[:5])}... and {len(brokers_df)-5} more")
