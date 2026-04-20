"""
玄学分析API路由
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
import sys
import os
import json
import logging
import asyncio
from datetime import datetime

# 添加父目录到路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fortune_teller import FortuneTeller
from database import get_db_connection
from openai import OpenAI

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/fortune", tags=["fortune"])

class FortuneRequest(BaseModel):
    """占卜请求模型"""
    number: int = Field(..., ge=1, le=999999, description="幸运数字(1-999999)")
    include_market: bool = Field(default=True, description="是否包含市场技术指标")

class FortuneResponse(BaseModel):
    """占卜响应模型"""
    success: bool
    data: Dict[str, Any]
    message: str = ""


# 初始化玄学分析器
fortune_teller = FortuneTeller()
FORTUNE_TABLE = "daily_fortunes"


def _ensure_daily_table():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {FORTUNE_TABLE} (
          date_key TEXT PRIMARY KEY,
          payload TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def _get_cached_fortune(date_key: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(f"SELECT payload FROM {FORTUNE_TABLE} WHERE date_key = ?", (date_key,))
    row = cur.fetchone()
    conn.close()
    if row and row[0]:
        try:
            return json.loads(row[0])
        except json.JSONDecodeError:
            return None
    return None


def _save_fortune(date_key: str, payload: Dict[str, Any]):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        f"INSERT OR REPLACE INTO {FORTUNE_TABLE} (date_key, payload) VALUES (?, ?)",
        (date_key, json.dumps(payload, ensure_ascii=False))
    )
    conn.commit()
    conn.close()


def _build_prompt(date_key: str) -> str:
    return f"""请以东方玄学/风水口吻，为交易者生成当日占卜。
