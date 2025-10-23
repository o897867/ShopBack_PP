#!/usr/bin/env python3
"""
应用配置文件
管理环境变量和应用配置
"""

import os
from dotenv import load_dotenv

load_dotenv()

# 应用基础配置
APP_NAME = "ShopBack CFD Trading Platform"
VERSION = "2.0.0"
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

# 数据库配置
DATABASE_PATH = os.getenv("DATABASE_PATH", "/root/shopback/ShopBack_PP/back-end/shopback_data.db")

# CORS配置
ALLOWED_ORIGINS = ["*"]  # Allow all origins for development/testing

# 功能开关
ENABLE_LEGACY_FEATURES = os.getenv("ENABLE_LEGACY_FEATURES", "false").lower() == "true"
ENABLE_ETH_FEATURES = os.getenv("ENABLE_ETH_FEATURES", "false").lower() == "true"
ENABLE_SHOPBACK_FEATURES = os.getenv("ENABLE_SHOPBACK_FEATURES", "false").lower() == "true"

# 邮件配置 (用于提醒功能)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

# 外部API配置
SQUARE_APP_ID = os.getenv("SQUARE_APP_ID", "")
SQUARE_ACCESS_TOKEN = os.getenv("SQUARE_ACCESS_TOKEN", "")
SQUARE_ENVIRONMENT = os.getenv("SQUARE_ENVIRONMENT", "sandbox")

# 文件上传配置
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/root/shopback/ShopBack_PP/back-end/static/uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB

# 服务器配置
HOST = "0.0.0.0"
PORT = int(os.getenv("PORT", "8001"))
RELOAD = DEBUG