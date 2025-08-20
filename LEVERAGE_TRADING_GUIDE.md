# 杠杆交易功能使用指南

## 功能概述

已成功集成杠杆交易计算功能，包括：

1. **强制平仓计算** - 计算何时触发40%保证金强制平仓
2. **盈亏分析** - 实时计算不同价格下的盈亏情况
3. **止损计算** - 根据最大可接受亏损计算止损价格
4. **风险级别** - 显示不同亏损比例对应的价格水平
5. **历史记录** - 保存所有交易和分析记录

## 技术架构

### 后端组件
- `leverage_trading.py` - 核心计算引擎
- `fapi.py` - FastAPI接口 (新增6个API端点)
- `shopback_data.db` - SQLite数据库 (新增3个表)

### 前端组件
- `LeverageCalculator.jsx` - 主要UI组件
- `LeverageCalculator.css` - 样式文件
- `trading.jsx` - 集成到交易页面

### 数据库表
- `leverage_positions` - 持仓记录
- `leverage_trade_history` - 交易历史
- `leverage_analysis` - 分析记录

## 启动应用

### 1. 启动后端服务
```bash
cd back-end
python3 fapi.py
```
服务将在 http://localhost:8001 运行

### 2. 启动前端应用
```bash
cd front-end
npm install  # 首次运行需要
npm run dev
```
应用将在 http://localhost:5173 运行

## API接口说明

### 1. 计算杠杆分析
**POST** `/api/leverage/calculate`
```json
{
  "symbol": "BTCUSDT",
  "direction": "long",
  "principal": 1000,
  "leverage": 10,
  "entry_price": 50000,
  "current_price": 51000
}
```

### 2. 计算止损价格
**POST** `/api/leverage/target-loss`
```json
{
  "symbol": "BTCUSDT",
  "direction": "long",
  "principal": 1000,
  "leverage": 10,
  "entry_price": 50000,
  "max_loss_amount": 200
}
```

### 3. 创建持仓
**POST** `/api/leverage/position`

### 4. 获取持仓列表
**GET** `/api/leverage/positions/{user_email}`

### 5. 平仓
**PUT** `/api/leverage/position/{position_id}/close`

### 6. 获取交易历史
**GET** `/api/leverage/history/{user_email}`

## 使用示例

### 场景1: 计算强制平仓价格
1. 输入本金: 1000 USDT
2. 选择杠杆: 10倍
3. 输入入场价格: 50000 USDT
4. 点击"计算分析"
5. 查看强制平仓价格: 47000 USDT (下跌6%触发)

### 场景2: 设置止损
1. 切换到"止损计算"标签
2. 输入最大可接受亏损: 200 USDT
3. 点击"计算止损价格"
4. 查看建议止损价: 49000 USDT

## 风险提示

⚠️ **重要提醒**：
- 杠杆交易风险极高，可能导致全部本金损失
- 强制平仓线设为40%保证金比例
- 建议使用止损单控制风险
- 本工具仅供计算参考，不构成投资建议

## 测试功能

运行测试脚本验证计算准确性：
```bash
cd back-end
python3 test_leverage.py
```

## 故障排除

### 问题1: API连接失败
- 检查后端服务是否运行在8001端口
- 确认CORS设置正确

### 问题2: 数据库错误
- 运行 `python3 add_leverage_tables.py` 重建表结构
- 检查 `shopback_data.db` 文件权限

### 问题3: 前端组件不显示
- 清除浏览器缓存
- 检查控制台错误信息
- 确认所有依赖已安装

## 后续优化建议

1. 添加实时价格更新
2. 集成交易所API执行真实交易
3. 添加图表可视化
4. 实现止盈止损自动触发
5. 添加多币种组合分析
6. 实现风险预警通知