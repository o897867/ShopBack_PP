import os

S3_BUCKET = os.getenv("ANALYTICS_S3_BUCKET", "fxlab-data-lake")
S3_REGION = os.getenv("ANALYTICS_S3_REGION", "ap-southeast-2")

# S3 paths
RAW_XAU_PREFIX = "raw/xau/candles_1m"
RAW_NEWS_PREFIX = "raw/news"
ANALYSIS_PREFIX = "analysis"
METADATA_KEY = "metadata/last_export.json"

# Lambda (triggered separately by EventBridge rule fxlab-analytics-daily at 05:15 UTC)
LAMBDA_FUNCTION_NAME = os.getenv("ANALYTICS_LAMBDA_NAME", "analytics-pipeline")
