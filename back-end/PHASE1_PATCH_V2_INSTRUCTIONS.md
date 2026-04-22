# 第一期补丁 V2 · 关联可视化重构

**背景**：补丁 V1（指令 9-13）跑完后，跨周关联在 timeline 上太密集导致不可视。这次重构改为"默认隐藏关联，按需点亮"的策略。

**前置条件**：补丁 V1 必须已经跑通——7 期周报 + 33 节点 + 24 关联已入库且能看到。

按顺序执行 14 → 15 → 16 → 17 → 18。中间不要跳步。

---

## 指令 14：后端新增 `/api/weekly/links/index` 端点

为了避免前端在每次悬停时都重新计算"哪个节点关联了哪些 link"，后端提供一个聚合端点，前端启动时一次拉取并缓存。

### 14.1 在 `backend/weekly/schemas.py` 新增

```python
from typing import Dict, List

class LinkIndexResponse(BaseModel):
    """节点关联的预聚合索引，前端启动时拉取一次。"""
    node_link_count: Dict[str, int]
    """node_id → 该节点参与的关联总数（出度+入度）"""
    
    node_to_links: Dict[str, List[str]]
    """node_id → 该节点参与的所有 link_id 列表"""
    
    links_by_id: Dict[str, "LinkDetail"]
    """link_id → LinkDetail 对象，扁平化存储"""
```

注意 `LinkDetail` 的前向引用——如果 `LinkDetail` 在文件靠下方定义，可以用 `LinkIndexResponse.model_rebuild()` 在文件末尾解决前向引用，或者把 `LinkIndexResponse` 移到 `LinkDetail` 之后。

### 14.2 在 `backend/weekly/crud.py` 新增

```python
def get_link_index(db: Session) -> dict:
    """聚合所有 link，返回前端可直接消费的索引结构。"""
    all_links = db.query(Link).all()
    
    node_link_count: dict[str, int] = {}
    node_to_links: dict[str, list[str]] = {}
    links_by_id: dict[str, Link] = {}
    
    for link in all_links:
        links_by_id[link.id] = link
        
        # 出度
        node_link_count[link.from_node_id] = node_link_count.get(link.from_node_id, 0) + 1
        node_to_links.setdefault(link.from_node_id, []).append(link.id)
        
        # 入度
        node_link_count[link.to_node_id] = node_link_count.get(link.to_node_id, 0) + 1
        node_to_links.setdefault(link.to_node_id, []).append(link.id)
    
    return {
        "node_link_count": node_link_count,
        "node_to_links": node_to_links,
        "links_by_id": links_by_id,
    }
```

### 14.3 在 `backend/weekly/router.py` 新增端点

```python
@router.get("/links/index", response_model=schemas.LinkIndexResponse)
def link_index(db: Session = Depends(get_db)):
    return crud.get_link_index(db)
```

### 14.4 验证

启动后端，访问 `http://localhost:8000/api/weekly/links/index`，应返回类似：

```json
{
  "node_link_count": {
    "node-419-reflection": 4,
    "node-412-gold-add": 2,
    ...
  },
  "node_to_links": {
    "node-419-reflection": ["link-e05", "link-r01", "link-r03", "link-r05"],
    ...
  },
  "links_by_id": {
    "link-e05": { "id": "link-e05", "from_node_id": "...", ... }
  }
}
```

`node_link_count` 的总和应该等于 `len(links_by_id) * 2`（每条 link 贡献 from 和 to 各一次）。在浏览器开发工具里手算验证一下。

---

## 指令 15：前端状态管理 + 类型增强

### 15.1 安装 zustand

如果 `package.json` 已有 zustand 跳过这步：

```bash
cd frontend && npm install zustand
```

### 15.2 在 `frontend/src/weekly/types.ts` 新增类型

```typescript
export interface LinkIndexResponse {
  node_link_count: Record<string, number>;
  node_to_links: Record<string, string[]>;
  links_by_id: Record<string, Link>;
}
```

### 15.3 在 `frontend/src/weekly/api/weeklyApi.ts` 新增方法

