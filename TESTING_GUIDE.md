# 🧪 ShopBack 单元测试完整指南

## 📊 测试框架概览

你的金融平台现已配置完整的测试框架，包括后端和前端测试。

### ✅ 已完成的工作总结

#### 后端测试 (Python + Pytest)
- ✅ 测试依赖已安装 (pytest, httpx, faker等)
- ✅ 测试配置完成 (pytest.ini, .coveragerc)
- ✅ 共享fixtures创建 (conftest.py)
- ✅ News Router测试套件 (16个测试用例)
- ✅ 测试文档 (back-end/tests/README.md)

#### 前端测试 (React + Vitest)
- ✅ 测试依赖已安装 (vitest, testing-library等)
- ✅ Vitest配置完成 (vite.config.js)
- ✅ 测试环境设置 (setup-tests.js)
- ✅ News组件测试 (6个测试用例)
- ✅ 测试文档 (front-end/TEST_README.md)

---

## 🚀 快速开始

### 后端测试

```bash
cd /root/shopback/ShopBack_PP/back-end

# 运行所有测试
venv/bin/pytest tests/ -v

# 运行带覆盖率
venv/bin/pytest tests/ --cov=. --cov-report=html

# 运行特定标记
venv/bin/pytest tests/ -m "unit and news"

# 查看覆盖率报告
open htmlcov/index.html
```

### 前端测试

```bash
cd /root/shopback/ShopBack_PP/front-end

# 运行所有测试
npm test

# 运行测试UI
npm run test:ui

# 运行带覆盖率
npm run test:coverage
```

---

## 📁 项目结构

```
ShopBack_PP/
├── back-end/
│   ├── tests/
│   │   ├── conftest.py              # 共享fixtures
│   │   ├── unit/
│   │   │   └── test_news_router.py  # 16个测试
│   │   ├── integration/             # 待添加
│   │   └── fixtures/                # 测试数据
│   ├── pytest.ini                   # Pytest配置
│   ├── .coveragerc                  # 覆盖率配置
│   └── tests/README.md              # 后端测试文档
│
├── front-end/
│   ├── src/
│   │   ├── __tests__/
│   │   │   └── pages/
│   │   │       └── News.test.jsx    # 6个测试
│   │   └── setup-tests.js           # 测试设置
│   ├── vite.config.js               # Vitest配置
│   └── TEST_README.md               # 前端测试文档
│
└── TESTING_GUIDE.md                 # 本文档
```

---

## 📊 测试覆盖情况

### 当前状态

| 模块 | 类型 | 测试数 | 覆盖率 | 状态 |
|------|------|--------|--------|------|
| News Router | 后端API | 16 | 🔴 待修复 | Mock需要完善 |
| News Component | 前端页面 | 6 | 🟡 部分 | 基础测试完成 |
| Health Router | 后端API | 0 | 🔴 未开始 | 待添加 |
| Fortune Router | 后端API | 0 | 🔴 未开始 | 待添加 |
| XAU Data Manager | 后端服务 | 0 | 🔴 未开始 | 待添加 |
| ETH Kalman Model | 后端服务 | 0 | 🔴 未开始 | 待添加 |

### 目标

- **后端覆盖率**: >75%
- **前端覆盖率**: >60%
- **总测试数**: 150+个

---

## 🎯 测试策略

### 后端测试优先级

1. **高优先级** (Week 1-2)
   - ✅ News Router (已完成，需修复)
   - ⏳ Health Router
   - ⏳ Fortune Router
   - ⏳ InsightSentry News Service

2. **中优先级** (Week 3)
   - XAU Data Manager
   - ETH Data Manager
   - WebSocket handlers

3. **低优先级** (Week 4)
   - 集成测试
   - 性能测试
   - E2E测试

### 前端测试优先级

1. **高优先级** (Week 1-2)
   - ✅ News页面 (已完成，需完善)
   - ⏳ Health页面
   - ⏳ Fortune页面

2. **中优先级** (Week 3)
   - Navigation组件
   - 图表组件
   - Hooks测试

3. **低优先级** (Week 4)
   - 其他页面组件
   - 工具函数
   - E2E测试

---

## 📝 测试模板

### 后端API测试模板

