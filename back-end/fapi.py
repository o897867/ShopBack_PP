#!/usr/bin/env python3
"""
ShopBack CFD Trading Platform - 核心应用
重构后的简化版本，专注于核心功能：BrokerHub、计算器、论坛、用户认证
"""

import logging
import uvicorn
import asyncio
import time
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

# ETH Kalman filter imports
from eth_kalman_model import ETHKalmanModelManager
from binance_eth_data import BinanceDataManager

# 导入配置
from config import (
    APP_NAME, VERSION, DEBUG, ALLOWED_ORIGINS,
    ENABLE_LEGACY_FEATURES, HOST, PORT, RELOAD
)

# 导入数据库初始化
from database import init_database, init_legacy_tables, check_database_health, get_db_connection

# 导入核心路由
from routers.broker_router import router as broker_router
from routers.calculator_router import router as calculator_router

# 导入现有的论坛和认证功能
from forum_api import get_forum_router
from auth_router import get_auth_router
from auth import ensure_auth_tables

# 配置日志
logging.basicConfig(level=logging.INFO if not DEBUG else logging.DEBUG)
logger = logging.getLogger(__name__)

# ============= ETH Kalman Filter 全局变量 =============
ETH_PREDICTIONS_ENABLED = True  # Enable ETH predictions
eth_model_manager: ETHKalmanModelManager = None
eth_data_manager: BinanceDataManager = None
eth_ws_clients: set = set()  # WebSocket clients for real-time updates

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    global eth_model_manager, eth_data_manager

    # 启动时初始化
    logger.info("🚀 启动 ShopBack CFD Trading Platform")

    try:
        # 初始化核心数据库表
        init_database()
        logger.info("✅ 核心数据库初始化完成")

        # 初始化认证表
        ensure_auth_tables(get_db_connection)
        logger.info("✅ 认证系统初始化完成")

        # 可选：初始化Legacy功能表
        if ENABLE_LEGACY_FEATURES:
            init_legacy_tables()
            logger.info("✅ Legacy功能表初始化完成")
        else:
            logger.info("⏸️  Legacy功能已禁用")

        # 检查数据库健康状态
        health = check_database_health()
        logger.info(f"📊 数据库状态: {health}")

        # Initialize ETH Kalman filter
        if ETH_PREDICTIONS_ENABLED:
            try:
                logger.info("🔮 初始化 ETH Kalman Filter...")
                eth_model_manager = ETHKalmanModelManager()
                eth_data_manager = BinanceDataManager(model_manager=eth_model_manager)

                # Start ETH model in background
                asyncio.create_task(startup_eth_model())
                logger.info("✅ ETH Kalman Filter 已启动")
            except Exception as e:
                logger.error(f"❌ ETH Kalman Filter 初始化失败: {e}")

    except Exception as e:
        logger.error(f"❌ 初始化失败: {e}")
        raise

    yield

    # 关闭时清理
    logger.info("🛑 关闭 ShopBack CFD Trading Platform")

    # Cleanup ETH resources
    if ETH_PREDICTIONS_ENABLED and eth_data_manager:
        try:
            await eth_data_manager.stop()
            logger.info("✅ ETH Kalman Filter 已停止")
        except Exception as e:
            logger.error(f"❌ ETH Kalman Filter 停止失败: {e}")

# 创建FastAPI应用
app = FastAPI(
    title=APP_NAME,
    version=VERSION,
    description="专注于CFD经纪商对比和交易计算的一体化平台",
    lifespan=lifespan
)

# CORS中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "X-User-Id"],
)

# 静态文件服务
static_dir = "/root/shopback/ShopBack_PP/back-end/static"
try:
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    logger.info(f"✅ 静态文件服务已配置: {static_dir}")
except Exception as e:
    logger.warning(f"⚠️  静态文件服务配置失败: {e}")

# ============= 核心功能路由 =============

# CFD经纪商功能
app.include_router(
    broker_router,
    prefix="/api/cfd",
    tags=["CFD Brokers"],
)

