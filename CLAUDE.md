# Weekly Mindmap Module

这是一个周报思维导图模块，嵌入在现有项目中，独立路由独立数据库表，不与现有业务耦合。

## 项目目标

把某位金融博主的每周周报结构化，生成思维导图，让读者能看到：
1. 单期周报的结构（小标题 → 悬停看详情）
2. 跨周的主题演化（同一个议题在不同时间点的观点变化）
3. 不同主题间的隐性关联（相似逻辑、因果、对照）

## 技术栈

- 后端：FastAPI + SQLAlchemy + SQLite（文件位于 `backend/data/weekly.db`）
- 前端：React + Vite + TypeScript + React Flow（@xyflow/react）
- 部署：已有 AWS EC2，本模块作为现有项目的子模块

**不包含 AI 集成**。内容结构化工作在系统外完成（用户每周另开 Claude 对话生成 JSON，然后粘贴导入）。后端本身不调用任何 LLM API。

## 模块隔离原则

- 后端：所有代码在 `backend/weekly/` 下，路由前缀统一 `/api/weekly`，数据表前缀统一 `weekly_`
- 前端：所有代码在 `frontend/src/weekly/` 下，路由前缀 `/weekly-mindmap`
- 不修改现有项目的任何代码，除了 `main.py`（挂载路由）和 `App.tsx`（注册路由）

## 数据模型

四个实体（完整字段见 `backend/weekly/models.py`）：

1. **Report（周报）**：一期周报的元信息，包含原文全文
2. **Node（节点）**：思维导图上的一个气泡，对应周报里的一个小标题
3. **Link（关联）**：节点之间的连线，四种类型：
   - `evolution`：同议题前后判断（如黄金 4.12 加仓 → 4.19 验证）
   - `causation`：上周事件导致本周结果
   - `contrast`：相似框架的不同案例
   - `resonance`：不同主题共享底层逻辑
4. **Tag（主题标签）**：横跨所有周报的主题分类，支持父子层级

## 核心工作流（外部生成 + 导入）

用户的每周操作流程：

1. 用户开一个新的 Claude 对话（使用项目里的 `WEEKLY_CHAT_TEMPLATE.md` 作为开场）
2. 贴周报原文给 Claude，Claude 按约定的 JSON schema 输出结构化内容（含节点和关联建议）
3. 用户复制整段 JSON
4. 用户登录本站的管理页 `/weekly-mindmap/admin/import`，粘贴 JSON 到输入框
5. 前端调 `POST /api/weekly/import`，后端校验后一次性写入 Report + Nodes + Links

关键设计：**系统本身不做 AI 调用**。所有"AI 结构化 + 关联建议"都发生在用户与 Claude 的独立对话里。后端只接收已经结构化好的 JSON 并入库。

## 前端视图

三个主视图：

1. **时间线视图**（`/weekly-mindmap`）：左右分栏，每列一期周报。默认展示最近两期，可向右滚动加载更多历史。跨周 Link 用虚线。这是首页。
2. **主题视图**（`/weekly-mindmap/topics/:slug`）：某个 tag 下所有节点按时间排序，看主题演化
3. **关系图视图**（`/weekly-mindmap/graph`）：所有节点铺在一张大画布，按 tag 自动聚类

管理视图（需鉴权）：

- `/weekly-mindmap/admin/import`：粘贴 JSON 导入一期周报（含预览与校验）
- `/weekly-mindmap/admin/edit/:reportId`：已导入周报的编辑界面（改标题、改 tag、增删 Link）

## 视觉规范

- 节点配色用 9 个 ramp：c-amber（黄金/资源）、c-blue（政策/政治）、c-teal（流动性/货币）、c-purple（能源）、c-coral（估值/风险）、c-pink（周期）、c-gray（中性）、c-green、c-red
- 每种颜色有 light/dark 两个 stop，分别是背景 50 + 边框 600 + 文字 800
- 节点圆角 8px，边框 0.5px
- 连线样式按 Link.type 区分：evolution 实线 / causation 实线+箭头 / contrast 虚线 / resonance 点线

