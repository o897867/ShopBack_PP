#!/usr/bin/env python3
"""
ShopBack CFD Trading Platform - 核心应用
重构后的简化版本，专注于核心功能：BrokerHub、计算器、论坛、用户认证
"""

import logging
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
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

    except Exception as e:
        logger.error(f"❌ 初始化失败: {e}")
        raise

    yield

    # 关闭时清理
    logger.info("🛑 关闭 ShopBack CFD Trading Platform")

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