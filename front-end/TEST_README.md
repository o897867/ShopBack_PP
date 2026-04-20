# ShopBack Frontend Test Suite

## 📁 前端测试框架已搭建完成

### ✅ 已完成的工作

1. **测试依赖安装** ✓
   - vitest 1.2.1
   - @testing-library/react 14.2.1
   - @testing-library/jest-dom 6.2.0
   - @testing-library/user-event 14.5.2
   - jsdom 23.2.0
   - @vitest/ui 1.2.1
   - @vitest/coverage-v8 1.2.1

2. **测试配置** ✓
   - `vite.config.js` - 添加了Vitest配置
   - `setup-tests.js` - 测试环境设置
   - Mock window.matchMedia
   - Mock IntersectionObserver

3. **测试目录结构** ✓
   ```
   src/
   ├── __tests__/
   │   └── pages/
   │       └── News.test.jsx  # News组件测试 (6个测试用例)
   └── setup-tests.js         # 测试环境配置
   ```

4. **第一个测试套件** ✓
   - `News.test.jsx` - 6个测试用例
   - 测试覆盖：渲染、数据获取、过滤、搜索、错误处理

### 🎯 如何运行测试

#### 运行所有测试
```bash
cd /root/shopback/ShopBack_PP/front-end
npm test
```

#### 运行测试并显示UI界面
```bash
npm run test:ui
```

#### 运行测试并生成覆盖率报告
```bash
npm run test:coverage
```

#### 运行特定测试文件
```bash
npm test News.test.jsx
```

#### Watch模式（自动重新运行）
```bash
npm test -- --watch
```

### 📊 可用的测试工具

#### Testing Library
- `render()` - 渲染React组件
- `screen` - 查询DOM元素
- `waitFor()` - 等待异步操作
- `userEvent` - 模拟用户交互

#### Vitest
- `describe()` - 测试套件
- `it()` / `test()` - 单个测试
- `expect()` - 断言
- `vi.fn()` - Mock函数
- `vi.mock()` - Mock模块
- `beforeEach()` / `afterEach()` - 测试生命周期

### 📝 编写测试示例

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(<MyComponent onClick={onClick} />)

    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})
```

### 🧩 Mock示例

#### Mock API调用
```jsx
beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: 'test' })
    })
  )
})
```

#### Mock React Hook
```jsx
vi.mock('../hooks/useLanguage.jsx', () => ({
  useLanguage: () => ({
    currentLanguage: 'en',
    setLanguage: vi.fn()
  })
}))
```

### 📋 待添加的测试

#### 页面组件测试
- [ ] Health.test.jsx - 健康追踪页面
- [ ] Fortune.test.jsx - 运势页面
- [ ] HealthToken.test.jsx - 健康Token页面
- [ ] BrokerHub.test.jsx - 经纪商中心
- [ ] Home.test.jsx - 首页

#### 通用组件测试
- [ ] Navigation.test.jsx - 导航组件
- [ ] BestIndicatorToday.test.jsx - 最佳指标卡片
- [ ] Charts测试

#### Hook测试
- [ ] useLanguage.test.jsx - 语言切换hook
- [ ] useXauPrice.test.jsx - XAU价格hook

### 🔧 调试测试

```bash
# 显示详细输出
npm test -- --reporter=verbose

# 只运行失败的测试
npm test -- --reporter=verbose --bail

# 调试特定测试
npm test -- --inspect-brk News.test.jsx
```

### 📈 测试覆盖率目标

- **组件覆盖**: 60%以上
- **关键页面**: 80%以上 (News, Health, Fortune)
- **工具函数**: 90%以上

### ⚠️ 已知问题

1. **React 19兼容性** - 使用了 `--legacy-peer-deps` 安装
2. **Ant Design组件** - 可能需要额外的mock
3. **Chart.js** - 图表组件测试可能需要canvas mock

### 🚀 下一步

1. 完善News组件测试
2. 添加Health组件测试
3. 添加Fortune组件测试
4. 添加Navigation组件测试
5. 实现E2E测试（可选，使用Playwright）

---

**作者**: Claude Code
**日期**: 2025-12-29
**版本**: 1.0.0