## 重要约束

1. **系统不调用任何外部 AI API**。不要引入 `anthropic`、`openai` 等 SDK，不要加 `ANTHROPIC_API_KEY` 之类的环境变量
2. **SQLite 写入时只有单连接**。SQLAlchemy 配置必须包含 `connect_args={"check_same_thread": False}`，但不要启用连接池并发写入
3. **鉴权用简单 Bearer Token**。在 `.env` 里存 `WEEKLY_ADMIN_TOKEN`，请求头带 `Authorization: Bearer <token>` 即放行。不要引入完整的用户系统
4. **SQLite 文件加入 .gitignore**。同时在 `backend/data/.gitkeep` 保持目录结构
5. **节点 body_markdown 最长 10000 字符**，超过报 422
6. **Link 的 from_node 和 to_node 必须属于不同的 Report**。同一期周报内的节点关联不是这个系统的目标
7. **Import 端点必须幂等**。同一份 JSON 导入两次应该产生一次写入（通过 report_id 判断是否已存在，已存在时走更新路径，或者返回 409 冲突由前端决定覆盖）

## Import 端点规格

`POST /api/weekly/import` 接收的 JSON 结构：

```json
{
  "report": {
    "id": "2026-04-19",
    "date": "2026.4.19",
    "title": "2026.4.19 周总结",
    "author": "郝有道理",
    "source_url": "...",
    "cover_image": "...",
    "raw_content": "..."
  },
  "nodes": [
    {
      "id": "node-419-reflection",
      "order": 1,
      "title": "每个人都应该做的一次反思",
      "subtitle": "流动性折价 = 天花板",
      "summary": "...",
      "body_markdown": "...",
      "key_points": ["...", "..."],
      "tags": ["gold", "liquidity"],
      "color": "c-amber"
    }
  ],
  "links": [
    {
      "from_node_id": "node-412-gold",
      "to_node_id": "node-419-reflection",
      "type": "evolution",
      "label": "4700 加仓 → 4800 验证",
      "strength": 3,
      "reasoning": "上周的止盈判断在本周得到市场验证"
    }
  ],
  "new_tags": [
    {
      "slug": "liquidity",
      "name": "流动性",
      "color": "c-teal",
      "description": "全球流动性周期与货币政策"
    }
  ]
}
```

校验规则：
- `report.id` 格式必须为 `YYYY-MM-DD`
- 所有 `node.id` 必须唯一，且以 `node-` 开头
- `link.from_node_id` 和 `link.to_node_id` 必须存在（在本次导入的 nodes 里，或者数据库已有）
- `link.type` 必须是四种枚举之一
- `node.color` 必须是预定义的 9 个 ramp 之一
- `new_tags` 里的 slug 不能与数据库已有冲突

校验失败时返回 422，成功时返回 200 + 写入的 Report 详情。

## 测试要求

- 每个 CRUD 函数至少一个 pytest 单测
- Import 端点必须覆盖：成功路径、JSON 格式错误、引用了不存在的 Node、重复 id 冲突
- 前端关键组件（MindmapCanvas、HoverPanel、ImportForm）至少有基础渲染测试

## 实施阶段

**第一期：只读展示**
- 建表 + 种子数据脚本（两期周报）
- 读接口全部打通
- 时间线视图 + 悬停卡片 + 跨周连线
- 能部署上线

**第二期：JSON 导入**
- Import 端点 + JSON 校验
- 管理页粘贴 JSON + 预览 + 确认导入
- Bearer Token 鉴权

**第三期：多视图与编辑**
- 主题视图 + 关系图视图
- 已导入周报的编辑界面（改节点、增删 Link）

当前阶段：**第一期**。专注把读路径跑通。
