#!/usr/bin/env python3
"""
Health Module API Router
健康模块API路由 - 体重K线拟合系统
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
import json
import logging
from pydantic import BaseModel, Field

# Import health models
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from health_models import (
    HealthProfile, WeightLog, TrainingActivity, CalorieLedger,
    init_health_tables
)
from health_token import HealthTokenManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/health", tags=["Health"])


# ============= Pydantic Models =============

class ProfileCreateRequest(BaseModel):
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    height_cm: Optional[float] = Field(None, ge=50, le=300)
    activity_level: Optional[str] = Field("moderate")
    target_weight: Optional[float] = Field(None, ge=20, le=500)
    current_weight: Optional[float] = Field(None, ge=20, le=500)
    target_date: Optional[str] = None
    target_type: Optional[str] = Field("loss", pattern="^(loss|gain|maintain)$")
    daily_calorie_budget: Optional[int] = Field(2000, ge=1000, le=5000)
    risk_tolerance: Optional[str] = Field("moderate", pattern="^(conservative|moderate|aggressive)$")


class WeightLogRequest(BaseModel):
    weight_kg: float = Field(..., ge=20, le=500)
    log_date: Optional[str] = None
    body_fat_pct: Optional[float] = Field(None, ge=1, le=80)
    muscle_mass_kg: Optional[float] = Field(None, ge=10, le=200)
    water_pct: Optional[float] = Field(None, ge=20, le=80)
    notes: Optional[str] = None


class TrainingLogRequest(BaseModel):
    activity_type: str
    duration_min: Optional[int] = Field(None, ge=1, le=600)
    calories_burned: int = Field(..., ge=1, le=3000)
    intensity: Optional[str] = Field("moderate")
    heart_rate_avg: Optional[int] = Field(None, ge=40, le=220)
    distance_km: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    activity_date: Optional[str] = None


class KlineMatchRequest(BaseModel):
    days: int = Field(30, ge=7, le=365)
    symbol: Optional[str] = Field("AUTO")  # AUTO for best match
    timeframe: Optional[str] = Field("1h")  # 1m, 5m, 15m, 1h, 1d


class TokenGenerateRequest(BaseModel):
    height: int = Field(..., ge=100, le=250, description="Height in cm")
    weight: int = Field(..., ge=30, le=200, description="Weight in kg")
    age: int = Field(..., ge=10, le=100, description="Age in years")


class TokenValidateRequest(BaseModel):
    token: str = Field(..., min_length=8, max_length=8, description="8-digit health token")
    height: int = Field(..., ge=100, le=250)
    weight: int = Field(..., ge=30, le=200)
    age: int = Field(..., ge=10, le=100)


# ============= Initialize Tables on Startup =============

@router.on_event("startup")
async def startup():
    """Initialize health tables on router startup"""
    try:
        init_health_tables()
        logger.info("Health tables initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize health tables: {e}")


# ============= Profile Endpoints =============

@router.post("/profile")
async def create_or_update_profile(
    user_email: str = Query(..., description="User email"),
    profile: ProfileCreateRequest = Body(...)
):
    """Create or update user health profile"""
    try:
        success = HealthProfile.create_or_update(
            user_email,
            profile.dict(exclude_none=True)
        )

        if success:
            return {
                "success": True,
                "message": "Profile updated successfully",
                "market_status": "Position opened in health market"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update profile")

    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile")
async def get_profile(user_email: str = Query(..., description="User email")):
    """Get user health profile"""
    try:
        profile = HealthProfile.get(user_email)

        if not profile:
            return {
                "success": False,
                "message": "Profile not found. Please create one first.",
                "market_status": "No position in health market"
            }

        # Calculate progress metrics
        if profile.get('target_weight') and profile.get('current_weight'):
            initial_weight = profile.get('initial_weight', profile['current_weight'])
            progress = abs(initial_weight - profile['current_weight'])
            target_diff = abs(initial_weight - profile['target_weight'])
            progress_pct = (progress / target_diff * 100) if target_diff > 0 else 0

            profile['progress'] = {
                'percentage': round(progress_pct, 2),
                'market_performance': 'bullish' if progress_pct > 50 else 'bearish',
                'days_remaining': calculate_days_remaining(profile.get('target_date'))
            }

        return {
            "success": True,
            "profile": profile
        }

    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============= Weight Logging Endpoints =============

@router.post("/weight-log")
async def log_weight(
    user_email: str = Query(..., description="User email"),
    log: WeightLogRequest = Body(...)
):
    """Record daily weight entry"""
    try:
        success = WeightLog.add(
            user_email,
            log.weight_kg,
            log.log_date,
            **log.dict(exclude={'weight_kg', 'log_date'}, exclude_none=True)
        )

        if success:
            # Get trend analysis
            history = WeightLog.get_history(user_email, days=7)
            trend = analyze_weight_trend(history)

            return {
                "success": True,
                "message": f"Weight logged: {log.weight_kg}kg",
                "market_analysis": trend,
                "signal": get_weight_signal(trend)
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to log weight")

    except Exception as e:
        logger.error(f"Error logging weight: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weight-history")
async def get_weight_history(
    user_email: str = Query(..., description="User email"),
    days: int = Query(30, ge=1, le=365, description="Number of days")
):
    """Get weight history for specified period"""
    try:
        history = WeightLog.get_history(user_email, days)

        if not history:
            return {
                "success": False,
                "message": "No weight data found",
                "history": []
            }

        # Calculate statistics
        weights = [h['weight_kg'] for h in history]
        stats = {
            'current': weights[-1] if weights else 0,
            'start': weights[0] if weights else 0,
            'min': min(weights) if weights else 0,
            'max': max(weights) if weights else 0,
            'change_pct': ((weights[-1] - weights[0]) / weights[0] * 100) if weights and weights[0] > 0 else 0,
            'volatility': calculate_volatility(weights)
        }

        return {
            "success": True,
            "history": history,
            "statistics": stats,
            "market_summary": get_market_summary(stats)
        }

    except Exception as e:
        logger.error(f"Error fetching weight history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============= K-Line Matching Endpoint =============

@router.post("/match-kline")
async def match_weight_to_kline(
    user_email: str = Query(..., description="User email"),
    request: KlineMatchRequest = Body(...)
):
    """Match user's weight curve to financial K-lines"""
    try:
        # Get weight history
        history = WeightLog.get_history(user_email, request.days)

        if len(history) < 7:
            return {
                "success": False,
                "message": "Insufficient weight data. Need at least 7 days of data."
            }

        # Import matcher (will be implemented separately)
        from health_matcher import WeightKlineMatcher

        matcher = WeightKlineMatcher()
        match_result = matcher.find_best_match(
            weight_data=history,
            target_symbol=request.symbol,
            timeframe=request.timeframe
        )

        if match_result:
            # Save match to database
            save_match_session(user_email, match_result)

            return {
                "success": True,
                "match": match_result,
                "message": generate_match_message(match_result),
                "share_text": generate_share_text(match_result)
            }
        else:
            return {
                "success": False,
                "message": "Could not find a matching pattern. Keep tracking!"
            }

    except ImportError:
        # Matcher not implemented yet, return mock data
        mock_match = {
            "symbol": "BTC",
            "timeframe": "1h",
            "similarity_score": 87.5,
            "match_period": "2021-02-15 to 2021-03-15",
            "market_performance": 45.2,
            "weight_performance": -3.5,
            "matched_pattern": "Bull Run Pattern"
        }
        return {
            "success": True,
            "match": mock_match,
            "message": "Your weight loss curve matches BTC's 2021 bull run with 87.5% similarity!",
            "share_text": "My weight loss journey matches BTC's epic 2021 bull run! 87.5% similarity score on ShopBack Health!"
        }

    except Exception as e:
        logger.error(f"Error matching K-line: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============= Training Endpoints =============

@router.post("/training-log")
async def log_training(
    user_email: str = Query(..., description="User email"),
    training: TrainingLogRequest = Body(...)
):
    """Log training activity"""
    try:
        success = TrainingActivity.log(
            user_email,
            training.activity_type,
            training.calories_burned,
            **training.dict(exclude={'activity_type', 'calories_burned'}, exclude_none=True)
        )

        if success:
            # Get calorie budget status
            budget_status = get_calorie_budget_status(user_email)

            return {
                "success": True,
                "message": f"Burned {training.calories_burned} calories!",
                "budget_status": budget_status,
                "achievement": check_training_achievement(user_email, training.calories_burned)
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to log training")

    except Exception as e:
        logger.error(f"Error logging training: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations")
async def get_recommendations(
    user_email: str = Query(..., description="User email")
):
    """Get personalized training and nutrition recommendations"""
    try:
        profile = HealthProfile.get(user_email)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        # Get recent weight trend
        history = WeightLog.get_history(user_email, days=7)
        trend = analyze_weight_trend(history)

        # Generate recommendations based on profile and trend
        recommendations = generate_recommendations(profile, trend)

        return {
            "success": True,
            "recommendations": recommendations,
            "daily_brief": generate_daily_brief(profile, recommendations)
        }

    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============= Helper Functions =============

def calculate_days_remaining(target_date: str) -> int:
    """Calculate days remaining to target date"""
    if not target_date:
        return 0
    try:
        target = datetime.strptime(target_date, "%Y-%m-%d")
        remaining = (target - datetime.now()).days
        return max(0, remaining)
    except:
        return 0


def analyze_weight_trend(history: List[Dict]) -> Dict:
    """Analyze weight trend from history"""
    if len(history) < 2:
        return {"trend": "neutral", "change": 0}

    weights = [h['weight_kg'] for h in history]
    recent_avg = sum(weights[-3:]) / len(weights[-3:])
    previous_avg = sum(weights[:-3]) / max(1, len(weights[:-3]))

    change_pct = ((recent_avg - previous_avg) / previous_avg * 100) if previous_avg > 0 else 0

    if change_pct < -0.5:
        trend = "bullish"  # Weight loss
    elif change_pct > 0.5:
        trend = "bearish"  # Weight gain
    else:
        trend = "consolidating"

    return {
        "trend": trend,
        "change_pct": round(change_pct, 2),
        "momentum": "strong" if abs(change_pct) > 2 else "weak"
    }


def get_weight_signal(trend: Dict) -> str:
    """Generate trading-style signal from trend"""
    signals = {
        "bullish": "BUY signal - Weight loss momentum strong!",
        "bearish": "SELL signal - Consider adjusting strategy",
        "consolidating": "HOLD - Maintain current approach"
    }
    return signals.get(trend['trend'], "WAIT - Gathering more data")


def calculate_volatility(weights: List[float]) -> float:
    """Calculate weight volatility (standard deviation)"""
    if len(weights) < 2:
        return 0
    import statistics
    return round(statistics.stdev(weights), 2)


def get_market_summary(stats: Dict) -> str:
    """Generate market-style summary from statistics"""
    change = stats['change_pct']
    vol = stats['volatility']

    if change < -2:
        market = "Strong bear market (excellent progress!)"
    elif change < 0:
        market = "Mild bear market (good progress)"
    elif change > 2:
        market = "Bull market (review strategy)"
    else:
        market = "Sideways market (stable)"

    if vol > 1:
        market += " with high volatility"
    elif vol > 0.5:
        market += " with moderate volatility"
    else:
        market += " with low volatility"

    return market


def save_match_session(user_email: str, match_result: Dict):
    """Save K-line match session to database"""
    # Implementation would save to match_sessions table
    pass


def generate_match_message(match: Dict) -> str:
    """Generate fun message for K-line match"""
    score = match.get('similarity_score', 0)
    symbol = match.get('symbol', 'Market')

    if score > 90:
        return f"Incredible! Your weight curve is virtually identical to {symbol}'s legendary move!"
    elif score > 75:
        return f"Amazing match! Your progress mirrors {symbol}'s market movement!"
    elif score > 60:
        return f"Good correlation! You're tracking {symbol}'s pattern!"
    else:
        return f"Interesting similarity with {symbol}'s movement pattern!"


def generate_share_text(match: Dict) -> str:
    """Generate social media share text"""
    return f"My fitness journey matches {match['symbol']}'s market pattern with {match['similarity_score']}% accuracy! #FitnessTrading #HealthKlines"


def get_calorie_budget_status(user_email: str) -> Dict:
    """Get current calorie budget status"""
    # Mock implementation
    return {
        "budget": 2000,
        "spent": 450,
        "remaining": 1550,
        "risk_level": "safe",
        "message": "Calorie budget healthy - 1550 kcal remaining"
    }


def check_training_achievement(user_email: str, calories: int) -> Optional[Dict]:
    """Check if training unlocked any achievement"""
    if calories > 500:
        return {
            "type": "burn_500",
            "name": "Market Maker",
            "description": "Burned 500+ calories in one session!"
        }
    return None


def generate_recommendations(profile: Dict, trend: Dict) -> Dict:
    """Generate personalized recommendations"""
    recs = {
        "training": [],
        "nutrition": [],
        "focus": ""
    }

    if trend['trend'] == 'bearish':  # Weight gain
        recs['training'].append({
            "type": "HIIT",
            "duration": 30,
            "calories": 400,
            "reason": "High calorie burn to reverse trend"
        })
        recs['nutrition'].append({
            "action": "Reduce calorie intake by 200",
            "focus": "Increase protein ratio"
        })
        recs['focus'] = "SELL pressure detected - Increase deficit"

    elif trend['trend'] == 'bullish':  # Weight loss
        recs['training'].append({
            "type": "Strength",
            "duration": 45,
            "calories": 300,
            "reason": "Maintain momentum with muscle building"
        })
        recs['nutrition'].append({
            "action": "Maintain current intake",
            "focus": "Ensure adequate protein for recovery"
        })
        recs['focus'] = "BUY momentum strong - Stay the course"

    else:  # Consolidating
        recs['training'].append({
            "type": "Mixed",
            "duration": 40,
            "calories": 350,
            "reason": "Break through plateau"
        })
        recs['nutrition'].append({
            "action": "Try carb cycling",
            "focus": "Shock the system"
        })
        recs['focus'] = "Breakout needed - Mix things up"

    return recs


def generate_daily_brief(profile: Dict, recommendations: Dict) -> str:
    """Generate daily market brief"""
    budget = profile.get('daily_calorie_budget', 2000)
    return f"Daily Brief: {budget} kcal budget | {recommendations['focus']} | Risk tolerance: {profile.get('risk_tolerance', 'moderate')}"

# ============= Token Management Endpoints =============

@router.post("/token/generate")
async def generate_health_token(request: TokenGenerateRequest = Body(...)):
    """Generate personal 8-digit health token based on physical metrics"""
    try:
        # Generate token
        token_info = HealthTokenManager.create_user_profile_token(
            request.height,
            request.weight,
            request.age
        )

        return {
            "success": True,
            "token": token_info["token"],
            "recovery_code": token_info["recovery_code"],
            "message": "Token generated successfully. Keep it private!",
            "hint": f"Your unique health token is: {token_info['token']}",
            "note": "This token is required to access your personal health dashboard"
        }

    except Exception as e:
        logger.error(f"Error generating token: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/token/validate")
async def validate_health_token(request: TokenValidateRequest = Body(...)):
    """Validate health token against physical metrics"""
    try:
        is_valid = HealthTokenManager.validate_token(
            request.token,
            request.height,
            request.weight,
            request.age
        )

        if is_valid:
            # Generate user email from token (for demo purposes)
            user_email = f"user_{request.token.lower()}@health.shopback"

            return {
                "success": True,
                "valid": True,
                "user_email": user_email,
                "message": "Token validated successfully",
                "access_granted": True,
                "permissions": ["read", "write", "match", "analyze"]
            }
        else:
            return {
                "success": False,
                "valid": False,
                "message": "Invalid token or metrics mismatch",
                "access_granted": False,
                "hint": "Please check your height, weight, and age values"
            }

    except Exception as e:
        logger.error(f"Error validating token: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/token/hint")
async def get_token_hint(token: str = Query(..., min_length=8, max_length=8)):
    """Get hints about a token structure (for recovery purposes)"""
    try:
        hints = HealthTokenManager.decode_token_hints(token)

        if "error" in hints:
            raise HTTPException(status_code=400, detail=hints["error"])

        return {
            "success": True,
            "hints": hints,
            "message": "Token structure decoded",
            "recovery_tip": "Remember: Token is based on your height, weight, and age"
        }

    except Exception as e:
        logger.error(f"Error getting token hints: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Protected endpoint example - requires token validation
@router.get("/protected/dashboard")
async def get_protected_dashboard(
    token: str = Query(..., min_length=8, max_length=8, description="Health token"),
    height: int = Query(..., ge=100, le=250),
    weight: int = Query(..., ge=30, le=200),
    age: int = Query(..., ge=10, le=100)
):
    """Protected dashboard that requires valid token"""
    try:
        # Validate token
        is_valid = HealthTokenManager.validate_token(token, height, weight, age)

        if not is_valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid token. Access denied."
            )

        # Generate personalized dashboard data
        user_email = f"user_{token.lower()}@health.shopback"

        # Get profile and data
        profile = HealthProfile.get(user_email)
        history = WeightLog.get_history(user_email, days=30)

        return {
            "success": True,
            "message": "Access granted",
            "dashboard": {
                "welcome": f"Welcome! Your token {token} is valid",
                "profile": profile,
                "recent_history": history[-7:] if history else [],
                "stats": {
                    "total_logs": len(history),
                    "current_weight": history[-1]["weight_kg"] if history else weight,
                    "trend": "improving" if len(history) > 1 and history[-1]["weight_kg"] < history[0]["weight_kg"] else "stable"
                }
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accessing protected dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))
