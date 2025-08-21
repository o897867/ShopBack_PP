import numpy as np
from filterpy.kalman import KalmanFilter
import json
from datetime import datetime
from typing import Dict, List, Optional

class HalfLifeLLT:
    def __init__(self, half_life_candles=5, c_level=1.0, c_trend=0.1, r0_mult=0.1):
        self.dt = 1.0  # 一根3m为一个步长
        self.set_half_life(half_life_candles)
        self.c_level, self.c_trend, self.r0_mult = c_level, c_trend, r0_mult

        self.kf = KalmanFilter(dim_x=2, dim_z=1)
        self.kf.F = np.array([[1., self.dt],
                              [0., 1. ]], dtype=float)
        self.kf.H = np.array([[1., 0. ]], dtype=float)
        self.kf.x = np.zeros((2,1))                     # [level, trend]
        self.kf.P = np.diag([1e2, 1e0]).astype(float)   # 初始协方差：level大、trend中等
        self.kf.Q = np.diag([1e-6, 1e-7])               # 将在每步自适应覆盖
        self.kf.R = np.array([[1e-4]], dtype=float)

        # 近端统计用于自适应
        self.ewm_alpha = 1 - 0.5**(1/half_life_candles)  # 与半衰期一致的EWM
        self._ewm_var_r = 1e-6
        self._ewm_vol = 1.0

    def set_half_life(self, H):
        self.half_life = H
        self.delta = 0.5 ** (1.0 / H)   # 折扣因子 0<δ<1
        self.ewm_alpha = 1 - 0.5**(1/H)

    def initialize_from_history(self, times, prices_log):
        # 半衰期加权线性回归估计 level/trend
        n = len(prices_log)
        w = self.delta ** np.arange(n)[::-1]    # 近期权重大
        t = np.arange(n)
        W = np.diag(w)
        X = np.column_stack([np.ones(n), t])
        beta = np.linalg.pinv(X.T @ W @ X) @ (X.T @ W @ prices_log.reshape(-1,1))
        self.kf.x = beta.astype(float)          # [level, trend]
        # 初始P给大一点，方便快速自适应
        self.kf.P = np.diag([10.0, 1.0])

    def _adapt_QR(self, r_3m, volume):
        # r_3m：当前3m对数收益; volume：当前成交量
        # 1) EWM 的收益方差
        self._ewm_var_r = (1 - self.ewm_alpha)*self._ewm_var_r + self.ewm_alpha*(r_3m**2)
        sigma2 = max(self._ewm_var_r, 1e-10)

        # 2) Q：按收益方差设尺度
        q_level = self.c_level * sigma2
        q_trend = self.c_trend * sigma2
        self.kf.Q = np.diag([q_level, q_trend])

        # 3) R：随成交量缩放（体量大 → R 小）
        self._ewm_vol = (1 - self.ewm_alpha)*self._ewm_vol + self.ewm_alpha*max(volume, 1.0)
        vol_factor = 1.0 / np.sqrt(1.0 + volume / max(self._ewm_vol, 1e-6))
        self.kf.R[0,0] = self.r0_mult * sigma2 * vol_factor + 1e-12

    def update_with_candle(self, close_price, prev_close_price, volume):
        """
        输入收盘价(线性空间)，内部用log。prev_close用于计算3m对数收益。
        返回：(y_hat_price, std_log, lo_price, hi_price) —— 单步(下一根)预测信息
        """
        y = np.log(close_price)
        r = np.log(close_price/prev_close_price)

        # 折扣：放大先验不确定度（等价于更大的Q）
        self.kf.P = self.kf.P / self.delta

        # 自适应Q/R
        self._adapt_QR(r, volume)

        # 预测 → 更新
        self.kf.predict()
        self.kf.update(np.array([[y]]))

        # 下一步(one-step-ahead)预测（对数）
        x_pred = self.kf.F @ self.kf.x
        y_pred = float((self.kf.H @ x_pred).ravel())

        # 预测方差
        P_pred = self.kf.F @ self.kf.P @ self.kf.F.T + self.kf.Q
        S = float(self.kf.H @ P_pred @ self.kf.H.T + self.kf.R)

        # 转回价格并给CI（68%/95%）
        std = np.sqrt(S)
        y_lo_68, y_hi_68 = y_pred - std,     y_pred + std
        y_lo_95, y_hi_95 = y_pred - 1.96*std, y_pred + 1.96*std

        return {
            "y_hat": np.exp(y_pred),
            "pi68": (np.exp(y_lo_68), np.exp(y_hi_68)),
            "pi95": (np.exp(y_lo_95), np.exp(y_hi_95)),
            "y_log_std": std
        }

    def predict_horizon_minutes(self, minutes):
        n = int(round(minutes/3))
        F_pow = np.linalg.matrix_power(self.kf.F, n)
        x_h = F_pow @ self.kf.x
        y_log = float((self.kf.H @ x_h).ravel())

        # 协方差推进
        Pn = self.kf.P.copy()
        Fi = np.eye(2)
        Qsum = np.zeros((2,2))
        for _ in range(n):
            Qsum = self.kf.F @ Qsum @ self.kf.F.T + self.kf.Q
        Pn = F_pow @ self.kf.P @ F_pow.T + Qsum
        S = float(self.kf.H @ Pn @ self.kf.H.T + self.kf.R)

        std = np.sqrt(S)
        return {
            "y_hat": np.exp(y_log),
            "pi68": (np.exp(y_log-std), np.exp(y_log+std)),
            "pi95": (np.exp(y_log-1.96*std), np.exp(y_log+1.96*std)),
            "steps": n
        }

    def get_state(self) -> Dict:
        """Get current model state for persistence"""
        return {
            "level": float(self.kf.x[0, 0]),
            "trend": float(self.kf.x[1, 0]),
            "P": self.kf.P.tolist(),
            "ewm_var_r": self._ewm_var_r,
            "ewm_vol": self._ewm_vol,
            "half_life": self.half_life,
            "timestamp": datetime.now().isoformat()
        }

    def set_state(self, state: Dict):
        """Restore model state from persistence"""
        self.kf.x[0, 0] = state["level"]
        self.kf.x[1, 0] = state["trend"]
        self.kf.P = np.array(state["P"])
        self._ewm_var_r = state["ewm_var_r"]
        self._ewm_vol = state["ewm_vol"]
        if "half_life" in state:
            self.set_half_life(state["half_life"])


