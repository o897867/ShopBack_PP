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