```typescript
async getLinkIndex(): Promise<LinkIndexResponse> {
  const res = await fetch(`${BASE}/api/weekly/links/index`);
  if (!res.ok) throw new Error(`Failed to fetch link index: ${res.status}`);
  return res.json();
}
```

### 15.4 创建 `frontend/src/weekly/store/timelineStore.ts`

```typescript
import { create } from 'zustand';
import type { LinkType, LinkIndexResponse } from '../types';

interface TimelineState {
  // ===== 服务器数据缓存 =====
  linkIndex: LinkIndexResponse | null;
  
  // ===== UI 交互状态 =====
  hoveredNodeId: string | null;
  focusedNodeId: string | null;       // 点击进入的"焦点模式"，悬停其他节点不影响
  hoveredLinkId: string | null;       // 鼠标悬停在某条线上时
  visibleTypes: Set<LinkType>;         // 默认 4 种全选
  showAllLinks: boolean;               // 默认 false
  
  // ===== Actions =====
  setLinkIndex: (idx: LinkIndexResponse) => void;
  setHovered: (id: string | null) => void;
  setFocused: (id: string | null) => void;
  setHoveredLink: (id: string | null) => void;
  toggleType: (type: LinkType) => void;
  toggleShowAll: () => void;
  clearFocus: () => void;
}

const ALL_TYPES: LinkType[] = ['evolution', 'causation', 'contrast', 'resonance'];

export const useTimelineStore = create<TimelineState>((set) => ({
  linkIndex: null,
  hoveredNodeId: null,
  focusedNodeId: null,
  hoveredLinkId: null,
  visibleTypes: new Set(ALL_TYPES),
  showAllLinks: false,
  
  setLinkIndex: (idx) => set({ linkIndex: idx }),
  setHovered: (id) => set({ hoveredNodeId: id }),
  setFocused: (id) => set({ focusedNodeId: id }),
  setHoveredLink: (id) => set({ hoveredLinkId: id }),
  toggleType: (type) => set((s) => {
    const next = new Set(s.visibleTypes);
    next.has(type) ? next.delete(type) : next.add(type);
    return { visibleTypes: next };
  }),
  toggleShowAll: () => set((s) => ({ showAllLinks: !s.showAllLinks })),
  clearFocus: () => set({ focusedNodeId: null, hoveredNodeId: null }),
}));
```

### 15.5 创建一个 selector 模块 `frontend/src/weekly/store/selectors.ts`

把推导逻辑抽出来，便于测试：

