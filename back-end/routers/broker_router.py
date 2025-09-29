#!/usr/bin/env python3
"""
CFD经纪商相关API路由
"""

from fastapi import APIRouter, HTTPException, Request
from typing import List
from models.broker_models import (
    CFDBroker,
    CFDBrokerNews,
    BrokerComparisonRequest,
    BrokerComparisonResponse
)
from services.broker_service import BrokerService

# 创建路由器
router = APIRouter()

@router.get("/brokers", response_model=List[CFDBroker], summary="获取CFD经纪商列表")
async def list_cfd_brokers(request: Request):
    """
    获取所有CFD经纪商列表

    返回所有经纪商的基本信息，包括：
    - 经纪商名称和ID
    - 监管信息
    - 评分等级
    - 网站和Logo
    - 详细评分分解
    """
    return BrokerService.get_all_brokers(request)

@router.get("/brokers/{broker_id}", response_model=CFDBroker, summary="获取CFD经纪商详情")
async def get_cfd_broker_detail(broker_id: int, request: Request):
    """
    根据ID获取特定经纪商的详细信息

    参数:
    - broker_id: 经纪商唯一标识符

    返回完整的经纪商信息，包括详细的监管信息和评分分解
    """
    return BrokerService.get_broker_by_id(broker_id, request)

@router.get("/brokers/{broker_id}/news", response_model=List[CFDBrokerNews], summary="获取经纪商新闻")
async def list_broker_news(broker_id: int):
    """
    获取特定经纪商的相关新闻

    参数:
    - broker_id: 经纪商唯一标识符

    返回该经纪商的最新新闻和公告
    """
    return BrokerService.get_broker_news(broker_id)

@router.post("/brokers/compare", response_model=BrokerComparisonResponse, summary="对比CFD经纪商")
async def compare_cfd_brokers(comparison_request: BrokerComparisonRequest, request: Request):
    """
    对比多个CFD经纪商

    参数:
    - broker_ids: 要对比的经纪商ID列表 (2-5个)

    返回详细的对比分析，包括：
    - 基本信息对比
    - 监管信息对比
    - 评分详细对比
    - 各项指标的最佳表现者
    - 对比摘要统计
    """
    return BrokerService.compare_brokers(comparison_request.broker_ids, request)

@router.get("/brokers/compare-fields", summary="获取经纪商对比字段配置")
async def get_comparison_fields():
    """
    获取经纪商对比功能的可用字段配置

    返回对比表格中可以显示的所有字段定义，包括：
    - 基本信息字段
    - 监管信息字段
    - 详细评分字段

    前端可以使用这些字段配置来动态生成对比表格
    """
    return BrokerService.get_comparison_fields()

@router.get("/health", summary="经纪商服务健康检查")
async def broker_service_health():
    """
    经纪商服务健康检查

    返回经纪商数据库的基本统计信息，用于监控服务状态
    """
    try:
        from database import check_database_health
        health_status = check_database_health()

        return {
            "service": "broker_service",
            "status": "healthy",
            "database": health_status,
            "endpoints": [
                "/brokers",
                "/brokers/{id}",
                "/brokers/{id}/news",
                "/brokers/compare",
                "/brokers/compare-fields"
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"经纪商服务不可用: {str(e)}"
        )