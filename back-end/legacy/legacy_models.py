#!/usr/bin/env python3
"""
Legacy功能的数据模型 (ShopBack, ETH, Showcase等)
这些功能默认停用，只在启用Legacy功能时使用
"""

from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any

# ============= ShopBack相关模型 =============

class PriceAlertRequest(BaseModel):
    user_email: str
    store_url: str
    threshold_type: str  # 'above_current', 'fixed_value', 'percentage_increase'
    threshold_value: float

class PriceAlertResponse(BaseModel):
    id: int
    user_email: str
    store_url: str
    store_name: str
    threshold_type: str
    threshold_value: float
    is_active: bool
    created_at: str

class AddStoreRequest(BaseModel):
    url: str

class StoreResponse(BaseModel):
    id: int
    name: str
    url: str
    created_at: str
    updated_at: str

class CashbackHistoryResponse(BaseModel):
    id: int
    store_name: str
    store_url: str
    main_cashback: str
    main_rate_numeric: float
    category: str
    category_rate: str
    category_rate_numeric: float
    is_upsized: bool
    previous_offer: Optional[str]
    scraped_at: str

class ScrapeRequest(BaseModel):
    url: str

class ScrapeResponse(BaseModel):
    message: str
    store_name: str
    main_cashback: str

class RateStatisticsResponse(BaseModel):
    store_name: str
    category: str
    current_rate: float
    highest_rate: float
    lowest_rate: float
    average_rate: float
    change_from_average: float

class PerformanceMetricsResponse(BaseModel):
    scraping_performance: Dict[str, Any]
    data_scale: Dict[str, int]
    alert_latency: Dict[str, float]
    timestamp: str

class DashboardStats(BaseModel):
    total_stores: int
    total_cashback_records: int
    upsized_stores: int
    recent_updates: int

# ============= Showcase相关模型 =============

class ShowcaseCategory(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: str

class ShowcaseCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ShowcaseEvent(BaseModel):
    id: int
    category_id: int
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    external_url: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    created_at: str

class ShowcaseEventCreate(BaseModel):
    category_id: int
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    external_url: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

# ============= 支付相关模型 =============

class DonationRequest(BaseModel):
    amount: float
    currency: str = "USD"
    donor_email: Optional[str] = None

# ============= ETH相关模型 =============

class ETHPriceData(BaseModel):
    current_price: float
    timestamp: str
    model_state: Optional[Dict[str, Any]] = None

class ETHPrediction(BaseModel):
    timestamp: str
    current_price: float
    predicted_price_1h: float
    predicted_price_4h: float
    predicted_price_24h: float
    confidence_score: float
    model_version: Optional[str] = None

class ETHCandle(BaseModel):
    timestamp: int
    open_price: float
    high_price: float
    low_price: float
    close_price: float
    volume: float

class ETHModelMetrics(BaseModel):
    accuracy_1h: float
    accuracy_4h: float
    accuracy_24h: float
    mae: float  # Mean Absolute Error
    rmse: float  # Root Mean Square Error
    last_updated: str

class KalmanHalfLifeRequest(BaseModel):
    half_life_minutes: float