```typescript
import type { LinkType, Link } from '../types';

export interface VisibilityInputs {
  hoveredNodeId: string | null;
  focusedNodeId: string | null;
  showAllLinks: boolean;
  visibleTypes: Set<LinkType>;
  nodeToLinks: Record<string, string[]>;
  linksById: Record<string, Link>;
}

/**
 * 决定哪些 link 当前应被渲染。
 * 优先级：focused > hovered > showAll > 默认（无）
 */
export function getVisibleLinkIds(inputs: VisibilityInputs): Set<string> {
  const { hoveredNodeId, focusedNodeId, showAllLinks, visibleTypes, nodeToLinks, linksById } = inputs;
  
  const activeNode = focusedNodeId || hoveredNodeId;
  
  if (activeNode) {
    const ids = nodeToLinks[activeNode] || [];
    // 即使在 active 模式，也尊重类型筛选
    return new Set(ids.filter((id) => {
      const link = linksById[id];
      return link && visibleTypes.has(link.type);
    }));
  }
  
  if (showAllLinks) {
    return new Set(
      Object.values(linksById)
        .filter((l) => visibleTypes.has(l.type))
        .map((l) => l.id)
    );
  }
  
  return new Set();
}

/**
 * 决定某节点的 opacity。
 * 没有 active 时：全部 1。
 * 有 active 时：自身 + 直接相邻节点 = 1，其他 = 0.25。
 */
export function getNodeOpacity(
  nodeId: string,
  inputs: VisibilityInputs,
): number {
  const activeNode = inputs.focusedNodeId || inputs.hoveredNodeId;
  if (!activeNode) return 1;
  if (nodeId === activeNode) return 1;
  
  const activeLinkIds = inputs.nodeToLinks[activeNode] || [];
  const neighbors = new Set<string>();
  for (const linkId of activeLinkIds) {
    const link = inputs.linksById[linkId];
    if (!link) continue;
    if (link.from_node_id === activeNode) neighbors.add(link.to_node_id);
    if (link.to_node_id === activeNode) neighbors.add(link.from_node_id);
  }
  
  return neighbors.has(nodeId) ? 1 : 0.25;
}

/**
 * 节点的视觉状态：active / neighbor / dimmed / normal
 * 用于决定边框、光晕等装饰。
 */
export type NodeVisualState = 'active' | 'neighbor' | 'dimmed' | 'normal';

export function getNodeVisualState(
  nodeId: string,
  inputs: VisibilityInputs,
): NodeVisualState {
  const activeNode = inputs.focusedNodeId || inputs.hoveredNodeId;
  if (!activeNode) return 'normal';
  if (nodeId === activeNode) return 'active';
  
  const activeLinkIds = inputs.nodeToLinks[activeNode] || [];
  for (const linkId of activeLinkIds) {
    const link = inputs.linksById[linkId];
    if (!link) continue;
    if (link.from_node_id === nodeId || link.to_node_id === nodeId) return 'neighbor';
  }
  
  return 'dimmed';
}
```

### 15.6 在 TimelineView 启动时拉取 link index

在 `TimelineView.tsx` 顶部加一个 effect：

```typescript
import { useEffect } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { weeklyApi } from '../api/weeklyApi';

// 组件内：
const setLinkIndex = useTimelineStore((s) => s.setLinkIndex);

useEffect(() => {
  weeklyApi.getLinkIndex().then(setLinkIndex).catch(console.error);
}, [setLinkIndex]);
```

加完这一步，刷新页面，开发工具的 Network 里应该能看到一次 `/api/weekly/links/index` 调用。

---

## 指令 16：NodeCard 角标 + 视觉状态

### 16.1 给 NodeCard 加 props

`frontend/src/weekly/components/NodeCard.tsx` 增加两个 prop：

```typescript
interface NodeCardProps {
  node: Node;
  visualState: NodeVisualState;  // 'active' | 'neighbor' | 'dimmed' | 'normal'
  linkCount: number;             // 来自 linkIndex.node_link_count[node.id] || 0
  onHover: (id: string | null) => void;
  onClick: () => void;
}
```

不要在 NodeCard 内部直接读 store——保持它是个纯展示组件，便于以后复用。

### 16.2 角标渲染

在 NodeCard 的右上角（与标题同一行的右侧）渲染：

```tsx
{linkCount > 0 && (
  <span className={`link-count-badge ${linkCount >= 4 ? 'is-hub' : ''}`}>
    {linkCount}
  </span>
)}
```

样式（写在同一文件的 inline style 或独立 CSS module 都行）：

```css
.link-count-badge {
  font-size: 10px;
  line-height: 1;
  padding: 2px 6px;
  background: var(--color-background-secondary);
  color: var(--color-text-secondary);
  border-radius: 999px;
  flex-shrink: 0;
  /* 不要加 border，避免视觉噪音 */
}

.link-count-badge.is-hub {
  background: var(--color-background-info);
  color: var(--color-text-info);
}
```

`is-hub` 表示\"枢纽节点\"——4 条以上关联的节点。在我们当前数据里，`node-419-reflection`（4 条）就是。

### 16.3 视觉状态样式

NodeCard 的最外层 div 根据 `visualState` 应用不同样式：

