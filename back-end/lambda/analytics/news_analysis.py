"""
新闻情绪分析模块
从 S3 读取 Parquet 数据，生成分析结果 JSON
"""

import io
import json
import math
from datetime import datetime, timezone
from collections import Counter

import boto3
import numpy as np
import pandas as pd


def load_news_from_s3(s3, bucket: str) -> pd.DataFrame:
    """从 S3 加载所有 News Parquet 文件"""
    prefix = "raw/news/"
    resp = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
    frames = []
    for obj in resp.get("Contents", []):
        if obj["Key"].endswith(".parquet"):
            body = s3.get_object(Bucket=bucket, Key=obj["Key"])["Body"].read()
            frames.append(pd.read_parquet(io.BytesIO(body)))
    if not frames:
        return pd.DataFrame()
    df = pd.concat(frames).drop_duplicates(subset=["id"]).sort_values("id")
    df["pub_dt"] = pd.to_datetime(df["published_at"], unit="s", errors="coerce", utc=True)
    return df


def load_xau_daily_from_s3(s3, bucket: str) -> pd.DataFrame:
    """加载 XAU 分析结果中的日度数据，用于相关性分析"""
    try:
        obj = s3.get_object(Bucket=bucket, Key="analysis/xau_daily_stats.json")
        data = json.loads(obj["Body"].read())
        return pd.DataFrame(data["results"])
    except Exception:
        return pd.DataFrame()


def _safe(val):
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        v = float(val)
        return v if math.isfinite(v) else None
    if pd.isna(val):
        return None
    return val


def sentiment_over_time(df: pd.DataFrame) -> dict:
    """每日情绪趋势"""
    has_sent = df[df["sentiment"].isin(["positive", "negative", "neutral"])].copy()
    if has_sent.empty:
        return {"series": [], "summary": {}}

    has_sent["date"] = has_sent["pub_dt"].dt.strftime("%Y-%m-%d")
    daily = has_sent.groupby(["date", "sentiment"]).size().unstack(fill_value=0)

    for col in ["positive", "negative", "neutral"]:
        if col not in daily.columns:
            daily[col] = 0

    daily["total"] = daily["positive"] + daily["negative"] + daily["neutral"]
    daily["net_sentiment"] = (daily["positive"] - daily["negative"]) / daily["total"]
    daily["sentiment_ratio"] = daily["positive"] / (daily["positive"] + daily["negative"]).replace(0, 1)

    # 7 日滚动
    daily["net_sentiment_7d"] = daily["net_sentiment"].rolling(7, min_periods=1).mean()
    daily["ratio_7d"] = daily["sentiment_ratio"].rolling(7, min_periods=1).mean()

    records = []
    for date, row in daily.iterrows():
        records.append({
            "date": date,
            "positive": int(row["positive"]),
            "negative": int(row["negative"]),
            "neutral": int(row["neutral"]),
            "total": int(row["total"]),
            "net_sentiment": _safe(round(row["net_sentiment"], 4)),
            "net_sentiment_7d": _safe(round(row["net_sentiment_7d"], 4)),
            "sentiment_ratio": _safe(round(row["sentiment_ratio"], 4)),
            "ratio_7d": _safe(round(row["ratio_7d"], 4)),
        })

    summary = {
        "total_articles_with_sentiment": len(has_sent),
        "overall_positive": int(daily["positive"].sum()),
        "overall_negative": int(daily["negative"].sum()),
        "overall_neutral": int(daily["neutral"].sum()),
        "avg_net_sentiment": _safe(round(daily["net_sentiment"].mean(), 4)),
    }

    return {"series": records, "summary": summary}


def category_distribution(df: pd.DataFrame) -> dict:
    """分类分布"""
    has_cat = df[df["sentiment"].notna() & (df["sentiment"] != "")].copy()

    # 尝试读取 category 列（可能在某些导出中不存在）
    if "category" not in has_cat.columns:
        # 根据 symbols 推断分类
        return {"overall": {}, "by_sentiment": {}}

    cats = has_cat[has_cat["category"].notna() & (has_cat["category"] != "")]

    overall = cats["category"].value_counts().to_dict()
    overall = {k: int(v) for k, v in overall.items()}

    # sentiment x category
    cross = cats.groupby(["category", "sentiment"]).size().unstack(fill_value=0)
    by_sentiment = {}
    for cat in cross.index:
        by_sentiment[cat] = {
            "positive": int(cross.loc[cat].get("positive", 0)),
            "negative": int(cross.loc[cat].get("negative", 0)),
            "neutral": int(cross.loc[cat].get("neutral", 0)),
        }

    # 月度分布
    cats["month"] = cats["pub_dt"].dt.strftime("%Y-%m")
    monthly = cats.groupby(["month", "category"]).size().unstack(fill_value=0)
    by_month = {}
    for month in monthly.index:
        by_month[month] = {k: int(v) for k, v in monthly.loc[month].items() if v > 0}

    return {
        "overall": overall,
        "by_sentiment": by_sentiment,
        "by_month": by_month,
    }


