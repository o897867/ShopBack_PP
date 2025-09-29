#!/usr/bin/env python3
"""
CFD经纪商业务逻辑服务
"""

import json
import sqlite3
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, Request
from database import get_db_connection
from models.broker_models import CFDBroker, CFDBrokerNews, BrokerComparisonResponse

class BrokerService:
    """经纪商业务逻辑类"""

    @staticmethod
    def get_all_brokers(request: Request) -> List[CFDBroker]:
        """获取所有经纪商列表"""
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                SELECT id, name, regulators, regulator_details_json, rating, website, logo_url, rating_breakdown_json, created_at
                FROM cfd_brokers ORDER BY id DESC
            """)
            rows = cursor.fetchall()

            brokers = []
            for row in rows:
                broker_data = dict(zip([col[0] for col in cursor.description], row))
                broker_data = BrokerService._process_broker_data(broker_data, request)
                brokers.append(CFDBroker(**broker_data))

            return brokers

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"获取经纪商列表失败: {str(e)}")
        finally:
            conn.close()

    @staticmethod
    def get_broker_by_id(broker_id: int, request: Request) -> CFDBroker:
        """根据ID获取经纪商详情"""
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                SELECT id, name, regulators, regulator_details_json, rating, website, logo_url, rating_breakdown_json, created_at
                FROM cfd_brokers WHERE id = ?
            """, (broker_id,))
            row = cursor.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="经纪商不存在")

            broker_data = dict(zip([col[0] for col in cursor.description], row))
            broker_data = BrokerService._process_broker_data(broker_data, request)

            return CFDBroker(**broker_data)

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"获取经纪商详情失败: {str(e)}")
        finally:
            conn.close()

    @staticmethod
    def get_broker_news(broker_id: int) -> List[CFDBrokerNews]:
        """获取经纪商新闻"""
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            # 确保经纪商存在
            cursor.execute("SELECT 1 FROM cfd_brokers WHERE id = ?", (broker_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="经纪商不存在")

            cursor.execute("""
                SELECT id, broker_id, title, content, url, tag, created_at
                FROM cfd_broker_news WHERE broker_id = ?
                ORDER BY created_at DESC
            """, (broker_id,))
            rows = cursor.fetchall()

            news_list = []
            for row in rows:
                news_data = dict(zip([col[0] for col in cursor.description], row))
                news_list.append(CFDBrokerNews(**news_data))

            return news_list

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"获取经纪商新闻失败: {str(e)}")
        finally:
            conn.close()

    @staticmethod
    def compare_brokers(broker_ids: List[int], request: Request) -> BrokerComparisonResponse:
        """对比多个经纪商"""
        if len(broker_ids) < 2:
            raise HTTPException(status_code=400, detail="至少需要选择2个经纪商进行对比")
        if len(broker_ids) > 5:
            raise HTTPException(status_code=400, detail="最多只能对比5个经纪商")

        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            # 获取经纪商数据
            placeholders = ','.join(['?'] * len(broker_ids))
            cursor.execute(f"""
                SELECT id, name, regulators, regulator_details_json, rating, website, logo_url, rating_breakdown_json, created_at
                FROM cfd_brokers WHERE id IN ({placeholders})
            """, broker_ids)
            rows = cursor.fetchall()

            if len(rows) != len(broker_ids):
                raise HTTPException(status_code=404, detail="部分经纪商不存在")

            brokers = []
            for row in rows:
                broker_data = dict(zip([col[0] for col in cursor.description], row))
                broker_data = BrokerService._process_broker_data(broker_data, request)
                brokers.append(broker_data)

            # 生成对比数据
            comparison_fields = BrokerService._get_comparison_fields()
            comparison_data = BrokerService._generate_comparison_data(brokers)
            best_performers = BrokerService._find_best_performers(brokers)
            summary = BrokerService._generate_comparison_summary(brokers)

            return BrokerComparisonResponse(
                brokers=[CFDBroker(**broker) for broker in brokers],
                comparison_fields=comparison_fields,
                comparison_data=comparison_data,
                best_performers=best_performers,
                summary=summary
            )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"经纪商对比失败: {str(e)}")
        finally:
            conn.close()

    @staticmethod
    def get_comparison_fields() -> Dict[str, Any]:
        """获取对比字段配置"""
        return BrokerService._get_comparison_fields()

    @staticmethod
    def _process_broker_data(broker_data: Dict[str, Any], request: Request) -> Dict[str, Any]:
        """处理经纪商数据，解析JSON字段并处理Logo URL"""
        # 处理Logo URL
        if broker_data.get('logo_url') and not broker_data['logo_url'].startswith('http'):
            base_url = BrokerService._get_base_url(request)
            broker_data['logo_url'] = f"{base_url}{broker_data['logo_url']}"

        # 解析评分详情
        try:
            rating_breakdown = json.loads(broker_data.get('rating_breakdown_json') or 'null')
            broker_data['rating_breakdown'] = rating_breakdown
        except (json.JSONDecodeError, TypeError):
            broker_data['rating_breakdown'] = None

        # 移除JSON字段
        broker_data.pop('rating_breakdown_json', None)

        # 解析监管详情
        try:
            regulator_details = json.loads(broker_data.get('regulator_details_json') or 'null')
            broker_data['regulator_details'] = regulator_details
        except (json.JSONDecodeError, TypeError):
            broker_data['regulator_details'] = None

        # 移除JSON字段
        broker_data.pop('regulator_details_json', None)

        return broker_data

    @staticmethod
    def _get_base_url(request: Request) -> str:
        """获取基础URL"""
        proto = request.headers.get("x-forwarded-proto")
        if proto:
            proto = proto.split(",")[0].strip()
        else:
            proto = request.url.scheme

        host = request.headers.get("x-forwarded-host") or request.headers.get("host")
        if host:
            return f"{proto}://{host}"

        return str(request.base_url).rstrip('/')

    @staticmethod
    def _get_comparison_fields() -> Dict[str, List[Dict[str, str]]]:
        """获取对比字段配置"""
        return {
            'basic_info_fields': [
                {'key': 'name', 'label': 'Broker Name', 'type': 'text'},
                {'key': 'logo_url', 'label': 'Logo', 'type': 'image'},
                {'key': 'website', 'label': 'Website', 'type': 'url'},
                {'key': 'rating', 'label': 'Overall Rating', 'type': 'grade'}
            ],
            'regulatory_fields': [
                {'key': 'regulators', 'label': 'Regulatory Bodies', 'type': 'text'},
                {'key': 'regulatory_count', 'label': 'Number of Regulators', 'type': 'number'}
            ],
            'rating_breakdown_fields': [
                {'key': '监管强度', 'label': 'Regulatory Strength', 'type': 'score'},
                {'key': '透明度与合规', 'label': 'Transparency & Compliance', 'type': 'score'},
                {'key': '交易成本', 'label': 'Trading Costs', 'type': 'score'},
                {'key': '执行与流动性', 'label': 'Execution & Liquidity', 'type': 'score'},
                {'key': '平台与产品', 'label': 'Platform & Products', 'type': 'score'},
                {'key': '服务与教育', 'label': 'Service & Education', 'type': 'score'},
                {'key': '稳定性与口碑', 'label': 'Stability & Reputation', 'type': 'score'}
            ]
        }

    @staticmethod
    def _generate_comparison_data(brokers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """生成对比数据"""
        comparison_data = []

        for broker in brokers:
            # 处理监管详情
            regulator_details = broker.get('regulator_details', [])
            regulator_codes = []
            if regulator_details:
                regulator_codes = [detail.get('code', '') for detail in regulator_details if detail.get('code')]

            broker_comparison = {
                'broker_id': broker['id'],
                'basic_info': {
                    'name': broker.get('name', 'N/A'),
                    'logo_url': broker.get('logo_url'),
                    'website': broker.get('website', 'N/A'),
                    'rating': broker.get('rating', 'N/A')
                },
                'regulatory_info': {
                    'regulators': ', '.join(regulator_codes) if regulator_codes else broker.get('regulators', 'N/A'),
                    'regulator_details': regulator_details,
                    'regulatory_count': len(regulator_details) if regulator_details else len(regulator_codes)
                },
                'rating_breakdown': broker.get('rating_breakdown') or {}
            }
            comparison_data.append(broker_comparison)

        return comparison_data

    @staticmethod
    def _find_best_performers(brokers: List[Dict[str, Any]]) -> Dict[str, int]:
        """找出各项指标的最佳表现者"""
        best_performers = {}

        # 找出总体评分最高的经纪商
        best_rating_broker = None
        best_rating_value = None

        for broker in brokers:
            rating = broker.get('rating')
            if rating:
                rating_score = BrokerService._letter_to_score(rating)
                if rating_score and (best_rating_value is None or rating_score > best_rating_value):
                    best_rating_value = rating_score
                    best_rating_broker = broker['id']

        if best_rating_broker:
            best_performers['overall_rating'] = best_rating_broker

        # 找出各评分类别的最佳表现者
        breakdown_categories = ['监管强度', '透明度与合规', '交易成本', '执行与流动性', '平台与产品', '服务与教育', '稳定性与口碑']

        for category in breakdown_categories:
            best_score = None
            best_broker = None

            for broker in brokers:
                breakdown = broker.get('rating_breakdown')
                if breakdown and category in breakdown:
                    score_data = breakdown[category]
                    score = score_data.get('score') if isinstance(score_data, dict) else score_data

                    if isinstance(score, (int, float)) and (best_score is None or score > best_score):
                        best_score = score
                        best_broker = broker['id']

            if best_broker:
                best_performers[category] = best_broker

        return best_performers

    @staticmethod
    def _generate_comparison_summary(brokers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """生成对比摘要"""
        total_brokers = len(brokers)
        rated_brokers = len([b for b in brokers if b.get('rating')])

        # 统计唯一的监管机构
        all_regulators = set()
        for broker in brokers:
            regulator_details = broker.get('regulator_details', [])
            if regulator_details:
                for detail in regulator_details:
                    if detail.get('code'):
                        all_regulators.add(detail['code'])
            elif broker.get('regulators'):
                # 如果没有详细信息，从regulators字符串中提取
                regulators_str = broker['regulators'].replace(' ', '')
                for reg in regulators_str.split(','):
                    if reg.strip():
                        all_regulators.add(reg.strip())

        return {
            "total_brokers": total_brokers,
            "rated_brokers": rated_brokers,
            "unique_regulators": len(all_regulators),
            "regulator_list": list(all_regulators),
            "rating_distribution": BrokerService._get_rating_distribution(brokers)
        }

    @staticmethod
    def _get_rating_distribution(brokers: List[Dict[str, Any]]) -> Dict[str, int]:
        """获取评分分布"""
        distribution = {}
        for broker in brokers:
            rating = broker.get('rating')
            if rating:
                distribution[rating] = distribution.get(rating, 0) + 1
        return distribution

    @staticmethod
    def _letter_to_score(rating: str) -> Optional[float]:
        """将字母评级转换为数字分数"""
        rating_map = {
            'A++': 100, 'A+': 90, 'A': 85, 'A-': 80,
            'B+': 75, 'B': 70, 'B-': 65,
            'C+': 60, 'C': 55, 'C-': 50,
            'D+': 45, 'D': 40, 'D-': 35
        }
        return rating_map.get(rating)