```typescript
function getCardStyle(state: NodeVisualState, color: ColorClass): CSSProperties {
  const base: CSSProperties = {
    background: 'var(--color-background-primary)',
    border: '0.5px solid var(--color-border-tertiary)',
    borderRadius: 'var(--border-radius-md)',
    padding: '10px 12px',
    cursor: 'pointer',
    transition: 'opacity 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
  };
  
  switch (state) {
    case 'active':
      return {
        ...base,
        // 背景换成对应颜色的 50 stop（淡色填充）
        background: `var(--c-${getColorName(color)}-50)`,
        border: `1.5px solid var(--c-${getColorName(color)}-600)`,
        boxShadow: `0 0 0 3px var(--c-${getColorName(color)}-50)`,
        opacity: 1,
      };
    case 'neighbor':
      return {
        ...base,
        background: `var(--c-${getColorName(color)}-50)`,
        border: `1px solid var(--c-${getColorName(color)}-400)`,
        opacity: 1,
      };
    case 'dimmed':
      return { ...base, opacity: 0.25 };
    case 'normal':
    default:
      return { ...base, opacity: 1 };
  }
}
```

注意 color 的 CSS 变量需要事先在全局 CSS 里定义。如果还没定义，在 `frontend/src/weekly/styles/colors.css` 加：

```css
:root {
  --c-amber-50: #FAEEDA;  --c-amber-400: #BA7517;  --c-amber-600: #854F0B;
  --c-blue-50: #E6F1FB;   --c-blue-400: #378ADD;   --c-blue-600: #185FA5;
  --c-teal-50: #E1F5EE;   --c-teal-400: #1D9E75;   --c-teal-600: #0F6E56;
  --c-purple-50: #EEEDFE; --c-purple-400: #7F77DD; --c-purple-600: #534AB7;
  --c-coral-50: #FAECE7;  --c-coral-400: #D85A30;  --c-coral-600: #993C1D;
  --c-pink-50: #FBEAF0;   --c-pink-400: #D4537E;   --c-pink-600: #993556;
  --c-gray-50: #F1EFE8;   --c-gray-400: #888780;   --c-gray-600: #5F5E5A;
  --c-green-50: #EAF3DE;  --c-green-400: #639922;  --c-green-600: #3B6D11;
  --c-red-50: #FCEBEB;    --c-red-400: #E24B4A;    --c-red-600: #A32D2D;
}
```

然后在 `App.tsx` 或入口的 CSS 里 `@import` 这个文件。

`getColorName` 是一个简单工具函数：`'c-amber'` → `'amber'`：

```typescript
function getColorName(color: ColorClass): string {
  return color.replace('c-', '');
}
```

### 16.4 ReportColumn 集成

在 `ReportColumn.tsx` 里渲染 NodeCard 时，从 store 取出当前状态并计算 visualState：

```typescript
const { hoveredNodeId, focusedNodeId, visibleTypes, showAllLinks, linkIndex } = useTimelineStore();
const setHovered = useTimelineStore((s) => s.setHovered);
const setFocused = useTimelineStore((s) => s.setFocused);
const navigate = useNavigate();

if (!linkIndex) return <ReportColumnSkeleton />;

const inputs: VisibilityInputs = {
  hoveredNodeId, focusedNodeId, showAllLinks, visibleTypes,
  nodeToLinks: linkIndex.node_to_links,
  linksById: linkIndex.links_by_id,
};

return (
  <div className="report-column">
    {/* 列头 */}
    {report.nodes.map((node) => (
      <NodeCard
        key={node.id}
        node={node}
        visualState={getNodeVisualState(node.id, inputs)}
        linkCount={linkIndex.node_link_count[node.id] || 0}
        onHover={setHovered}
        onClick={() => {
          // 单击进入焦点模式；如果已经是焦点，则跳转详情页
          if (focusedNodeId === node.id) {
            navigate(`/weekly-mindmap/nodes/${node.id}`);
          } else {
            setFocused(node.id);
          }
        }}
      />
    ))}
  </div>
);
```

### 16.5 焦点模式的退出

在 `TimelineView.tsx` 的最外层容器加一个 click 监听——点击空白处退出焦点：

