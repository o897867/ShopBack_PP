# ShopBack Backend Test Suite

## 📁 测试框架已搭建完成

### ✅ 已完成的工作

1. **测试依赖安装** ✓
   - pytest 9.0.2
   - pytest-asyncio 1.3.0
   - pytest-cov 7.0.0
   - httpx 0.27.0
   - faker 39.0.0
   - pytest-mock 3.15.1
   - pytest-timeout 2.4.0

2. **测试框架配置** ✓
   - `pytest.ini` - 完整的pytest配置
   - `.coveragerc` - 代码覆盖率配置
   - `conftest.py` - 共享fixtures和测试工具

3. **测试目录结构** ✓
   ```
   tests/
   ├── conftest.py          # 共享fixtures
   ├── unit/                # 单元测试
   │   └── test_news_router.py  # News Router测试 (16个测试用例)
   ├── integration/         # 集成测试 (待添加)
   └── fixtures/            # 测试数据 (待添加)
   ```

4. **第一个测试套件** ✓
   - `test_news_router.py` - 16个测试用例
   - 测试覆盖：API端点、过滤、分页、参数验证、WebSocket

### 🎯 如何运行测试

#### 运行所有测试
```bash
cd /root/shopback/ShopBack_PP/back-end
venv/bin/pytest tests/
```

#### 运行特定测试文件
```bash
venv/bin/pytest tests/unit/test_news_router.py -v
```

#### 运行特定测试
```bash
venv/bin/pytest tests/unit/test_news_router.py::test_get_latest_news_success -v
```

#### 运行带覆盖率报告
```bash
venv/bin/pytest tests/ --cov=. --cov-report=html
# 查看报告: open htmlcov/index.html
```

#### 使用测试标记
```bash
# 只运行单元测试
venv/bin/pytest tests/ -m unit

# 只运行API测试
venv/bin/pytest tests/ -m api

# 只运行新闻模块测试
venv/bin/pytest tests/ -m news

# 排除慢测试
venv/bin/pytest tests/ -m "not slow"
```

### 📊 可用的测试标记

- `unit` - 单元测试（快速，隔离）
- `integration` - 集成测试（较慢，需要服务）
- `slow` - 慢测试（>1秒）
- `websocket` - WebSocket测试
- `database` - 数据库测试
- `api` - API端点测试
- `news` - 新闻模块测试
- `health` - 健康模块测试
- `fortune` - 运势模块测试

### 🧩 可用的Fixtures

#### 数据库Fixtures
- `test_db_path` - 临时数据库路径
- `test_db` - 初始化的测试数据库
- `populate_test_news` - 填充测试新闻数据

#### 客户端Fixtures
- `test_client` - 同步HTTP测试客户端
- `async_client` - 异步HTTP测试客户端

#### 测试数据Fixtures
- `sample_news_item` - 单条新闻样本
- `sample_news_with_summary` - 带摘要的新闻
- `sample_news_batch` - 20条新闻批量数据
- `sample_health_token_data` - 健康Token数据
- `mock_openai_response` - Mock OpenAI响应
- `mock_insightsentry_ws_message` - Mock WebSocket消息

### ⚠️ 当前状态

测试框架已经搭建完成并可以运行，但需要进一步完善：

1. **修复现有测试** - News Router测试需要正确的database mock
2. **添加更多测试**
   - Health Router (健康模块)
   - Fortune Router (运势模块)
   - InsightSentry News Service
   - XAU Data Manager
   - ETH Kalman Model

3. **集成测试** - 完整流程测试
4. **性能测试** - API响应时间、并发测试

### 📝 编写新测试示例

```python
import pytest

@pytest.mark.unit
@pytest.mark.api
def test_my_endpoint(test_client):
    """测试我的端点"""
    response = test_client.get("/api/my-endpoint")

    assert response.status_code == 200
    assert "data" in response.json()
```

### 🔧 调试测试

```bash
# 显示print输出
venv/bin/pytest tests/ -s

# 详细输出
venv/bin/pytest tests/ -vv

# 只运行第一个失败的测试
venv/bin/pytest tests/ -x

# 进入调试器
venv/bin/pytest tests/ --pdb
```

### 📈 下一步

1. 修复 News Router 测试中的database mocking
2. 添加 Health Router 测试套件
3. 添加 Fortune Router 测试套件
4. 实现集成测试
5. 配置CI/CD自动测试

---

**作者**: Claude Code
**日期**: 2025-12-29
**版本**: 1.0.0