class ETHKalmanModelManager:
    """Manages the ETH Kalman filter model with database persistence"""
    
    def __init__(self, db_path: str = "shopback_data.db"):
        self.db_path = db_path
        self.model = HalfLifeLLT(half_life_candles=5)
        self.last_candle = None
        self.prediction_horizons = [3, 6, 9, 15, 30, 60]  # minutes
        
    def initialize_from_candles(self, candles: List[Dict]):
        """Initialize model from historical 3-minute candles"""
        if not candles:
            return
            
        # Extract times and log prices
        times = np.arange(len(candles))
        prices = np.array([c["close"] for c in candles])
        prices_log = np.log(prices)
        
        # Initialize model
        self.model.initialize_from_history(times, prices_log)
        
        # Store last candle for next update
        self.last_candle = candles[-1]
        
    def update_with_new_candle(self, candle: Dict) -> Dict:
        """Update model with new 3-minute candle and return predictions"""
        if self.last_candle is None:
            self.last_candle = candle
            return {}
            
        # Update model
        result = self.model.update_with_candle(
            close_price=candle["close"],
            prev_close_price=self.last_candle["close"],
            volume=candle["volume"]
        )
        
        # Generate multi-horizon predictions
        predictions = {
            "current": {
                "price": candle["close"],
                "timestamp": candle["timestamp"]
            },
            "next_candle": result,
            "horizons": {}
        }
        
        for horizon in self.prediction_horizons:
            predictions["horizons"][f"{horizon}m"] = self.model.predict_horizon_minutes(horizon)
            
        # Update last candle
        self.last_candle = candle
        
        # Save state
        self.save_state()
        
        return predictions
        
    def save_state(self):
        """Save model state to database"""
        import sqlite3
        state = self.model.get_state()
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS eth_kalman_states (
                    timestamp TEXT PRIMARY KEY,
                    state_json TEXT
                )
            """)
            
            conn.execute("""
                INSERT OR REPLACE INTO eth_kalman_states (timestamp, state_json)
                VALUES (?, ?)
            """, (state["timestamp"], json.dumps(state)))
            
    def load_state(self) -> bool:
        """Load most recent model state from database"""
        import sqlite3
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT state_json FROM eth_kalman_states
                    ORDER BY timestamp DESC LIMIT 1
                """)
                row = cursor.fetchone()
                
                if row:
                    state = json.loads(row[0])
                    self.model.set_state(state)
                    return True
        except Exception as e:
            print(f"Failed to load state: {e}")
            
        return False
        
    def get_model_metrics(self) -> Dict:
        """Get current model metrics for monitoring"""
        state = self.model.get_state()
        return {
            "level": state["level"],
            "trend": state["trend"] * 180,  # Convert to per-hour
            "volatility": np.sqrt(self.model._ewm_var_r),
            "half_life_minutes": self.model.half_life * 3,
            "ewm_volume": self.model._ewm_vol,
            "covariance_trace": np.trace(self.model.kf.P)
        }