```typescript
const clearFocus = useTimelineStore((s) => s.clearFocus);

return (
  <div 
    className="timeline-view"
    onClick={(e) => {
      // 只有点击的是容器自身（不是节点）才退出
      if (e.target === e.currentTarget) clearFocus();
    }}
  >
    {/* ... */}
  </div>
);
```

也可以加键盘 ESC 退出，但不强求。

### 16.6 验证

跑起来打开 `/weekly-mindmap`：

1. 默认所有节点正常显示，每个节点右上角有数字 badge
2. `node-419-reflection`（"每个人都应该做的反思"）的 badge 应该是浅蓝色（数字 4）
3. 鼠标悬停某节点 → 该节点高亮、相关节点保持正常、其他节点淡化到 25%
4. 单击节点 → 进入焦点模式（即便鼠标移开也保持高亮）
5. 再次单击同一节点 → 跳转到详情页
6. 单击空白 → 退出焦点模式

**重要**：这一步连线还没改造，所以你看到的连线仍然是补丁 V1 那种全部画出来的状态。下一步处理。

---

## 指令 17：LinkLayer 重写

`LinkLayer.tsx` 是这次重构最复杂的部分。完全重写它的渲染逻辑。

### 17.1 整体结构

```typescript
import { useMemo } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { getVisibleLinkIds, type VisibilityInputs } from '../store/selectors';

export function LinkLayer({ nodeRefs }: { nodeRefs: Map<string, HTMLElement> }) {
  const {
    linkIndex,
    hoveredNodeId,
    focusedNodeId,
    hoveredLinkId,
    visibleTypes,
    showAllLinks,
    setHoveredLink,
  } = useTimelineStore();
  
  if (!linkIndex) return null;
  
  const inputs: VisibilityInputs = {
    hoveredNodeId, focusedNodeId, showAllLinks, visibleTypes,
    nodeToLinks: linkIndex.node_to_links,
    linksById: linkIndex.links_by_id,
  };
  
  const visibleIds = useMemo(() => getVisibleLinkIds(inputs), [
    hoveredNodeId, focusedNodeId, showAllLinks, visibleTypes, linkIndex,
  ]);
  
  // 关键：当 active node 存在时，自动展示 label；否则只展示 hovered link 的 label
  const activeNode = focusedNodeId || hoveredNodeId;
  const showLabelsForAll = !!activeNode;
  
  return (
    <svg className="link-layer" /* 略：定位、覆盖整个 timeline */>
      <defs>
        {/* 4 种类型的箭头 marker */}
        <marker id="arrow-causation" viewBox="0 0 10 10" refX="9" refY="5" 
                markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/>
        </marker>
      </defs>
      
      {Array.from(visibleIds).map((linkId) => {
        const link = linkIndex.links_by_id[linkId];
        return (
          <LinkPath
            key={linkId}
            link={link}
            nodeRefs={nodeRefs}
            isHovered={hoveredLinkId === linkId}
            showLabel={showLabelsForAll || hoveredLinkId === linkId}
            onMouseEnter={() => setHoveredLink(linkId)}
            onMouseLeave={() => setHoveredLink(null)}
          />
        );
      })}
    </svg>
  );
}
```

### 17.2 LinkPath 子组件

```typescript
interface LinkPathProps {
  link: Link;
  nodeRefs: Map<string, HTMLElement>;
  isHovered: boolean;
  showLabel: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function LinkPath({ link, nodeRefs, isHovered, showLabel, onMouseEnter, onMouseLeave }: LinkPathProps) {
  const fromEl = nodeRefs.get(link.from_node_id);
  const toEl = nodeRefs.get(link.to_node_id);
  
  // 如果某端节点不在视图里（被滚动出去），不渲染这条线
  if (!fromEl || !toEl) return null;
  
  const path = computePath(fromEl, toEl);
  const labelPos = computeLabelPosition(fromEl, toEl);
  
  const style = getLinkStyle(link.type, link.strength, isHovered);
  
  return (
    <g 
      onMouseEnter={onMouseEnter} 
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      {/* 透明加粗的 hit area，方便鼠标命中 */}
      <path d={path} stroke="transparent" strokeWidth="12" fill="none" />
      
      {/* 实际可见的线 */}
      <path
        d={path}
        stroke={style.color}
        strokeWidth={style.width}
        strokeDasharray={style.dasharray}
        fill="none"
        opacity={style.opacity}
        markerEnd={link.type === 'causation' ? 'url(#arrow-causation)' : undefined}
      />
      
      {/* label */}
      {showLabel && link.label && (
        <text
          x={labelPos.x}
          y={labelPos.y}
          fontSize="10"
          fill={style.color}
          textAnchor="middle"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {link.label}
        </text>
      )}
    </g>
  );
}
```

