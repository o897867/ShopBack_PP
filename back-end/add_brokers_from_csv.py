#!/usr/bin/env python3
"""
脚本用于从CSV文件中添加新的经纪商到数据库
"""

import csv
import sys
from collections import defaultdict
from cfd_admin import CFDAdmin

def parse_regulator(regulator_str):
    """解析监管机构字符串，返回简码和全名"""
    # 映射监管机构中文名称到英文简码
    regulator_mapping = {
        '英国 FCA': 'FCA',
        '塞舌尔 FSA': 'FSA',
        '澳洲 ASIC': 'ASIC',
        '瓦努阿图 VFSC': 'VFSC',
        '毛里求斯 FSC': 'FSC',
        '肯尼亚 CMA': 'CMA',
        '荷属库拉索 / 芬特马登央行 CBCS': 'CBCS',
        '塞浦路斯 CySEC': 'CYSEC',
        '新加坡 MAS': 'MAS',
        'Cayman 注册号': 'CIMA',
        '新西兰 FMA': 'FMA',
        '迪拜 DFSA': 'DFSA',
        '南非 FSCA': 'FSCA',
        '伯利兹 FSC': 'FSC_BELIZE',
        '伯利兹 IFSC/FSC': 'FSC_BELIZE',
        '开曼 CIMA': 'CIMA',
        '巴哈马 SCB': 'SCB',
        '圣文森特 SVG': 'SVG'
    }

    code = regulator_mapping.get(regulator_str.strip(), regulator_str.strip())
    return code, regulator_str.strip()

def process_csv_file(csv_path):
    """处理CSV文件，返回经纪商数据字典"""
    brokers_data = defaultdict(lambda: {
        'name': '',
        'regulators': set(),
        'regulator_details': []
    })

    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        next(reader)  # 跳过标题行

        for row in reader:
            if len(row) < 4:
                continue

            broker_name = row[0].strip()
            regulator_info = row[1].strip()
            license_number = row[2].strip()
            entity_note = row[3].strip()

            if not broker_name:
                continue

            # 处理经纪商名称中的括号内容
            if '(' in broker_name:
                broker_name = broker_name.split('(')[0].strip()

            regulator_code, regulator_full = parse_regulator(regulator_info)

            brokers_data[broker_name]['name'] = broker_name
            brokers_data[broker_name]['regulators'].add(regulator_code)

            # 构建监管详情
            regulator_detail = {
                'code': regulator_code,
                'regulator': regulator_full,
                'license': license_number if license_number else None,
                'note': entity_note if entity_note else None
            }

            brokers_data[broker_name]['regulator_details'].append(regulator_detail)

    # 转换为最终格式
    final_brokers = {}
    for broker_name, data in brokers_data.items():
        final_brokers[broker_name] = {
            'name': data['name'],
            'regulators': ', '.join(sorted(data['regulators'])),
            'regulator_details': data['regulator_details']
        }

    return final_brokers

def add_brokers_to_database(brokers_data):
    """将经纪商数据添加到数据库"""
    admin = CFDAdmin()

    # 获取现有经纪商
    existing_brokers = admin.list_brokers()
    existing_names = {broker.name.lower() for broker in existing_brokers}

    added_count = 0
    skipped_count = 0

    for broker_name, broker_data in brokers_data.items():
        # 检查是否已存在
        if broker_name.lower() in existing_names:
            print(f"跳过已存在的经纪商: {broker_name}")
            skipped_count += 1
            continue

        try:
            # 添加新经纪商
            new_broker = admin.create_broker(
                name=broker_data['name'],
                regulators=broker_data['regulators'],
                regulator_details=broker_data['regulator_details']
            )
            print(f"成功添加经纪商: {new_broker.name} (ID: {new_broker.id})")
            added_count += 1

        except Exception as e:
            print(f"添加经纪商 {broker_name} 时出错: {e}")

    print(f"\n总结:")
    print(f"  新添加: {added_count} 个经纪商")
    print(f"  跳过: {skipped_count} 个经纪商")

    return added_count, skipped_count

def main():
    csv_path = '/root/shopback/ShopBack_PP/Brokers_Regulation_WithNewAdds.csv'

    print("正在处理CSV文件...")
    brokers_data = process_csv_file(csv_path)

    print(f"从CSV文件中解析到 {len(brokers_data)} 个经纪商")

    print("\n经纪商列表:")
    for name in sorted(brokers_data.keys()):
        print(f"  - {name}")

    print(f"\n开始添加经纪商到数据库...")
    added, skipped = add_brokers_to_database(brokers_data)

    print(f"\n完成！添加了 {added} 个新经纪商。")

if __name__ == '__main__':
    main()