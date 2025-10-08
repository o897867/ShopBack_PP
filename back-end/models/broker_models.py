#!/usr/bin/env python3
"""
CFD经纪商相关的数据模型
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class CFDBroker(BaseModel):
    """CFD经纪商模型"""
    id: int
    name: str
    regulators: Optional[str] = None
    regulator_details: Optional[List[Dict[str, Any]]] = None
    rating: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    rating_breakdown: Optional[Dict[str, Any]] = None
    created_at: str

class CFDBrokerNews(BaseModel):
    """CFD经纪商新闻模型"""
    id: int
    broker_id: int
    title: str
    content: Optional[str] = None
    url: Optional[str] = None
    tag: Optional[str] = None
    created_at: str

class BrokerComparisonRequest(BaseModel):
    """经纪商对比请求模型"""
    broker_ids: List[int]

class BrokerComparisonResponse(BaseModel):
    """经纪商对比响应模型"""
    brokers: List[CFDBroker]
    comparison_fields: Dict[str, List[Dict[str, str]]]
    comparison_data: List[Dict[str, Any]]
    best_performers: Dict[str, int]
    summary: Dict[str, Any]

class ComparisonField(BaseModel):
    """对比字段模型"""
    key: str
    label: str
    type: str  # 'text', 'number', 'grade', 'score', 'url', 'image'

class ComparisonFieldGroup(BaseModel):
    """对比字段组模型"""
    group_name: str
    fields: List[ComparisonField]

class BrokerMetrics(BaseModel):
    """经纪商指标模型"""
    total_brokers: int
    rated_brokers: int
    rating_distribution: Dict[str, int]
    top_rated: List[CFDBroker]

class BrokerSearchRequest(BaseModel):
    """经纪商搜索请求"""
    query: Optional[str] = None
    regulators: Optional[List[str]] = None
    rating_min: Optional[str] = None
    rating_max: Optional[str] = None
    limit: Optional[int] = 50
    offset: Optional[int] = 0

class BrokerSearchResponse(BaseModel):
    """经纪商搜索响应"""
    brokers: List[CFDBroker]
    total_count: int
    filters_applied: Dict[str, Any]

# ============= 象限分析相关模型 =============

class QuadrantAnalysisRequest(BaseModel):
    """象限分析请求模型"""
    x_axis: Optional[str] = "监管强度"  # X轴维度
    y_axis: Optional[str] = "透明度与合规"  # Y轴维度
    bubble_metric: Optional[str] = "综合影响力"  # 气泡大小指标
    regulators: Optional[List[str]] = None  # 监管机构筛选
    rating_min: Optional[str] = None  # 最低评级
    rating_max: Optional[str] = None  # 最高评级
    limit: Optional[int] = 100  # 最大返回数量

class BrokerDataPoint(BaseModel):
    """单个经纪商的图表数据点"""
    id: int
    name: str
    x_score: float  # X轴标准化分数 (0-100)
    y_score: float  # Y轴标准化分数 (0-100)
    bubble_size: float  # 气泡大小标准化分数 (0-100)
    overall_rating: Optional[str] = None
    logo_url: Optional[str] = None
    regulator_count: int
    metadata: Dict[str, Any]  # 额外信息，用于悬停提示

class AxisInfo(BaseModel):
    """坐标轴信息"""
    name: str
    description: str
    data_range: Dict[str, float]  # min, max, avg

class QuadrantStatistics(BaseModel):
    """象限统计信息"""
    total_brokers: int
    quadrants: Dict[str, int]  # 各象限的经纪商数量
    averages: Dict[str, float]  # 各维度的平均分

class QuadrantAnalysisResponse(BaseModel):
    """象限分析响应模型"""
    data_points: List[BrokerDataPoint]
    x_axis_info: AxisInfo
    y_axis_info: AxisInfo
    bubble_info: AxisInfo
    statistics: QuadrantStatistics
    available_dimensions: List[str]  # 可选的维度列表