### 17.3 样式与几何工具函数

```typescript
function getLinkStyle(type: LinkType, strength: number, isHovered: boolean) {
  // 基础颜色按类型
  const colorMap: Record<LinkType, string> = {
    evolution: '#185FA5',  // blue 600
    causation: '#993C1D',  // coral 600
    contrast: '#5F5E5A',   // gray 600
    resonance: '#534AB7',  // purple 600
  };
  
  // 虚实
  const dasharrayMap: Record<LinkType, string | undefined> = {
    evolution: undefined,
    causation: undefined,
    contrast: '6,4',
    resonance: '2,3',
  };
  
  // 透明度按 strength
  const opacityMap: Record<number, number> = { 1: 0.35, 2: 0.5, 3: 0.7 };
  const baseOpacity = opacityMap[strength] || 0.5;
  
  return {
    color: colorMap[type],
    width: isHovered ? 2 : 1.5,
    dasharray: dasharrayMap[type],
    opacity: isHovered ? 1 : baseOpacity,
  };
}

function computePath(from: HTMLElement, to: HTMLElement): string {
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();
  const container = from.closest('.timeline-view')!;
  const containerRect = container.getBoundingClientRect();
  
  // 起点：from 节点的右边中点
  const x1 = fromRect.right - containerRect.left;
  const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
  
  // 终点：to 节点的左边中点（注意：因为时间从右到左，from 通常在 to 的右边）
  // 这里假设 from 在 to 的右边或左边都可能。重新算：
  const fromCenter = fromRect.left + fromRect.width / 2 - containerRect.left;
  const toCenter = toRect.left + toRect.width / 2 - containerRect.left;
  
  let startX, endX;
  if (fromCenter > toCenter) {
    // from 在 to 右边
    startX = fromRect.left - containerRect.left;
    endX = toRect.right - containerRect.left;
  } else {
    startX = fromRect.right - containerRect.left;
    endX = toRect.left - containerRect.left;
  }
  
  const startY = fromRect.top + fromRect.height / 2 - containerRect.top;
  const endY = toRect.top + toRect.height / 2 - containerRect.top;
  
  // 二次贝塞尔，控制点在中间略微偏上
  const midX = (startX + endX) / 2;
  const midY = Math.min(startY, endY) - 20;
  
  return `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
}

function computeLabelPosition(from: HTMLElement, to: HTMLElement): { x: number; y: number } {
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();
  const container = from.closest('.timeline-view')!;
  const containerRect = container.getBoundingClientRect();
  
  const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
  const toX = toRect.left + toRect.width / 2 - containerRect.left;
  const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
  const toY = toRect.top + toRect.height / 2 - containerRect.top;
  
  // label 放在路径中点上方一点
  return {
    x: (fromX + toX) / 2,
    y: Math.min(fromY, toY) - 25,
  };
}
```

### 17.4 nodeRefs 的传递

`TimelineView` 维护一个 `Map<string, HTMLElement>`，把每个 NodeCard 的 DOM ref 注册进来：

```typescript
const nodeRefs = useRef(new Map<string, HTMLElement>());