# 交易计算器功能
app.include_router(
    calculator_router,
    prefix="/api/leverage",
    tags=["Trading Calculator"],
)

# 论坛功能 (现有)
from auth import get_current_user_dependency
forum_router = get_forum_router(get_db_connection=get_db_connection, get_current_user=get_current_user_dependency(get_db_connection))
app.include_router(
    forum_router,
    tags=["Forum"],
)

# 用户认证功能 (现有)
auth_router = get_auth_router(get_db_connection=get_db_connection)
app.include_router(
    auth_router,
    prefix="/api",
    tags=["Authentication"],
)

# ============= Legacy功能路由 (可选) =============

if ENABLE_LEGACY_FEATURES:
    logger.info("🔄 启用Legacy功能")

    # 这里可以添加Legacy路由
    # from legacy.shopback_router import router as shopback_router
    # from legacy.eth_router import router as eth_router
    # app.include_router(shopback_router, prefix="/api/legacy/shopback", tags=["Legacy - ShopBack"])
    # app.include_router(eth_router, prefix="/api/legacy/eth", tags=["Legacy - ETH"])

# ============= 基础路由 =============

@app.get("/", summary="API根路径")
async def root():
    """API根路径，返回应用信息"""
    return {
        "app": APP_NAME,
        "version": VERSION,
        "status": "running",
        "core_features": [
            "CFD Brokers Comparison",
            "Trading Calculator",
            "Forum & Community",
            "User Authentication"
        ],
        "legacy_features_enabled": ENABLE_LEGACY_FEATURES,
        "endpoints": {
            "brokers": "/api/cfd/brokers",
            "calculator": "/api/leverage/calculate",
            "forum": "/api/forum/threads",
            "auth": "/api/auth/login"
        }
    }

@app.get("/api/health", summary="系统健康检查")
async def health_check():
    """系统健康检查"""
    try:
        db_health = check_database_health()

        return {
            "status": "healthy",
            "app": APP_NAME,
            "version": VERSION,
            "database": db_health,
            "features": {
                "core_features": ["brokers", "calculator", "forum", "auth"],
                "legacy_enabled": ENABLE_LEGACY_FEATURES
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e)
            }
        )

@app.get("/api/info", summary="应用信息")
async def app_info():
    """获取应用详细信息"""
    return {
        "name": APP_NAME,
        "version": VERSION,
        "debug": DEBUG,
        "features": {
            "core": {
                "cfd_brokers": {
                    "description": "CFD经纪商对比和评分系统",
                    "endpoints": ["/api/cfd/brokers", "/api/cfd/brokers/compare"]
                },
                "trading_calculator": {
                    "description": "杠杆交易计算器和风险分析",
                    "endpoints": ["/api/leverage/calculate", "/api/leverage/position"]
                },
                "forum": {
                    "description": "社区论坛和讨论",
                    "endpoints": ["/api/forum/threads", "/api/forum/posts"]
                },
                "authentication": {
                    "description": "用户认证和授权",
                    "endpoints": ["/api/auth/login", "/api/auth/register"]
                }
            },
            "legacy": {
                "enabled": ENABLE_LEGACY_FEATURES,
                "note": "Legacy功能包括ShopBack返现、ETH预测等，默认禁用"
            }
        },
        "configuration": {
            "cors_origins": ALLOWED_ORIGINS,
            "debug_mode": DEBUG
        }
    }

# ============= ETH Kalman Filter 端点 =============

