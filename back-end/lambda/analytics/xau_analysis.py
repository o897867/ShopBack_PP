"""
XAU 金价分析模块
从 S3 读取 Parquet 数据，生成分析结果 JSON
"""

import io
import json
import math
from datetime import datetime, timezone

import boto3
import numpy as np
import pandas as pd


def load_xau_from_s3(s3, bucket: str) -> pd.DataFrame:
    """从 S3 加载所有 XAU Parquet 文件"""
    prefix = "raw/xau/candles_1m/"
    resp = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
    frames = []
    for obj in resp.get("Contents", []):
        if obj["Key"].endswith(".parquet"):
            body = s3.get_object(Bucket=bucket, Key=obj["Key"])["Body"].read()
            frames.append(pd.read_parquet(io.BytesIO(body)))
    if not frames:
        return pd.DataFrame()
    df = pd.concat(frames).drop_duplicates(subset=["open_time"]).sort_values("open_time")
    df["dt"] = pd.to_datetime(df["open_time"], unit="ms", utc=True)
    return df


def _safe(val):
    """确保值可以 JSON 序列化"""
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        v = float(val)
        return v if math.isfinite(v) else None
    if isinstance(val, (np.ndarray,)):
        return [_safe(x) for x in val]
    if pd.isna(val):
        return None
    return val


def daily_stats(df: pd.DataFrame) -> dict:
    """日度统计：OHLC、涨跌幅、振幅、成交量"""
    daily = df.set_index("dt").resample("D").agg(
        open=("open", "first"),
        high=("high", "max"),
        low=("low", "min"),
        close=("close", "last"),
        volume=("volume", "sum"),
        candle_count=("close", "count"),
    ).dropna(subset=["close"])

    daily["change_pct"] = daily["close"].pct_change() * 100
    daily["range_pct"] = (daily["high"] - daily["low"]) / daily["open"] * 100
    daily["gap"] = daily["open"] - daily["close"].shift(1)

    records = []
    for date, row in daily.iterrows():
        records.append({
            "date": date.strftime("%Y-%m-%d"),
            "open": _safe(row["open"]),
            "high": _safe(row["high"]),
            "low": _safe(row["low"]),
            "close": _safe(row["close"]),
            "volume": _safe(row["volume"]),
            "candle_count": _safe(row["candle_count"]),
            "change_pct": _safe(round(row["change_pct"], 3)) if pd.notna(row["change_pct"]) else None,
            "range_pct": _safe(round(row["range_pct"], 3)),
            "gap": _safe(round(row["gap"], 2)) if pd.notna(row["gap"]) else None,
        })
    return records


def volatility_analysis(daily_records: list) -> dict:
    """波动率分析：滚动波动率、ATR、波动率分级"""
    df = pd.DataFrame(daily_records)
    df["date"] = pd.to_datetime(df["date"])
    closes = df["close"].values
    highs = df["high"].values
    lows = df["low"].values

    # 日收益率
    returns = np.diff(closes) / closes[:-1]
    returns = np.insert(returns, 0, 0)

    # 滚动年化波动率
    vol_5 = pd.Series(returns).rolling(5).std() * np.sqrt(252)
    vol_10 = pd.Series(returns).rolling(10).std() * np.sqrt(252)
    vol_20 = pd.Series(returns).rolling(20).std() * np.sqrt(252)

    # ATR-14
    tr = np.maximum(
        highs[1:] - lows[1:],
        np.maximum(
            np.abs(highs[1:] - closes[:-1]),
            np.abs(lows[1:] - closes[:-1]),
        ),
    )
    atr = pd.Series(np.insert(tr, 0, highs[0] - lows[0])).ewm(span=14).mean()

    # 当前波动率分位
    current_vol = float(vol_20.iloc[-1]) if pd.notna(vol_20.iloc[-1]) else 0
    vol_percentile = float((vol_20.dropna() < current_vol).mean() * 100)

    regime = "low" if vol_percentile < 33 else ("high" if vol_percentile > 66 else "medium")

    records = []
    for i, row in df.iterrows():
        records.append({
            "date": row["date"].strftime("%Y-%m-%d"),
            "close": _safe(row["close"]),
            "vol_5d": _safe(round(vol_5.iloc[i], 4)) if pd.notna(vol_5.iloc[i]) else None,
            "vol_10d": _safe(round(vol_10.iloc[i], 4)) if pd.notna(vol_10.iloc[i]) else None,
            "vol_20d": _safe(round(vol_20.iloc[i], 4)) if pd.notna(vol_20.iloc[i]) else None,
            "atr_14": _safe(round(atr.iloc[i], 2)) if pd.notna(atr.iloc[i]) else None,
        })

    return {
        "current_regime": regime,
        "current_vol_20d": _safe(round(current_vol, 4)),
        "vol_percentile": _safe(round(vol_percentile, 1)),
        "series": records,
    }


