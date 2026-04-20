#!/usr/bin/env python3
"""
每日出金汇率管理
提供查看和更新每日出金汇率的功能
"""

import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Header
from pydantic import BaseModel
from typing import Optional
from database import get_db_connection

logger = logging.getLogger(__name__)

router = APIRouter()

# 隐藏的更新密钥 (建议使用环境变量，这里简化处理)
SECRET_UPDATE_KEY = "wd2026secret"


class WithdrawalRateUpdate(BaseModel):
    """出金汇率更新模型"""
    rate: float
    currency: str = "USD"
    notes: Optional[str] = None


@router.get("/withdrawal-rate", summary="获取当前出金汇率")
async def get_withdrawal_rate():
    """获取当前有效的出金汇率"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 查询最新的出金汇率
        cursor.execute("""
            SELECT rate, currency, notes, effective_date, created_at
            FROM withdrawal_rates
            ORDER BY effective_date DESC, created_at DESC
            LIMIT 1
        """)

        row = cursor.fetchone()
        conn.close()

        if not row:
            return {
                "rate": None,
                "currency": "USD",
                "notes": "暂无汇率数据",
                "effective_date": None,
                "last_updated": None
            }

        return {
            "rate": row[0],
            "currency": row[1],
            "notes": row[2],
            "effective_date": row[3],
            "last_updated": row[4]
        }

    except Exception as e:
        logger.error(f"获取出金汇率失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/withdrawal-rate/history", summary="获取出金汇率历史")
async def get_withdrawal_rate_history(limit: int = Query(30, le=100)):
    """获取历史出金汇率记录"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT rate, currency, notes, effective_date, created_at
            FROM withdrawal_rates
            ORDER BY effective_date DESC, created_at DESC
            LIMIT ?
        """, (limit,))

        rows = cursor.fetchall()
        conn.close()

        history = []
        for row in rows:
            history.append({
                "rate": row[0],
                "currency": row[1],
                "notes": row[2],
                "effective_date": row[3],
                "created_at": row[4]
            })

        return {
            "count": len(history),
            "history": history
        }

    except Exception as e:
        logger.error(f"获取出金汇率历史失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/withdrawal-rate/update", summary="更新出金汇率 (需要密钥)")
async def update_withdrawal_rate(
    data: WithdrawalRateUpdate,
    x_update_key: str = Header(None, alias="X-Update-Key")
):
    """
    更新出金汇率 (隐藏接口，需要密钥)

    Headers:
        X-Update-Key: 更新密钥

    Body:
        rate: 汇率值
        currency: 货币代码 (默认 USD)
        notes: 备注 (可选)
    """
    # 验证密钥
    if x_update_key != SECRET_UPDATE_KEY:
        raise HTTPException(status_code=403, detail="无效的更新密钥")

    # 验证汇率值
    if data.rate <= 0:
        raise HTTPException(status_code=400, detail="汇率必须大于0")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 插入新的汇率记录
        cursor.execute("""
            INSERT INTO withdrawal_rates (rate, currency, notes, effective_date)
            VALUES (?, ?, ?, ?)
        """, (
            data.rate,
            data.currency,
            data.notes,
            datetime.now().strftime("%Y-%m-%d")
        ))

        conn.commit()
        rate_id = cursor.lastrowid
        conn.close()

        logger.info(f"出金汇率已更新: {data.rate} {data.currency}")

        return {
            "success": True,
            "message": "汇率更新成功",
            "data": {
                "id": rate_id,
                "rate": data.rate,
                "currency": data.currency,
                "notes": data.notes,
                "effective_date": datetime.now().strftime("%Y-%m-%d")
            }
        }

    except Exception as e:
        logger.error(f"更新出金汇率失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/withdrawal-rate/{rate_id}", summary="删除汇率记录 (需要密钥)")
async def delete_withdrawal_rate(
    rate_id: int,
    x_update_key: str = Header(None, alias="X-Update-Key")
):
    """删除指定的汇率记录 (隐藏接口，需要密钥)"""
    # 验证密钥
    if x_update_key != SECRET_UPDATE_KEY:
        raise HTTPException(status_code=403, detail="无效的更新密钥")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM withdrawal_rates WHERE id = ?", (rate_id,))
        conn.commit()

        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="汇率记录不存在")

        conn.close()

        return {
            "success": True,
            "message": f"汇率记录 {rate_id} 已删除"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除汇率记录失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
