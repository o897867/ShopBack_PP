#!/usr/bin/env python3
"""
CFD经纪商业务逻辑服务
"""

import json
import sqlite3
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, Request
from database import get_db_connection
from models.broker_models import (
    CFDBroker, CFDBrokerNews, BrokerComparisonResponse,
    QuadrantAnalysisRequest, QuadrantAnalysisResponse, BrokerDataPoint,
    AxisInfo, QuadrantStatistics
)

class BrokerService:
    """经纪商业务逻辑类"""

    # 英文到中文维度映射
    DIMENSION_EN_TO_CN = {
        'Regulatory Strength': '监管强度',
        'Transparency & Compliance': '透明度与合规',
        'Trading Cost': '交易成本',
        'Execution & Liquidity': '执行与流动性',
        'Platform & Products': '平台与产品',
        'Service & Education': '服务与教育',
        'Stability & Reputation': '稳定性与口碑',
        'Composite Score': '综合影响力'
    }

    # 中文到英文维度映射（用于返回）
    DIMENSION_CN_TO_EN = {v: k for k, v in DIMENSION_EN_TO_CN.items()}

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

    # ============= 象限分析相关方法 =============

    @staticmethod
    def get_quadrant_analysis_data(request: QuadrantAnalysisRequest, http_request: Request) -> QuadrantAnalysisResponse:
        """获取象限分析数据"""
        # 将英文维度名转换为中文（如果需要）
        x_axis = BrokerService.DIMENSION_EN_TO_CN.get(request.x_axis, request.x_axis)
        y_axis = BrokerService.DIMENSION_EN_TO_CN.get(request.y_axis, request.y_axis)
        bubble_metric = BrokerService.DIMENSION_EN_TO_CN.get(request.bubble_metric, request.bubble_metric)

        # 创建内部使用的请求对象（中文维度）
        internal_request = QuadrantAnalysisRequest(
            x_axis=x_axis,
            y_axis=y_axis,
            bubble_metric=bubble_metric,
            regulators=request.regulators,
            rating_min=request.rating_min,
            rating_max=request.rating_max,
            limit=request.limit
        )

        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            # 获取所有经纪商数据
            cursor.execute("""
                SELECT id, name, regulators, regulator_details_json, rating, website, logo_url, rating_breakdown_json, created_at
                FROM cfd_brokers ORDER BY id
            """)
            rows = cursor.fetchall()

            if not rows:
                raise HTTPException(status_code=404, detail="暂无经纪商数据")

            # 处理数据
            brokers_data = []
            for row in rows:
                broker_data = dict(zip([col[0] for col in cursor.description], row))
                broker_data = BrokerService._process_broker_data(broker_data, http_request)
                brokers_data.append(broker_data)

            # 应用筛选
            filtered_brokers = BrokerService._apply_quadrant_filters(brokers_data, internal_request)

            # 标准化数据并计算坐标
            data_points, axis_info, statistics = BrokerService._calculate_quadrant_coordinates(
                filtered_brokers, internal_request
            )

            # 获取可用维度
            available_dimensions = BrokerService._get_available_dimensions()

            return QuadrantAnalysisResponse(
                data_points=data_points,
                x_axis_info=axis_info['x'],
                y_axis_info=axis_info['y'],
                bubble_info=axis_info['bubble'],
                statistics=statistics,
                available_dimensions=available_dimensions
            )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"象限分析失败: {str(e)}")
        finally:
            conn.close()

    @staticmethod
    def _apply_quadrant_filters(brokers: List[Dict[str, Any]], request: QuadrantAnalysisRequest) -> List[Dict[str, Any]]:
        """应用筛选条件"""
        filtered = brokers

        # 监管机构筛选
        if request.regulators:
            filtered = [
                broker for broker in filtered
                if any(reg in (broker.get('regulators', '') or '') for reg in request.regulators)
            ]

        # 评级筛选
        if request.rating_min or request.rating_max:
            def get_rating_score(rating):
                return BrokerService._letter_to_score(rating) or 0

            min_score = get_rating_score(request.rating_min) if request.rating_min else 0
            max_score = get_rating_score(request.rating_max) if request.rating_max else 100

            filtered = [
                broker for broker in filtered
                if min_score <= get_rating_score(broker.get('rating')) <= max_score
            ]

        # 限制数量
        if request.limit:
            filtered = filtered[:request.limit]

        return filtered

    @staticmethod
    def _calculate_quadrant_coordinates(brokers: List[Dict[str, Any]], request: QuadrantAnalysisRequest) -> tuple:
        """计算象限坐标和统计信息"""
        # 提取各维度原始分数
        dimension_scores = BrokerService._extract_dimension_scores(brokers)

        # 标准化分数
        normalized_scores = BrokerService._normalize_scores(dimension_scores)

        # 生成数据点
        data_points = []
        for i, broker in enumerate(brokers):
            # 计算监管机构数量
            regulator_count = 0
            if broker.get('regulator_details'):
                regulator_count = len(broker['regulator_details'])
            elif broker.get('regulators'):
                regulator_count = len(broker['regulators'].split(','))

            # 获取标准化分数
            x_score = normalized_scores[request.x_axis][i] if request.x_axis in normalized_scores else 50
            y_score = normalized_scores[request.y_axis][i] if request.y_axis in normalized_scores else 50

            # 计算气泡大小（综合影响力）
            bubble_size = BrokerService._calculate_bubble_size(broker, normalized_scores, i)

            # 构建元数据
            metadata = {
                'regulator_details': broker.get('regulator_details', []),
                'website': broker.get('website'),
                'created_at': broker.get('created_at'),
                'rating_breakdown': broker.get('rating_breakdown', {}),
                'raw_scores': {dim: scores[i] for dim, scores in dimension_scores.items()}
            }

            data_point = BrokerDataPoint(
                id=broker['id'],
                name=broker['name'],
                x_score=round(x_score, 1),
                y_score=round(y_score, 1),
                bubble_size=round(bubble_size, 1),
                overall_rating=broker.get('rating'),
                logo_url=broker.get('logo_url'),
                regulator_count=regulator_count,
                metadata=metadata
            )
            data_points.append(data_point)

        # 计算坐标轴信息
        axis_info = BrokerService._calculate_axis_info(normalized_scores, dimension_scores, request)

        # 计算统计信息
        statistics = BrokerService._calculate_quadrant_statistics(data_points, normalized_scores)

        return data_points, axis_info, statistics

    @staticmethod
    def _extract_dimension_scores(brokers: List[Dict[str, Any]]) -> Dict[str, List[float]]:
        """提取各维度的原始分数"""
        dimensions = ['监管强度', '透明度与合规', '交易成本', '执行与流动性', '平台与产品', '服务与教育', '稳定性与口碑']
        scores = {dim: [] for dim in dimensions}

        for broker in brokers:
            breakdown = broker.get('rating_breakdown', {})
            for dim in dimensions:
                if dim in breakdown:
                    score_data = breakdown[dim]
                    if isinstance(score_data, dict):
                        score = score_data.get('score', 0)
                    else:
                        score = score_data
                    scores[dim].append(float(score) if score else 0)
                else:
                    scores[dim].append(0)

        return scores

    @staticmethod
    def _normalize_scores(dimension_scores: Dict[str, List[float]]) -> Dict[str, List[float]]:
        """标准化分数到0-100区间，使用更精细的分布"""
        normalized = {}

        for dimension, scores in dimension_scores.items():
            if not scores:
                normalized[dimension] = [50] * len(scores)
                continue

            # 过滤掉0分（可能是缺失数据）
            non_zero_scores = [s for s in scores if s > 0]

            if not non_zero_scores:
                # 如果全是0，使用递增序列避免重叠
                normalized[dimension] = [i * (100 / max(1, len(scores) - 1)) for i in range(len(scores))]
                continue

            min_score = min(non_zero_scores)
            max_score = max(non_zero_scores)

            # 使用更细致的标准化，保持原始分数的差异
            if min_score == max_score:
                # 相同分数的加入微小偏移避免重叠
                base_value = 50
                normalized[dimension] = [
                    base_value + (i - len(scores)//2) * 2  # 每个点间隔2分
                    for i in range(len(scores))
                ]
            else:
                normalized_list = []
                for i, score in enumerate(scores):
                    if score == 0:
                        # 0分映射到0-15区间，加入微小差异避免重叠
                        norm_score = 5 + (i % 10) * 1  # 0分的点分散在5-14之间
                    else:
                        # 非0分使用20-100区间标准化
                        norm_score = 20 + ((score - min_score) / (max_score - min_score)) * 80
                        # 加入微小的随机偏移避免完全重叠
                        norm_score += (i % 5 - 2) * 0.5  # -1到1的微调
                    normalized_list.append(norm_score)
                normalized[dimension] = normalized_list

        return normalized

    @staticmethod
    def _calculate_bubble_size(broker: Dict[str, Any], normalized_scores: Dict[str, List[float]], index: int) -> float:
        """计算气泡大小（综合影响力）"""
        # 综合多个因子：监管强度、稳定性与口碑、监管机构数量
        factors = []

        # 监管强度权重40%
        if '监管强度' in normalized_scores:
            factors.append(normalized_scores['监管强度'][index] * 0.4)

        # 稳定性与口碑权重30%
        if '稳定性与口碑' in normalized_scores:
            factors.append(normalized_scores['稳定性与口碑'][index] * 0.3)

        # 监管机构数量权重30%（标准化）
        regulator_count = 0
        if broker.get('regulator_details'):
            regulator_count = len(broker['regulator_details'])
        elif broker.get('regulators'):
            regulator_count = len(broker['regulators'].split(','))

        # 假设最多10个监管机构，标准化到0-100
        regulator_score = min(regulator_count * 20, 100)  # 每个监管机构20分
        factors.append(regulator_score * 0.3)

        return sum(factors) if factors else 50

    @staticmethod
    def _calculate_axis_info(normalized_scores: Dict[str, List[float]], raw_scores: Dict[str, List[float]], request: QuadrantAnalysisRequest) -> Dict[str, AxisInfo]:
        """计算坐标轴信息"""
        axis_info = {}

        # X轴信息
        x_dim = request.x_axis
        if x_dim in raw_scores:
            axis_info['x'] = AxisInfo(
                name=x_dim,
                description=BrokerService._get_dimension_description(x_dim),
                data_range={
                    'min': round(min(raw_scores[x_dim]), 1),
                    'max': round(max(raw_scores[x_dim]), 1),
                    'avg': round(sum(raw_scores[x_dim]) / len(raw_scores[x_dim]), 1)
                }
            )

        # Y轴信息
        y_dim = request.y_axis
        if y_dim in raw_scores:
            axis_info['y'] = AxisInfo(
                name=y_dim,
                description=BrokerService._get_dimension_description(y_dim),
                data_range={
                    'min': round(min(raw_scores[y_dim]), 1),
                    'max': round(max(raw_scores[y_dim]), 1),
                    'avg': round(sum(raw_scores[y_dim]) / len(raw_scores[y_dim]), 1)
                }
            )

        # 气泡信息
        axis_info['bubble'] = AxisInfo(
            name="综合影响力",
            description="基于监管强度、口碑和监管机构数量的综合评分",
            data_range={'min': 0, 'max': 100, 'avg': 50}
        )

        return axis_info

    @staticmethod
    def _calculate_quadrant_statistics(data_points: List[BrokerDataPoint], normalized_scores: Dict[str, List[float]]) -> QuadrantStatistics:
        """计算象限统计信息"""
        total = len(data_points)

        # 计算各象限的数量
        quadrants = {'q1': 0, 'q2': 0, 'q3': 0, 'q4': 0}
        for point in data_points:
            if point.x_score >= 50 and point.y_score >= 50:
                quadrants['q1'] += 1  # 右上：监管强、透明度高
            elif point.x_score < 50 and point.y_score >= 50:
                quadrants['q2'] += 1  # 左上：监管弱、透明度高
            elif point.x_score < 50 and point.y_score < 50:
                quadrants['q3'] += 1  # 左下：监管弱、透明度低
            else:
                quadrants['q4'] += 1  # 右下：监管强、透明度低

        # 计算各维度平均分
        averages = {}
        for dim, scores in normalized_scores.items():
            if scores:
                averages[dim] = round(sum(scores) / len(scores), 1)

        return QuadrantStatistics(
            total_brokers=total,
            quadrants=quadrants,
            averages=averages
        )

    @staticmethod
    def _get_dimension_description(dimension: str) -> str:
        """获取维度描述"""
        descriptions = {
            '监管强度': '监管机构的权威性和监管要求的严格程度',
            '透明度与合规': '信息披露透明度和合规性表现',
            '交易成本': '点差、佣金等交易成本的竞争力',
            '执行与流动性': '交易执行速度和市场流动性',
            '平台与产品': '交易平台功能和产品丰富度',
            '服务与教育': '客户服务质量和教育资源',
            '稳定性与口碑': '平台稳定性和市场口碑'
        }
        return descriptions.get(dimension, dimension)

    @staticmethod
    def _get_available_dimensions() -> List[str]:
        """获取可用的分析维度"""
        return ['监管强度', '透明度与合规', '交易成本', '执行与流动性', '平台与产品', '服务与教育', '稳定性与口碑']