const registerNodeRef = useCallback((id: string, el: HTMLElement | null) => {
  if (el) nodeRefs.current.set(id, el);
  else nodeRefs.current.delete(id);
}, []);
```

NodeCard 接收 `registerRef` prop 并在自己的根 div 上调用：

```typescript
<div ref={(el) => props.registerRef?.(node.id, el)} /* ... */>
```

### 17.5 重新计算的触发

LinkLayer 内部需要在窗口 resize、滚动时重算 path。最简单的做法是用 `useState` + 一个 `version` 计数器，在以下事件里 `setVersion(v => v + 1)`：

- `window.addEventListener('resize', ...)`
- timeline 容器的 `scroll`
- `linkIndex` 变化
- `hoveredNodeId` / `focusedNodeId` 变化

或者更直接——用 `requestAnimationFrame` 节流地每帧重算（仅当有可见 link 时）。第一种更省，第二种更稳。**先用第一种，性能不行再切**。

### 17.6 验证清单

打开 `/weekly-mindmap`：

1. **默认状态**：完全没有连线
2. **悬停某节点**：相关连线出现，并显示 label；其他节点淡化
3. **悬停 `node-419-reflection`**：应该出现 4 条线（1 evolution + 3 resonance）
4. **悬停某条线**：该线变粗、变深，label 始终显示
5. **类型筛选**（指令 18 之后）：取消勾选某类型，相关线消失
6. **窗口 resize**：连线跟随节点移动，不脱节
7. **滚动 timeline**：连线跟随节点滚动

如果连线在某些情况下"飞"到错误位置——通常是 `getBoundingClientRect()` 的容器选错了。检查 `closest('.timeline-view')` 是否能正确找到 SVG 的定位父级。

---

## 指令 18：顶部工具栏 + 类型筛选

### 18.1 创建 `frontend/src/weekly/components/TimelineToolbar.tsx`

```typescript
import { useTimelineStore } from '../store/timelineStore';
import type { LinkType } from '../types';

const TYPE_LABELS: Record<LinkType, string> = {
  evolution: '演进',
  causation: '因果',
  contrast: '对照',
  resonance: '共振',
};

const TYPE_COLORS: Record<LinkType, string> = {
  evolution: '#185FA5',
  causation: '#993C1D',
  contrast: '#5F5E5A',
  resonance: '#534AB7',
};

export function TimelineToolbar() {
  const { visibleTypes, showAllLinks, toggleType, toggleShowAll } = useTimelineStore();
  
  return (
    <div className="timeline-toolbar">
      {/* 左侧：视图切换（第三期才实现，先放灰按钮） */}
      <div className="view-tabs">
        <button className="tab is-active">时间线</button>
        <button className="tab is-disabled" disabled title="即将推出">主题</button>
        <button className="tab is-disabled" disabled title="即将推出">关系图</button>
      </div>
      
      {/* 右侧：关联控制 */}
      <div className="link-controls">
        <span className="label">关联</span>
        {(Object.keys(TYPE_LABELS) as LinkType[]).map((type) => {
          const active = visibleTypes.has(type);
          return (
            <button
              key={type}
              className={`type-chip ${active ? 'is-active' : ''}`}
              onClick={() => toggleType(type)}
              style={active ? {
                borderColor: TYPE_COLORS[type],
                color: TYPE_COLORS[type],
              } : undefined}
            >
              {TYPE_LABELS[type]}
            </button>
          );
        })}
        
        <div className="divider" />
        
        <label className="show-all-toggle">
          <input
            type="checkbox"
            checked={showAllLinks}
            onChange={toggleShowAll}
          />
          <span>全部显示</span>
        </label>
      </div>
    </div>
  );
}
```

### 18.2 工具栏样式

加到 `frontend/src/weekly/styles/timeline.css`：

```css
.timeline-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 0.5px solid var(--color-border-tertiary);
  margin-bottom: 12px;
  background: var(--color-background-tertiary);
  border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
}

.view-tabs {
  display: flex;
  gap: 4px;
}