def session_analysis(df: pd.DataFrame) -> dict:
    """交易时段分析：亚洲/伦敦/纽约"""
    sessions = {
        "asian": (0, 8),
        "london": (8, 16),
        "newyork": (13, 22),
    }

    df = df.copy()
    df["hour"] = df["dt"].dt.hour
    df["date_str"] = df["dt"].dt.strftime("%Y-%m-%d")

    results = {}
    for name, (start, end) in sessions.items():
        mask = (df["hour"] >= start) & (df["hour"] < end)
        sess = df[mask]
        if sess.empty:
            continue

        # 每日每个时段的 open 和 close
        daily_sess = sess.groupby("date_str").agg(
            open=("open", "first"),
            close=("close", "last"),
            high=("high", "max"),
            low=("low", "min"),
            volume=("volume", "sum"),
        )
        daily_sess["return_pct"] = (daily_sess["close"] - daily_sess["open"]) / daily_sess["open"] * 100
        daily_sess["range_pct"] = (daily_sess["high"] - daily_sess["low"]) / daily_sess["open"] * 100

        results[name] = {
            "avg_return_pct": _safe(round(daily_sess["return_pct"].mean(), 4)),
            "win_rate": _safe(round((daily_sess["return_pct"] > 0).mean() * 100, 1)),
            "avg_range_pct": _safe(round(daily_sess["range_pct"].mean(), 3)),
            "avg_volume": _safe(round(daily_sess["volume"].mean(), 0)),
            "trading_days": len(daily_sess),
        }

    return results


def weekly_summary(daily_records: list) -> list:
    """周度汇总"""
    df = pd.DataFrame(daily_records)
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date")

    weekly = df.resample("W-FRI").agg(
        open=("open", "first"),
        high=("high", "max"),
        low=("low", "min"),
        close=("close", "last"),
        volume=("volume", "sum"),
    ).dropna(subset=["close"])

    weekly["return_pct"] = (weekly["close"] - weekly["open"]) / weekly["open"] * 100

    # 找每周最佳/最差日
    records = []
    for week_end, row in weekly.iterrows():
        week_start = week_end - pd.Timedelta(days=4)
        week_days = df[(df.index >= week_start) & (df.index <= week_end)]

        best_day = worst_day = None
        if not week_days.empty and "change_pct" in week_days.columns:
            valid = week_days.dropna(subset=["change_pct"])
            if not valid.empty:
                best_day = valid["change_pct"].idxmax().strftime("%Y-%m-%d")
                worst_day = valid["change_pct"].idxmin().strftime("%Y-%m-%d")

        records.append({
            "week_ending": week_end.strftime("%Y-%m-%d"),
            "open": _safe(row["open"]),
            "high": _safe(row["high"]),
            "low": _safe(row["low"]),
            "close": _safe(row["close"]),
            "volume": _safe(row["volume"]),
            "return_pct": _safe(round(row["return_pct"], 3)),
            "trend": "up" if row["return_pct"] > 0 else "down",
            "best_day": best_day,
            "worst_day": worst_day,
        })

    return records


def run_all(s3, bucket: str) -> dict:
    """运行所有 XAU 分析，返回结果字典"""
    df = load_xau_from_s3(s3, bucket)
    if df.empty:
        return {"error": "No XAU data found in S3"}

    meta = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_range": {
            "from": df["dt"].min().strftime("%Y-%m-%d"),
            "to": df["dt"].max().strftime("%Y-%m-%d"),
        },
        "total_candles": len(df),
    }

    ds = daily_stats(df)
    vol = volatility_analysis(ds)
    sess = session_analysis(df)
    wk = weekly_summary(ds)

    return {
        "xau_daily_stats": {**meta, "results": ds},
        "xau_volatility": {**meta, "results": vol},
        "xau_sessions": {**meta, "results": sess},
        "xau_weekly": {**meta, "results": wk},
    }