async def startup_eth_model():
    """Initialize ETH model on startup"""
    if not ETH_PREDICTIONS_ENABLED or eth_model_manager is None or eth_data_manager is None:
        logger.info("ETH prediction subsystem disabled; skipping Kalman model startup")
        return
    try:
        # Load saved state if exists
        if eth_model_manager.load_state():
            logger.info("Loaded ETH Kalman model state from database")

        # Create wrapper for broadcasting updates
        async def broadcast_candle_updates(candle: dict):
            """Wrapper to broadcast candle updates via WebSocket"""
            try:
                # Call the original on_new_candle method
                predictions = await eth_data_manager.on_new_candle(candle)

                # Broadcast to WebSocket clients if we have predictions
                if predictions and eth_ws_clients:
                    await broadcast_eth_update({
                        "type": "update",
                        "candle": candle,
                        "predictions": predictions,
                        "model_state": eth_model_manager.get_model_metrics()
                    })

                return predictions
            except Exception as e:
                logger.error(f"Error in broadcast_candle_updates: {e}")
                return None

        # Start data manager with the broadcasting callback
        async def start_with_callback():
            await eth_data_manager.initialize()
            await eth_data_manager.fetcher.start_websocket_stream(broadcast_candle_updates)

        asyncio.create_task(start_with_callback())
        logger.info("Started ETH data manager with Binance WebSocket")
    except Exception as e:
        logger.error(f"Failed to start ETH model: {e}")