.view-tabs .tab {
  font-size: 12px;
  padding: 5px 12px;
  border-radius: var(--border-radius-md);
  border: 0.5px solid transparent;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.view-tabs .tab.is-active {
  background: var(--color-background-primary);
  border-color: var(--color-border-secondary);
  color: var(--color-text-primary);
}

.view-tabs .tab.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.link-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.link-controls .label {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-right: 4px;
}

.type-chip {
  font-size: 11px;
  padding: 4px 10px;
  border: 0.5px solid var(--color-border-tertiary);
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: border-color 120ms, color 120ms, background 120ms;
}

.type-chip:hover {
  background: var(--color-background-secondary);
}

.type-chip.is-active {
  /* color 和 borderColor 在 inline style 里按类型给 */
  background: var(--color-background-primary);
  font-weight: 500;
}

.divider {
  width: 1px;
  height: 16px;
  background: var(--color-border-tertiary);
  margin: 0 6px;
}

.show-all-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.show-all-toggle input {
  margin: 0;
  width: 12px;
  height: 12px;
}
```

### 18.3 在 TimelineView 顶部挂载

```typescript
import { TimelineToolbar } from '../components/TimelineToolbar';

// 在 TimelineView 的 return 里：
return (
  <div className="timeline-view">
    <TimelineToolbar />
    <div className="timeline-canvas" /* ... */>
      {/* 列容器 */}
    </div>
  </div>
);
```

### 18.4 类型筛选与 LinkLayer 联动

LinkLayer 已经在 `getVisibleLinkIds` 里读取 `visibleTypes`，所以这里不需要再改 LinkLayer 代码——筛选自动生效。

但有个细节：当用户在悬停某节点时，如果某条相关连线的类型被取消勾选，那条线应当不显示。这正是 selectors 里 `getVisibleLinkIds` 在 active 模式下也过滤 `visibleTypes` 的目的。

### 18.5 验证

1. 工具栏顶端正常显示，"时间线"高亮，"主题"和"关系图"灰色不可点
2. 4 个类型 chip 默认全部高亮（蓝/红/灰/紫色边框）
3. 点击某个 chip → 边框灰掉，对应类型的连线消失
4. 勾选\"全部显示\" → 所有未被筛掉的连线全部画出（这就是补丁 V1 的状态）
5. 取消勾选\"全部显示\" → 回到默认隐藏

---

## 收尾

跑完所有指令后做一遍完整体验验收：

1. 默认打开 `/weekly-mindmap` → 7 期周报横向排列，节点带角标，**完全没有连线**
2. 鼠标悬停 `node-419-reflection`（4.19 第一个节点）→ 自身高亮、4 个相关节点保持正常、其他节点淡化、4 条线带 label 出现
3. 鼠标移开 → 所有节点恢复正常，连线消失
4. 单击 `node-419-reflection` → 进入焦点模式（鼠标移开仍保持高亮）
5. 再单击同一节点 → 跳转 `/weekly-mindmap/nodes/node-419-reflection`
6. 返回，单击空白 → 退出焦点模式
7. 取消勾选\"对照\" → 测试点击其他节点时对照类型的连线确实不显示
8. 勾选\"全部显示\" → 所有连线一起出现

**截图发给我**，确认一遍最终效果，第一期就真的完成了。第二期（JSON Import 端点）和第三期（主题视图 + 关系图视图）等你完整跑通本期再启动。

---

## 一些边角情况

**节点 0 关联的怎么办**：角标不显示。`node-419-baijiu` 在我们当前数据里只有 1 条入度（来自 `node-412-pork`），所以角标显示 1。如果某节点真的 0 关联，就完全没角标。

**两个节点在同一列怎么办**：根据约束 6，Link 的 from/to 必须属于不同 Report，所以同列内不会有连线。如果 ai 生成的 JSON 违反了这条，import 时已经被 422 拒掉了。

**滚动时连线抖动**：scroll 事件触发的 setVersion 会导致连线被重算。在低端机器上可能有性能问题。如果遇到，可以在 scroll handler 上加 `requestAnimationFrame` 节流。但先不要预优化——等真的有问题再说。

**响应式**：当前方案假设 timeline 横向滚动，每列固定宽度。手机端不在这一期处理范围内。