def sentiment_price_correlation(df: pd.DataFrame, xau_daily: pd.DataFrame) -> dict:
    """情绪-价格相关性分析"""
    if xau_daily.empty:
        return {"error": "No XAU daily data available for correlation"}

    has_sent = df[df["sentiment"].isin(["positive", "negative", "neutral"])].copy()
    if has_sent.empty:
        return {"error": "No sentiment data"}

    has_sent["date"] = has_sent["pub_dt"].dt.strftime("%Y-%m-%d")

    # 每日净情绪
    daily_sent = has_sent.groupby("date")["sentiment"].apply(
        lambda x: (x == "positive").sum() - (x == "negative").sum()
    ).reset_index()
    daily_sent.columns = ["date", "net_sentiment"]

    xau = xau_daily[["date", "close", "change_pct"]].copy()
    xau["next_day_return"] = xau["change_pct"].shift(-1)

    merged = pd.merge(daily_sent, xau, on="date", how="inner")
    if len(merged) < 10:
        return {"error": "Insufficient overlapping data"}

    # 同日相关性
    same_day_corr = merged["net_sentiment"].corr(merged["change_pct"])
    # 次日相关性（情绪领先价格 1 天）
    next_day_corr = merged["net_sentiment"].corr(merged["next_day_return"])

    # 滞后相关性
    lag_corrs = {}
    for lag in [1, 2, 3]:
        shifted = merged["net_sentiment"].shift(lag)
        valid = pd.DataFrame({"sent": shifted, "ret": merged["change_pct"]}).dropna()
        if len(valid) > 10:
            lag_corrs[f"lag_{lag}"] = _safe(round(valid["sent"].corr(valid["ret"]), 4))

    # 散点图数据
    scatter = []
    for _, row in merged.iterrows():
        if pd.notna(row["next_day_return"]):
            scatter.append({
                "date": row["date"],
                "net_sentiment": _safe(row["net_sentiment"]),
                "next_day_return": _safe(round(row["next_day_return"], 3)),
            })

    return {
        "same_day_correlation": _safe(round(same_day_corr, 4)) if pd.notna(same_day_corr) else None,
        "next_day_correlation": _safe(round(next_day_corr, 4)) if pd.notna(next_day_corr) else None,
        "lag_correlations": lag_corrs,
        "data_points": len(merged),
        "scatter": scatter[-90:],  # 最近 90 天
    }


def symbol_frequency(df: pd.DataFrame) -> dict:
    """标的频率分析"""
    has_symbols = df[df["symbols"].notna() & (df["symbols"] != "") & (df["symbols"] != "[]")].copy()
    if has_symbols.empty:
        return {"top_symbols": [], "monthly": {}}

    counter = Counter()
    for syms_str in has_symbols["symbols"]:
        try:
            syms = json.loads(syms_str) if isinstance(syms_str, str) else syms_str
            if isinstance(syms, list):
                for s in syms:
                    if isinstance(s, str) and len(s) <= 10:
                        counter[s] += 1
        except (json.JSONDecodeError, TypeError):
            continue

    top_20 = [{"symbol": k, "count": v} for k, v in counter.most_common(20)]

    # 月度趋势（Top 10）
    top_10_names = {item["symbol"] for item in top_20[:10]}
    has_symbols["month"] = has_symbols["pub_dt"].dt.strftime("%Y-%m")
    monthly = {}

    for month, group in has_symbols.groupby("month"):
        month_counter = Counter()
        for syms_str in group["symbols"]:
            try:
                syms = json.loads(syms_str) if isinstance(syms_str, str) else syms_str
                if isinstance(syms, list):
                    for s in syms:
                        if s in top_10_names:
                            month_counter[s] += 1
            except (json.JSONDecodeError, TypeError):
                continue
        monthly[month] = dict(month_counter)

    return {
        "top_symbols": top_20,
        "monthly": monthly,
    }


def run_all(s3, bucket: str) -> dict:
    """运行所有新闻分析"""
    df = load_news_from_s3(s3, bucket)
    if df.empty:
        return {"error": "No news data found in S3"}

    meta = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_articles": len(df),
        "data_range": {
            "from": df["pub_dt"].min().strftime("%Y-%m-%d"),
            "to": df["pub_dt"].max().strftime("%Y-%m-%d"),
        },
    }

    sent = sentiment_over_time(df)
    cats = category_distribution(df)
    syms = symbol_frequency(df)

    # 相关性分析依赖 XAU 日度数据（需要先运行 XAU 分析）
    xau_daily = load_xau_daily_from_s3(s3, bucket)
    corr = sentiment_price_correlation(df, xau_daily)

    return {
        "news_sentiment": {**meta, "results": sent},
        "news_categories": {**meta, "results": cats},
        "news_correlation": {**meta, "results": corr},
        "news_symbols": {**meta, "results": syms},
    }