日期: {date_key}
请仅用 JSON 返回，键包括：
- tier_level: lucky/balanced/cautious 三选一
- tier_label: 短中文
- verdict: 一句当日解卦
- qi_index: 60-95 的整数
- qi_label: 2-4 字的气场名
- qi_tip: 一句提示
- amulet_label: 护符名
- amulet_tip: 护符含义
- ritual: 今日宜
- taboo: 今日忌
- direction: 招财方位（如 正东/东南/正北/正西 等）
- note: 额外一句暖心提示
要求：简洁，交易隐喻，避免迷信词汇过多。"""


def _generate_daily_fortune_via_openai(date_key: str) -> Dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY 未配置，无法生成每日占卜")
    model = os.getenv("OPENAI_FORTUNE_MODEL", "gpt-4o-mini")
    client = OpenAI(api_key=api_key)
    prompt = _build_prompt(date_key)
    try:
        resp = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "你是交易者的风水顾问，用俏皮但稳重的语气写当日卦象。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
        )
        content = resp.choices[0].message.content
        parsed = json.loads(content)
        parsed["generated_by"] = "chatgpt"
        parsed["date_key"] = date_key
        return parsed
    except Exception as e:
        logger.error(f"OpenAI 每日占卜生成失败: {e}")
        raise HTTPException(status_code=502, detail="生成每日占卜失败")


@router.get("/daily", response_model=FortuneResponse)
async def get_daily_fortune():
    """
    获取当日 ChatGPT 生成的玄学择时（每天0点后更新）
    """
    _ensure_daily_table()
    today_key = datetime.now().strftime("%Y-%m-%d")

    cached = _get_cached_fortune(today_key)
    if cached:
        return FortuneResponse(success=True, data=cached, message="cached")

    loop = asyncio.get_event_loop()
    fresh = await loop.run_in_executor(None, lambda: _generate_daily_fortune_via_openai(today_key))
    _save_fortune(today_key, fresh)
    return FortuneResponse(success=True, data=fresh, message="generated")


@router.post("/divine", response_model=FortuneResponse)
async def divine_fortune(request: FortuneRequest):
    """
    进行玄学占卜分析

    输入一个数字，获得今日运势、黄道吉日、方位、市场八卦等全方位分析
    """
    try:
        # 获取市场技术指标（如果需要）
        market_indicators = None
        if request.include_market:
            try:
                # 简化的市场指标模拟（实际可以从数据库或API获取）
                import random
                market_indicators = {
                    'rsi': random.randint(30, 70),
                    'macd': random.uniform(-0.5, 0.5)
                }
            except:
                # 如果获取失败，继续使用纯玄学分析
                pass

        # 进行占卜
        result = fortune_teller.divine(request.number, market_indicators)

        return FortuneResponse(
            success=True,
            data=result
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/lucky-number", response_model=FortuneResponse)
async def get_lucky_number():
    """
    获取今日幸运数字

    基于当前时间和市场状态生成今日推荐幸运数字
    """
    try:
        import random
        from datetime import datetime

        # 基于日期生成种子
        today = datetime.now()
        seed = int(today.strftime("%Y%m%d"))
        random.seed(seed)

        # 生成幸运数字
        lucky_number = random.randint(1, 999)

        # 对幸运数字进行占卜
        result = fortune_teller.divine(lucky_number)

        # 添加推荐理由
        result['recommended_number'] = lucky_number
        result['recommendation_reason'] = "今日天机所指，此数大吉"

        return FortuneResponse(
            success=True,
            data=result
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quick-divine", response_model=FortuneResponse)
async def quick_divine(
    number: int = Query(..., ge=1, le=999999, description="幸运数字(1-999999)")
):
    """
    快速占卜（GET请求版本）

    适合快速查询，返回精简版结果
    """
    try:
        # 进行占卜
        full_result = fortune_teller.divine(number)

        # 精简结果
        quick_result = {
            "number": number,
            "score": full_result["fortune_score"],
            "verdict": full_result["overall_verdict"],
            "suggestion": full_result["overall_suggestion"],
            "hexagram": full_result["hexagram"]["name"],
            "lucky_hours": full_result["lucky_hours"][:2],  # 只返回前两个时段
            "lucky_color": full_result["lucky_items"]["幸运颜色"],
            "market_bagua": full_result["market_bagua"]["操作建议"],
            "poem": full_result["fortune_poem"]
        }

        return FortuneResponse(
            success=True,
            data=quick_result,
            message="快速占卜完成"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/lunar-calendar")
async def get_lunar_calendar():
    """
    获取今日农历和黄道吉日信息
    """
    try:
        # 创建新的分析器实例获取今日信息
        teller = FortuneTeller()
        lunar_info = teller._analyze_lunar_fortune()

        # 添加额外的农历信息
        lunar_date = teller.lunar_date
        lunar_info.update({
            "solar_date": teller.today.strftime("%Y年%m月%d日"),
            "lunar_year": lunar_date.year,
            "lunar_month": lunar_date.month,
            "lunar_day": lunar_date.day,
            "weekday": ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"][teller.today.weekday()]
        })

        return FortuneResponse(
            success=True,
            data=lunar_info
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/batch-divine")
async def batch_divine(
    numbers: str = Query(..., description="逗号分隔的数字列表，如: 888,666,123")
):
    """
    批量占卜分析

    一次性分析多个数字，用于对比选择
    """
    try:
        # 解析数字列表
        number_list = [int(n.strip()) for n in numbers.split(",")]

        if len(number_list) > 5:
            raise ValueError("最多支持5个数字批量占卜")

        # 批量占卜
        results = []
        for num in number_list:
            result = fortune_teller.divine(num)
            # 精简结果用于对比
            results.append({
                "number": num,
                "score": result["fortune_score"],
                "verdict": result["overall_verdict"],
                "hexagram": result["hexagram"]["name"],
                "suggestion": result["market_bagua"]["操作建议"]
            })

        # 排序并推荐
        results.sort(key=lambda x: x["score"], reverse=True)

        return FortuneResponse(
            success=True,
            data={
                "results": results,
                "best_choice": results[0]["number"],
                "recommendation": f"建议选择 {results[0]['number']}，运势最佳"
            }
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