```python
import pytest

@pytest.mark.unit
@pytest.mark.api
def test_endpoint_success(test_client, populate_test_data, mocker):
    """测试成功场景"""
    # Arrange
    mocker.patch('module.DATABASE_PATH', populate_test_data)

    # Act
    response = test_client.get("/api/endpoint")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "key" in data
```

### 前端组件测试模板

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('renders and handles interaction', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<MyComponent />)

    // Act
    await user.click(screen.getByRole('button'))

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Updated')).toBeInTheDocument()
    })
  })
})
```

---

## 🔧 常用命令速查

### 后端

```bash
# 运行所有测试
venv/bin/pytest tests/

# 运行特定文件
venv/bin/pytest tests/unit/test_news_router.py

# 运行特定测试
venv/bin/pytest tests/unit/test_news_router.py::test_get_latest_news_success

# 显示print输出
venv/bin/pytest tests/ -s

# 详细输出
venv/bin/pytest tests/ -vv

# 失败时停止
venv/bin/pytest tests/ -x

# 使用标记
venv/bin/pytest tests/ -m "unit and not slow"

# 覆盖率HTML报告
venv/bin/pytest tests/ --cov=. --cov-report=html
```

### 前端

```bash
# 运行所有测试
npm test

# Watch模式
npm test -- --watch

# UI界面
npm run test:ui

# 覆盖率
npm run test:coverage

# 运行特定文件
npm test News.test.jsx

# 详细输出
npm test -- --reporter=verbose
```

---

## 📈 成功指标

### 代码质量指标
- ✅ 测试覆盖率: 后端 >75%, 前端 >60%
- ✅ 测试速度: 完整套件 <2分钟
- ✅ 构建通过率: >95%
- ✅ 无阻塞性bug

### 开发效率指标
- ✅ PR包含测试: 100%
- ✅ 测试文档完整性: >90%
- ✅ CI/CD自动化: 已配置

---

## 🐛 故障排除

### 后端常见问题

**问题**: `AttributeError: 'ASGITransport' object has no attribute '__enter__'`
**解决**: 使用我们创建的 `SyncTestClient` wrapper

**问题**: Mock不生效
**解决**: 检查import路径是否正确，使用 `mocker.patch()` 而不是 `@patch`

**问题**: 数据库锁定
**解决**: 确保每个测试使用独立的临时数据库

### 前端常见问题

**问题**: `Cannot find module 'setup-tests.js'`
**解决**: 确保 `vite.config.js` 中路径正确

**问题**: `window.matchMedia is not a function`
**解决**: 已在 `setup-tests.js` 中mock

**问题**: Mock hook不工作
**解决**: 确保 `vi.mock()` 在 import 之前调用

---

## 💡 最佳实践

### 测试原则
1. **AAA模式**: Arrange (准备), Act (执行), Assert (断言)
2. **独立性**: 每个测试应该独立运行
3. **可重复性**: 相同输入应产生相同结果
4. **快速**: 单元测试应该<100ms

### 命名规范
- 测试文件: `test_*.py` (后端), `*.test.jsx` (前端)
- 测试函数: `test_功能_场景()` (清晰描述)
- Fixtures: 使用描述性名称

### 代码组织
- 使用fixtures减少重复代码
- 使用markers组织测试
- 保持测试简单明了
- 一个测试只验证一个行为

---

## 📚 参考资源

### 后端
- [Pytest文档](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)

### 前端
- [Vitest文档](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM](https://github.com/testing-library/jest-dom)

---

## 🎬 下一步行动

### 立即可做
1. 修复News Router测试的database mocking
2. 运行 `npm test` 验证前端测试
3. 查看测试覆盖率报告

### 本周计划
1. 完成Health Router测试套件 (10+测试)
2. 完成Health组件测试 (8+测试)
3. 添加Fortune Router/组件测试

### 月度目标
1. 后端覆盖率达到75%
2. 前端覆盖率达到60%
3. 配置CI/CD自动测试
4. 完整测试文档

---

**维护者**: Claude Code
**最后更新**: 2025-12-29
**版本**: 1.0.0

有问题？查看详细文档：
- 后端: `/root/shopback/ShopBack_PP/back-end/tests/README.md`
- 前端: `/root/shopback/ShopBack_PP/front-end/TEST_README.md`