@app.get("/api/eth/current-price", summary="Get current ETH price and model state")
async def get_eth_current_price():
    """Get current ETH price with model state"""
    if not ETH_PREDICTIONS_ENABLED or eth_model_manager is None or eth_data_manager is None:
        raise HTTPException(status_code=503, detail="ETH prediction service is temporarily disabled")
    try:
        current_price = eth_data_manager.fetcher.get_current_price()
        model_metrics = eth_model_manager.get_model_metrics()

        return {
            "current_price": current_price,
            "model_state": model_metrics,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/eth/predictions", summary="Get ETH price predictions")
async def get_eth_predictions():
    """Get ETH price predictions for multiple horizons"""
    if not ETH_PREDICTIONS_ENABLED or eth_model_manager is None or eth_data_manager is None:
        raise HTTPException(status_code=503, detail="ETH prediction service is temporarily disabled")
    try:
        # Get latest candle
        candles = eth_data_manager.fetcher.get_recent_candles(2)
        if len(candles) < 2:
            return {"error": "Insufficient data for predictions"}

        # Generate predictions
        predictions = eth_model_manager.update_with_new_candle(candles[-1])

        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/eth/candles-3m", summary="Get historical 3-minute candles")
async def get_eth_candles(limit: int = Query(100, le=500)):
    """Get historical 3-minute ETH candles"""
    if not ETH_PREDICTIONS_ENABLED or eth_data_manager is None:
        raise HTTPException(status_code=503, detail="ETH prediction service is temporarily disabled")
    try:
        candles = eth_data_manager.fetcher.get_recent_candles(limit)
        return {
            "candles": candles,
            "count": len(candles)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/eth/model/half-life", summary="Adjust Kalman filter half-life")
async def set_eth_half_life(half_life_candles: int = Query(..., ge=4, le=6)):
    """Adjust the half-life parameter (4-6 candles, i.e., 12-18 minutes)"""
    if not ETH_PREDICTIONS_ENABLED or eth_model_manager is None:
        raise HTTPException(status_code=503, detail="ETH prediction service is temporarily disabled")
    try:
        eth_model_manager.model.set_half_life(half_life_candles)
        eth_model_manager.save_state()

        return {
            "half_life_candles": half_life_candles,
            "half_life_minutes": half_life_candles * 3,
            "delta": eth_model_manager.model.delta
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/eth/model/metrics", summary="Get model performance metrics")
async def get_eth_model_metrics():
    """Get detailed model metrics and parameters"""
    if not ETH_PREDICTIONS_ENABLED or eth_model_manager is None:
        raise HTTPException(status_code=503, detail="ETH prediction service is temporarily disabled")
    try:
        metrics = eth_model_manager.get_model_metrics()
        state = eth_model_manager.model.get_state()

        return {
            "metrics": metrics,
            "state": state,
            "config": {
                "half_life_candles": eth_model_manager.model.half_life,
                "c_level": eth_model_manager.model.c_level,
                "c_trend": eth_model_manager.model.c_trend,
                "r0_mult": eth_model_manager.model.r0_mult
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/eth/kalman-updates")
async def eth_kalman_websocket(websocket: WebSocket):
    """WebSocket for real-time ETH Kalman model updates"""
    await websocket.accept()
    if not ETH_PREDICTIONS_ENABLED or eth_model_manager is None or eth_data_manager is None:
        await websocket.send_json({
            "type": "disabled",
            "message": "ETH prediction service is temporarily disabled"
        })
        await websocket.close()
        return

    eth_ws_clients.add(websocket)

    try:
        # Send initial state
        current_price = eth_data_manager.fetcher.get_current_price()
        initial_data = {
            "type": "initial",
            "current_price": current_price,
            "model_state": eth_model_manager.get_model_metrics()
        }
        await websocket.send_json(initial_data)
        logger.info(f"New WebSocket client connected. Total clients: {len(eth_ws_clients)}")

        # Keep connection alive with periodic ping
        ping_interval = 30  # Send ping every 30 seconds
        last_ping = time.time()

        while True:
            try:
                # Check if we should send a ping
                current_time = time.time()
                if current_time - last_ping > ping_interval:
                    await websocket.send_json({"type": "ping", "timestamp": current_time})
                    last_ping = current_time

                # Try to receive data with timeout
                try:
                    await asyncio.wait_for(websocket.receive_text(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue  # No data received, continue loop

            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error in WebSocket loop: {e}")
                break

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected. Remaining clients: {len(eth_ws_clients) - 1}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if websocket in eth_ws_clients:
            eth_ws_clients.remove(websocket)
        try:
            await websocket.close()
        except:
            pass

async def broadcast_eth_update(update_data: dict):
    """Broadcast ETH model updates to all WebSocket clients"""
    if not ETH_PREDICTIONS_ENABLED:
        return
    disconnected = set()
    for ws in eth_ws_clients:
        try:
            await ws.send_json(update_data)
        except:
            disconnected.add(ws)

    # Remove disconnected clients
    for ws in disconnected:
        eth_ws_clients.remove(ws)

# ============= Technical Indicators API =============

from indicators import (
    calculate_all_indicators,
    evaluate_indicator_effectiveness,
    compare_indicators
)
from indicator_signals_v2 import analyze_signals_simple
from indicator_validity import analyze_validity, filter_validity_by_period

@app.get("/api/indicators/calculate", summary="Calculate technical indicators")
async def calculate_indicators(
    symbol: str = Query("ETHUSDT", description="Trading symbol"),
    interval: str = Query("3m", description="Candle interval"),
    limit: int = Query(500, le=1000, description="Number of candles")
):
    """Calculate MACD, VWAP, SMA14, EMA20 for given symbol"""
    try:
        # Get candles data
        if symbol == "ETHUSDT" and interval == "3m":
            # Use existing ETH data
            if eth_data_manager:
                candles = eth_data_manager.fetcher.get_recent_candles(limit)
            else:
                raise HTTPException(status_code=503, detail="ETH data service not available")
        else:
            # For other symbols, we would need to fetch from Binance API
            # For now, return error
            raise HTTPException(status_code=400, detail="Currently only ETHUSDT with 3m interval is supported")

        # Calculate indicators
        indicators = calculate_all_indicators(candles)

        # Helper function to convert NaN to None for JSON serialization
        import numpy as np
        def clean_nan(arr):
            if isinstance(arr, np.ndarray):
                # Replace NaN with None
                return [None if np.isnan(x) else x for x in arr]
            return arr

        # Format response
        return {
            "symbol": symbol,
            "interval": interval,
            "candle_count": len(candles),
            "indicators": {
                "sma14": clean_nan(indicators.get('sma14', [])),
                "ema20": clean_nan(indicators.get('ema20', [])),
                "macd": {
                    "macd": clean_nan(indicators.get('macd', {}).get('macd', [])),
                    "signal": clean_nan(indicators.get('macd', {}).get('signal', [])),
                    "histogram": clean_nan(indicators.get('macd', {}).get('histogram', []))
                },
                "vwap": clean_nan(indicators.get('vwap', [])),
                "rsi": clean_nan(indicators.get('rsi', []))
            },
            "candles": candles
        }
    except Exception as e:
        logger.error(f"Error calculating indicators: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/indicators/backtest", summary="Backtest indicator effectiveness")
async def backtest_indicator(
    indicator: str = Query(..., description="Indicator type: MACD, VWAP, SMA14, EMA20"),
    symbol: str = Query("ETHUSDT", description="Trading symbol"),
    interval: str = Query("3m", description="Candle interval"),
    limit: int = Query(1000, le=2000, description="Number of candles for backtest")
):
    """Backtest a specific indicator and get effectiveness metrics"""
    try:
        # Validate indicator
        valid_indicators = ['MACD', 'VWAP', 'SMA14', 'EMA20']
        if indicator not in valid_indicators:
            raise HTTPException(status_code=400, detail=f"Invalid indicator. Choose from: {valid_indicators}")

        # Get candles data
        if symbol == "ETHUSDT" and interval == "3m":
            if eth_data_manager:
                candles = eth_data_manager.fetcher.get_recent_candles(limit)
            else:
                raise HTTPException(status_code=503, detail="ETH data service not available")
        else:
            raise HTTPException(status_code=400, detail="Currently only ETHUSDT with 3m interval is supported")

        # Evaluate effectiveness
        result = evaluate_indicator_effectiveness(candles, indicator)

        return {
            "symbol": symbol,
            "interval": interval,
            "candle_count": len(candles),
            "backtest_result": result
        }
    except Exception as e:
        logger.error(f"Error in backtest: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/indicators/effectiveness", summary="Compare all indicators effectiveness")
async def compare_all_indicators(
    symbol: str = Query("ETHUSDT", description="Trading symbol"),
    interval: str = Query("3m", description="Candle interval"),
    limit: int = Query(1000, le=2000, description="Number of candles for comparison")
):
    """Compare effectiveness of all indicators and rank them"""
    try:
        # Get candles data
        if symbol == "ETHUSDT" and interval == "3m":
            if eth_data_manager:
                candles = eth_data_manager.fetcher.get_recent_candles(limit)
            else:
                raise HTTPException(status_code=503, detail="ETH data service not available")
        else:
            raise HTTPException(status_code=400, detail="Currently only ETHUSDT with 3m interval is supported")

        # Compare all indicators
        comparison = compare_indicators(candles)

        return {
            "symbol": symbol,
            "interval": interval,
            "candle_count": len(candles),
            "comparison": comparison
        }
    except Exception as e:
        logger.error(f"Error comparing indicators: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/indicators/signals", summary="Count indicator signals in period")
async def get_indicator_signals(
    symbol: str = Query("ETHUSDT", description="Trading symbol"),
    interval: str = Query("3m", description="Candle interval"),
    days: int = Query(7, ge=1, le=30, description="Number of days to analyze"),
    limit: int = Query(3360, le=10000, description="Number of candles to fetch")
):
    """Count buy/sell signals for all indicators in the specified period"""
    try:
        # Get candles data
        if symbol == "ETHUSDT" and interval == "3m":
            if eth_data_manager:
                candles = eth_data_manager.fetcher.get_recent_candles(limit)
            else:
                raise HTTPException(status_code=503, detail="ETH data service not available")
        else:
            raise HTTPException(status_code=400, detail="Currently only ETHUSDT with 3m interval is supported")

        # Calculate indicators
        indicators = calculate_all_indicators(candles)

        # Count signals using simplified analysis
        signal_summary = analyze_signals_simple(candles, indicators, days)

        return {
            "symbol": symbol,
            "interval": interval,
            "period_days": days,
            "candle_count": len(candles),
            "signal_summary": signal_summary
        }
    except Exception as e:
        logger.error(f"Error counting signals: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/indicators/validity", summary="Analyze indicator validity")
async def get_indicator_validity(
    symbol: str = Query("ETHUSDT", description="Trading symbol"),
    interval: str = Query("3m", description="Candle interval"),
    days: int = Query(7, ge=1, le=30, description="Number of days to analyze"),
    limit: int = Query(3360, le=10000, description="Number of candles to fetch"),
    # MA parameters
    ma_tol: float = Query(0.0015, ge=0, le=0.01, description="MA touch tolerance (0.15% default)"),
    ma_win: int = Query(8, ge=2, le=20, description="MA confirmation window"),
    ma_thr: float = Query(0.004, ge=0, le=0.02, description="MA bounce threshold (0.4% default)"),
    # VWAP parameters
    vwap_k: float = Query(2.0, ge=0.5, le=4.0, description="VWAP bands multiplier"),
    vwap_win: int = Query(50, ge=10, le=200, description="VWAP rolling window"),
    vwap_revert: float = Query(0.002, ge=0, le=0.01, description="VWAP reversion tolerance"),
    # MACD parameters
    macd_win: int = Query(8, ge=2, le=20, description="MACD confirmation window"),
    macd_thr: float = Query(0.005, ge=0, le=0.02, description="MACD movement threshold"),
    macd_hist: int = Query(2, ge=0, le=10, description="MACD histogram confirmation candles")
):
    """
    Analyze validity of indicator signals based on effectiveness criteria.

    Returns only valid signals where:
    - MA: Price touches and bounces from moving average
    - VWAP: Price reverts after touching bands
    - MACD: Price confirms direction after crossover
    """
    try:
        # Get candles data
        if symbol == "ETHUSDT" and interval == "3m":
            if eth_data_manager:
                candles = eth_data_manager.fetcher.get_recent_candles(limit)
            else:
                raise HTTPException(status_code=503, detail="ETH data service not available")
        else:
            raise HTTPException(status_code=400, detail="Currently only ETHUSDT with 3m interval is supported")

        # Calculate all indicators including new ones
        indicators = calculate_all_indicators(candles)

        # Prepare parameters
        params = {
            'ma_tol': ma_tol,
            'ma_win': ma_win,
            'ma_thr': ma_thr,
            'vwap_k': vwap_k,
            'vwap_win': vwap_win,
            'vwap_revert': vwap_revert,
            'vwap_min_touch': 0.003,
            'macd_win': macd_win,
            'macd_thr': macd_thr,
            'macd_hist': macd_hist
        }

        # Analyze validity
        validity_results = analyze_validity(candles, indicators, params)

        # Filter by period
        filtered_results = filter_validity_by_period(validity_results, candles, days)

        return {
            "symbol": symbol,
            "interval": interval,
            "validity_summary": filtered_results,
            "parameters_used": params
        }
    except Exception as e:
        logger.error(f"Error analyzing validity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= Trading Halt Records API =============

@app.get("/api/halt/records", summary="Get trading halt records")
async def get_halt_records(limit: int = 50):
    """Get historical trading halt records (unexpected quote interruptions)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
        SELECT
            broker_name,
            halt_date,
            platform,
            created_at
        FROM halt_records
        ORDER BY halt_date DESC
        LIMIT ?
        """

        cursor.execute(query, (limit,))
        rows = cursor.fetchall()

        results = []
        for row in rows:
            results.append({
                'broker_name': row[0],
                'halt_date': row[1],
                'platform': row[2],
                'created_at': row[3]
            })

        conn.close()
        return {"data": results}

    except Exception as e:
        logger.error(f"Error fetching halt records: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= 异常处理 =============

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """404错误处理"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": f"路径 {request.url.path} 不存在",
            "suggestion": "请查看 /api/info 获取可用的API端点"
        }
    )

@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    """500错误处理"""
    logger.error(f"服务器错误: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "服务器内部错误，请稍后重试"
        }
    )

# ============= 应用启动 =============

if __name__ == "__main__":
    logger.info(f"🎯 启动模式: {'开发' if DEBUG else '生产'}")
    logger.info(f"🌐 CORS允许源: {ALLOWED_ORIGINS}")
    logger.info(f"🔧 Legacy功能: {'启用' if ENABLE_LEGACY_FEATURES else '禁用'}")

    uvicorn.run(
        "fapi:app",
        host=HOST,
        port=PORT,
        reload=RELOAD,
        log_level="debug" if DEBUG else "info"
    )