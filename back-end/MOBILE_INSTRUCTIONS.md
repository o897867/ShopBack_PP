# 移动端实施指令 · 20-24

**背景**：桌面端 timeline 视图（指令 1-19）已跑通。本批指令为移动端从零设计的独立产品形态。

**核心原则**：
- 移动端 = 独立的 React 组件树，不复用桌面端 UI（`TimelineView`、`LinkLayer`、`HoverPanel` 等）
- 共享数据层：`api/weeklyApi.ts`、`types.ts`、`store/timelineStore.ts`
- 通过 viewport 宽度检测分发：`<768px → MobileApp.tsx`，`>=768px → DesktopApp.tsx`
- 没有 hover、没有 SVG 连线、没有"周报作为容器"的概念
- 节点是主角，关联以"引用块"形式呈现

按顺序执行 20 → 21 → 22 → 23 → 24。

---

## 指令 20：路由分发 + MobileApp 骨架

### 20.1 创建 viewport 检测 hook

`frontend/src/weekly/hooks/useIsMobile.ts`：

```typescript
import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });
  
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  
  return isMobile;
}
```

### 20.2 重构现有路由

把 `frontend/src/weekly/pages/TimelineView.tsx` 的内容**整体不动**，但在 `App.tsx` 的路由层做分发：

```typescript
// App.tsx
import { useIsMobile } from './weekly/hooks/useIsMobile';
import { TimelineView } from './weekly/pages/TimelineView';        // 桌面端
import { MobileApp } from './weekly/mobile/MobileApp';              // 移动端
import { NodeDetail } from './weekly/pages/NodeDetail';             // 桌面节点详情
import { MobileNodeDetail } from './weekly/mobile/MobileNodeDetail';// 移动节点详情

function WeeklyEntry() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileApp /> : <TimelineView />;
}

function WeeklyNodeEntry() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileNodeDetail /> : <NodeDetail />;
}

// 路由注册：
// /weekly-mindmap          → WeeklyEntry
// /weekly-mindmap/nodes/:id → WeeklyNodeEntry
// /weekly-mindmap/topics/:slug → WeeklyTopicEntry（指令 23 实现）
```

注意一个细节：viewport 切换时（用户旋转手机或调浏览器窗口），React 会重新渲染并切换组件树。这是预期行为，不需要做"热切换保持状态"。

### 20.3 创建移动端目录结构

新建以下空文件：

```
frontend/src/weekly/mobile/
├── MobileApp.tsx              ← 总入口，含 tab 切换
├── MobileNodeDetail.tsx       ← 节点详情页
├── MobileTopicView.tsx        ← 主题流页（指令 23）
├── components/
│   ├── MobileHeader.tsx       ← 顶部 sticky 栏
│   ├── MobileTabs.tsx         ← 最新/主题/索引 tab
│   ├── NodeFeedItem.tsx       ← Feed 流中的节点卡片
│   ├── DateDivider.tsx        ← 日期分隔条
│   ├── RelatedNodeQuote.tsx   ← 关联引用块
│   ├── TopicCard.tsx          ← 主题彩色卡片
│   └── TagChip.tsx            ← tag 圆角标签
└── styles/
    └── mobile.css             ← 移动端专属样式
```

### 20.4 MobileApp 骨架

`frontend/src/weekly/mobile/MobileApp.tsx`：

```typescript
import { useState, useEffect } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { weeklyApi } from '../api/weeklyApi';
import { MobileHeader } from './components/MobileHeader';
import { MobileTabs, type MobileTab } from './components/MobileTabs';
import { LatestFeed } from './components/LatestFeed';     // 指令 21 实现
import { TopicsTab } from './components/TopicsTab';       // 指令 23 实现
import { IndexTab } from './components/IndexTab';         // 指令 23 实现
import './styles/mobile.css';

export function MobileApp() {
  const [activeTab, setActiveTab] = useState<MobileTab>('latest');
  const setLinkIndex = useTimelineStore((s) => s.setLinkIndex);
  
  // 启动时拉取 link index（与桌面端共用 store）
  useEffect(() => {
    weeklyApi.getLinkIndex().then(setLinkIndex).catch(console.error);
  }, [setLinkIndex]);
  
  return (
    <div className="mobile-app">
      <MobileHeader />
      <MobileTabs activeTab={activeTab} onChange={setActiveTab} />
      
      <div className="mobile-content">
        {activeTab === 'latest' && <LatestFeed />}
        {activeTab === 'topics' && <TopicsTab />}
        {activeTab === 'index' && <IndexTab />}
      </div>
    </div>
  );
}
```

### 20.5 MobileHeader 组件

`frontend/src/weekly/mobile/components/MobileHeader.tsx`：

```typescript
import { useReports } from '../../hooks/useReports';
import { useTimelineStore } from '../../store/timelineStore';

export function MobileHeader() {
  const { data: reports } = useReports();
  const linkIndex = useTimelineStore((s) => s.linkIndex);
  
  const reportCount = reports?.length || 0;
  const nodeCount = linkIndex 
    ? Object.keys(linkIndex.node_link_count).length 
    : 0;
  const linkCount = linkIndex 
    ? Object.keys(linkIndex.links_by_id).length 
    : 0;
  
  return (
    <header className="mobile-header">
      <div className="mobile-header-title">郝有道理 · 周报思维导图</div>
      <div className="mobile-header-meta">
        {reportCount} 期 · {nodeCount} 节点 · {linkCount} 条关联
      </div>
    </header>
  );
}
```

### 20.6 MobileTabs 组件

`frontend/src/weekly/mobile/components/MobileTabs.tsx`：

```typescript
export type MobileTab = 'latest' | 'topics' | 'index';

interface MobileTabsProps {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
}

const TABS: { key: MobileTab; label: string }[] = [
  { key: 'latest', label: '最新' },
  { key: 'topics', label: '主题' },
  { key: 'index', label: '索引' },
];

export function MobileTabs({ activeTab, onChange }: MobileTabsProps) {
  return (
    <nav className="mobile-tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          className={`mobile-tab ${activeTab === tab.key ? 'is-active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
```

### 20.7 移动端基础样式

`frontend/src/weekly/mobile/styles/mobile.css`：

```css
.mobile-app {
  min-height: 100vh;
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  -webkit-tap-highlight-color: transparent;
}

.mobile-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-background-primary);
  padding: 14px 16px 10px;
  border-bottom: 0.5px solid var(--color-border-tertiary);
}

.mobile-header-title {
  font-size: 15px;
  font-weight: 500;
}

.mobile-header-meta {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.mobile-tabs {
  position: sticky;
  top: 56px;  /* 注意：与 mobile-header 的实际高度对齐，可能需调整 */
  z-index: 9;
  display: flex;
  gap: 16px;
  padding: 0 16px;
  background: var(--color-background-primary);
  border-bottom: 0.5px solid var(--color-border-tertiary);
}

.mobile-tab {
  font-size: 14px;
  padding: 12px 0;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -0.5px;  /* 让选中的 border 覆盖 tabs 的 border */
  transition: color 120ms;
}

.mobile-tab.is-active {
  color: var(--color-text-primary);
  font-weight: 500;
  border-bottom-color: var(--color-text-primary);
}

.mobile-content {
  padding: 16px;
}
```

### 20.8 验证

1. 用 Chrome DevTools 把窗口宽度调到 375px → 应渲染 `MobileApp`
2. 调到 1024px → 应渲染 `TimelineView`（桌面端）
3. 移动端能看到 sticky header（标题 + 元信息）
4. 三个 tab 能切换，但内容区暂时空白（`LatestFeed` 等组件还没实现）

---

## 指令 21：Feed 首页（最新 tab）

### 21.1 LatestFeed 组件

`frontend/src/weekly/mobile/components/LatestFeed.tsx`：

```typescript
import { useReports } from '../../hooks/useReports';
import { useEffect, useState } from 'react';
import { weeklyApi } from '../../api/weeklyApi';
import type { ReportDetail, Node } from '../../types';
import { DateDivider } from './DateDivider';
import { NodeFeedItem } from './NodeFeedItem';

export function LatestFeed() {
  const { data: reports, loading: reportsLoading } = useReports();
  const [reportDetails, setReportDetails] = useState<ReportDetail[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!reports) return;
    
    // 拉取所有周报详情（含节点）。数据量小（7 期 33 节点），一次拉完
    Promise.all(reports.map((r) => weeklyApi.getReport(r.id)))
      .then((details) => {
        // 按 date 倒序（最新在前）
        details.sort((a, b) => b.date.localeCompare(a.date));
        setReportDetails(details);
      })
      .finally(() => setLoading(false));
  }, [reports]);
  
  if (reportsLoading || loading) {
    return <FeedSkeleton />;
  }
  
  return (
    <div className="latest-feed">
      {reportDetails.map((report) => (
        <ReportSection key={report.id} report={report} />
      ))}
    </div>
  );
}

function ReportSection({ report }: { report: ReportDetail }) {
  const nodes = [...report.nodes].sort((a, b) => a.order - b.order);
  
  return (
    <section className="report-section">
      <DateDivider date={report.date} nodeCount={nodes.length} />
      {nodes.map((node) => (
        <NodeFeedItem key={node.id} node={node} reportDate={report.date} />
      ))}
    </section>
  );
}

function FeedSkeleton() {
  return (
    <div className="feed-skeleton">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-card" />
      ))}
    </div>
  );
}
```

### 21.2 DateDivider 组件

`frontend/src/weekly/mobile/components/DateDivider.tsx`：

```typescript
interface DateDividerProps {
  date: string;
  nodeCount: number;
}

export function DateDivider({ date, nodeCount }: DateDividerProps) {
  return (
    <div className="date-divider">
      <div className="date-divider-dot" />
      <div className="date-divider-label">
        {date} 周总结
      </div>
      <div className="date-divider-count">{nodeCount} 节点</div>
    </div>
  );
}
```

### 21.3 NodeFeedItem 组件（核心）

`frontend/src/weekly/mobile/components/NodeFeedItem.tsx`：

```typescript
import { useNavigate } from 'react-router-dom';
import { useTimelineStore } from '../../store/timelineStore';
import type { Node, ColorClass } from '../../types';

interface NodeFeedItemProps {
  node: Node;
  reportDate: string;
}

const COLOR_PALETTE: Record<ColorClass, { bg: string; title: string; subtitle: string; body: string; border: string }> = {
  'c-amber':  { bg: '#FAEEDA', title: '#412402', subtitle: '#854F0B', body: '#633806', border: '#FAC775' },
  'c-blue':   { bg: '#E6F1FB', title: '#042C53', subtitle: '#185FA5', body: '#0C447C', border: '#85B7EB' },
  'c-teal':   { bg: '#E1F5EE', title: '#04342C', subtitle: '#0F6E56', body: '#085041', border: '#5DCAA5' },
  'c-purple': { bg: '#EEEDFE', title: '#26215C', subtitle: '#534AB7', body: '#3C3489', border: '#AFA9EC' },
  'c-coral':  { bg: '#FAECE7', title: '#4A1B0C', subtitle: '#993C1D', body: '#712B13', border: '#F0997B' },
  'c-pink':   { bg: '#FBEAF0', title: '#4B1528', subtitle: '#993556', body: '#72243E', border: '#ED93B1' },
  'c-gray':   { bg: '#F1EFE8', title: '#2C2C2A', subtitle: '#5F5E5A', body: '#444441', border: '#B4B2A9' },
  'c-green':  { bg: '#EAF3DE', title: '#173404', subtitle: '#3B6D11', body: '#27500A', border: '#97C459' },
  'c-red':    { bg: '#FCEBEB', title: '#501313', subtitle: '#A32D2D', body: '#791F1F', border: '#F09595' },
};

const SUMMARY_LIMIT = 100;

export function NodeFeedItem({ node, reportDate }: NodeFeedItemProps) {
  const navigate = useNavigate();
  const linkIndex = useTimelineStore((s) => s.linkIndex);
  const palette = COLOR_PALETTE[node.color] || COLOR_PALETTE['c-gray'];
  
  const linkCount = linkIndex?.node_link_count[node.id] || 0;
  
  // 截断 summary 到 100 字
  const summary = node.summary || '';
  const summaryDisplay = summary.length > SUMMARY_LIMIT
    ? summary.slice(0, SUMMARY_LIMIT) + '⋯'
    : summary;
  
  const handleClick = () => {
    navigate(`/weekly-mindmap/nodes/${node.id}`);
  };
  
  return (
    <article
      className="node-feed-item"
      style={{ background: palette.bg }}
      onClick={handleClick}
    >
      <h2 
        className="node-feed-title" 
        style={{ color: palette.title }}
      >
        {node.title}
      </h2>
      
      {node.subtitle && (
        <div 
          className="node-feed-subtitle" 
          style={{ color: palette.subtitle }}
        >
          {node.subtitle}
        </div>
      )}
      
      {summaryDisplay && (
        <p 
          className="node-feed-summary" 
          style={{ color: palette.body }}
        >
          {summaryDisplay}
        </p>
      )}
      
      <div 
        className="node-feed-footer"
        style={{ borderTopColor: palette.border }}
      >
        {linkCount > 0 && (
          <span className="node-feed-link-count" style={{ color: palette.subtitle }}>
            ↗ {linkCount} 处关联
          </span>
        )}
        
        <div className="node-feed-tags">
          {node.tags.slice(0, 3).map((tag) => (
            <span 
              key={tag} 
              className="node-feed-tag"
              style={{ 
                color: palette.subtitle,
                background: 'rgba(255,255,255,0.5)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
```

### 21.4 Feed 相关样式

追加到 `mobile.css`：

```css
.latest-feed {
  display: flex;
  flex-direction: column;
}

.report-section {
  margin-bottom: 8px;
}

.date-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0 12px;
}

.date-divider-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-text-tertiary);
}

.date-divider-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.date-divider-count {
  flex: 1;
  text-align: right;
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.node-feed-item {
  border-radius: var(--border-radius-md);
  padding: 14px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: opacity 120ms, transform 120ms;
}

.node-feed-item:active {
  opacity: 0.85;
  transform: scale(0.99);
}

.node-feed-title {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
  margin: 0;
}

.node-feed-subtitle {
  font-size: 12px;
  margin-top: 4px;
}

.node-feed-summary {
  font-size: 13px;
  line-height: 1.6;
  margin: 10px 0 0;
}

.node-feed-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 0.5px solid;
  flex-wrap: wrap;
}

.node-feed-link-count {
  font-size: 11px;
  font-weight: 500;
}

.node-feed-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.node-feed-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
}

.feed-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-card {
  height: 120px;
  background: var(--color-background-secondary);
  border-radius: var(--border-radius-md);
  opacity: 0.5;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.7; }
}
```

### 21.5 验证

1. 移动端进入 `/weekly-mindmap`，看到顶部 header + tabs
2. 默认在"最新" tab，能看到从最新一期开始的所有节点（按周倒序）
3. 每个节点：背景色按 `color` 字段着色（黄金黄、能源紫、流动性青等）
4. 标题 + 副标题 + 100 字 summary + 关联数 + 前 3 个 tag
5. 周与周之间有"2026.4.19 周总结 · 4 节点"的分隔条
6. 点击节点能跳转（暂跳到桌面端 NodeDetail，下一指令实现移动版）
7. 滚动流畅，没有卡顿

---

## 指令 22：节点详情页 + 关联引用块

### 22.1 MobileNodeDetail 组件

`frontend/src/weekly/mobile/MobileNodeDetail.tsx`：

```typescript
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { weeklyApi } from '../api/weeklyApi';
import { useTimelineStore } from '../store/timelineStore';
import type { Node, Link } from '../types';
import { TagChip } from './components/TagChip';
import { RelatedNodeQuote } from './components/RelatedNodeQuote';

export function MobileNodeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const linkIndex = useTimelineStore((s) => s.linkIndex);
  const setLinkIndex = useTimelineStore((s) => s.setLinkIndex);
  
  const [node, setNode] = useState<Node | null>(null);
  const [reportDate, setReportDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // 拉取 link index（防止用户直接打开节点 URL 时 store 为空）
  useEffect(() => {
    if (!linkIndex) {
      weeklyApi.getLinkIndex().then(setLinkIndex).catch(console.error);
    }
  }, [linkIndex, setLinkIndex]);
  
  // 拉取节点 + 所属周报日期
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    weeklyApi.getNode(id).then((n) => {
      setNode(n);
      // 拉取所属周报以获取日期
      return weeklyApi.getReport(n.report_id);
    }).then((report) => {
      setReportDate(report.date);
    }).finally(() => setLoading(false));
  }, [id]);
  
  // 滚动回顶（路由切换时）
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  
  if (loading || !node) {
    return <NodeDetailSkeleton />;
  }
  
  // 找出所有关联（出度 + 入度）
  const relatedLinks: Array<{ link: Link; otherNodeId: string; direction: 'in' | 'out' }> = [];
  if (linkIndex) {
    const linkIds = linkIndex.node_to_links[node.id] || [];
    for (const lid of linkIds) {
      const link = linkIndex.links_by_id[lid];
      if (!link) continue;
      if (link.from_node_id === node.id) {
        relatedLinks.push({ link, otherNodeId: link.to_node_id, direction: 'out' });
      } else {
        relatedLinks.push({ link, otherNodeId: link.from_node_id, direction: 'in' });
      }
    }
  }
  
  return (
    <div className="mobile-node-detail">
      <header className="mobile-detail-header">
        <button 
          className="mobile-back-btn" 
          onClick={() => navigate(-1)}
          aria-label="返回"
        >
          ←
        </button>
        <div className="mobile-detail-context">
          <div className="mobile-detail-date">{reportDate}</div>
          <div className="mobile-detail-crumb">{node.title}</div>
        </div>
      </header>
      
      <main className="mobile-detail-body">
        {node.tags.length > 0 && (
          <div className="mobile-detail-tags">
            {node.tags.map((tag) => (
              <TagChip key={tag} slug={tag} />
            ))}
          </div>
        )}
        
        <h1 className="mobile-detail-title">{node.title}</h1>
        {node.subtitle && (
          <div className="mobile-detail-subtitle">{node.subtitle}</div>
        )}
        
        {node.body_markdown && (
          <div className="mobile-detail-prose">
            <ReactMarkdown>{node.body_markdown}</ReactMarkdown>
          </div>
        )}
        
        {node.key_points && node.key_points.length > 0 && (
          <aside className="mobile-detail-keypoints">
            <div className="mobile-keypoints-label">关键判断</div>
            <ul>
              {node.key_points.map((kp, i) => (
                <li key={i}>{kp}</li>
              ))}
            </ul>
          </aside>
        )}
      </main>
      
      {relatedLinks.length > 0 && (
        <section className="mobile-related-section">
          <div className="mobile-related-header">
            <div className="mobile-related-title">关联讨论</div>
            <div className="mobile-related-count">{relatedLinks.length} 处</div>
          </div>
          
          {relatedLinks.map(({ link, otherNodeId, direction }) => (
            <RelatedNodeQuote
              key={link.id}
              link={link}
              otherNodeId={otherNodeId}
              direction={direction}
              onClick={() => navigate(`/weekly-mindmap/nodes/${otherNodeId}`)}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function NodeDetailSkeleton() {
  return (
    <div className="mobile-node-detail">
      <div className="skeleton-card" style={{ height: 56 }} />
      <div style={{ padding: 16 }}>
        <div className="skeleton-card" style={{ height: 24, marginBottom: 12 }} />
        <div className="skeleton-card" style={{ height: 200 }} />
      </div>
    </div>
  );
}
```

### 22.2 TagChip 组件

`frontend/src/weekly/mobile/components/TagChip.tsx`：

```typescript
import { useNavigate } from 'react-router-dom';
import { useTags } from '../../hooks/useTags';   // 见下方 22.3 创建该 hook
import type { ColorClass } from '../../types';

const TAG_COLORS: Record<ColorClass, { bg: string; fg: string }> = {
  'c-amber':  { bg: '#FAEEDA', fg: '#854F0B' },
  'c-blue':   { bg: '#E6F1FB', fg: '#185FA5' },
  'c-teal':   { bg: '#E1F5EE', fg: '#0F6E56' },
  'c-purple': { bg: '#EEEDFE', fg: '#534AB7' },
  'c-coral':  { bg: '#FAECE7', fg: '#993C1D' },
  'c-pink':   { bg: '#FBEAF0', fg: '#993556' },
  'c-gray':   { bg: '#F1EFE8', fg: '#5F5E5A' },
  'c-green':  { bg: '#EAF3DE', fg: '#3B6D11' },
  'c-red':    { bg: '#FCEBEB', fg: '#A32D2D' },
};

interface TagChipProps {
  slug: string;
  size?: 'sm' | 'md';
  clickable?: boolean;
}

export function TagChip({ slug, size = 'md', clickable = true }: TagChipProps) {
  const navigate = useNavigate();
  const { data: tags } = useTags();
  
  const tag = tags?.find((t) => t.slug === slug);
  const colors = tag ? (TAG_COLORS[tag.color] || TAG_COLORS['c-gray']) : TAG_COLORS['c-gray'];
  const displayName = tag?.name || slug;
  
  const handleClick = clickable
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/weekly-mindmap/topics/${slug}`);
      }
    : undefined;
  
  return (
    <span
      className={`tag-chip tag-chip-${size}`}
      style={{ background: colors.bg, color: colors.fg, cursor: clickable ? 'pointer' : 'default' }}
      onClick={handleClick}
    >
      {displayName}
    </span>
  );
}
```

### 22.3 useTags hook

`frontend/src/weekly/hooks/useTags.ts`：

```typescript
import { useEffect, useState } from 'react';
import { weeklyApi } from '../api/weeklyApi';
import type { Tag } from '../types';

let cache: Tag[] | null = null;

export function useTags() {
  const [data, setData] = useState<Tag[] | null>(cache);
  const [loading, setLoading] = useState(!cache);
  
  useEffect(() => {
    if (cache) return;
    weeklyApi.getTags().then((tags) => {
      cache = tags;
      setData(tags);
    }).finally(() => setLoading(false));
  }, []);
  
  return { data, loading };
}
```

简单全局缓存——tags 在一次会话内不会变。

### 22.4 RelatedNodeQuote 组件（核心）

`frontend/src/weekly/mobile/components/RelatedNodeQuote.tsx`：

```typescript
import { useEffect, useState } from 'react';
import { weeklyApi } from '../../api/weeklyApi';
import type { Link, LinkType, Node } from '../../types';

interface RelatedNodeQuoteProps {
  link: Link;
  otherNodeId: string;
  direction: 'in' | 'out';   // in = 别人指向我；out = 我指向别人
  onClick: () => void;
}

const TYPE_CONFIG: Record<LinkType, { label: string; color: string }> = {
  evolution: { label: '演进', color: '#185FA5' },
  causation: { label: '因果', color: '#A32D2D' },
  contrast:  { label: '对照', color: '#5F5E5A' },
  resonance: { label: '共振', color: '#534AB7' },
};

const otherNodeCache = new Map<string, { node: Node; reportDate: string }>();

export function RelatedNodeQuote({ link, otherNodeId, direction, onClick }: RelatedNodeQuoteProps) {
  const [otherInfo, setOtherInfo] = useState(otherNodeCache.get(otherNodeId) || null);
  
  useEffect(() => {
    if (otherNodeCache.has(otherNodeId)) return;
    
    weeklyApi.getNode(otherNodeId).then((node) => {
      return weeklyApi.getReport(node.report_id).then((report) => {
        const info = { node, reportDate: report.date };
        otherNodeCache.set(otherNodeId, info);
        setOtherInfo(info);
      });
    });
  }, [otherNodeId]);
  
  const config = TYPE_CONFIG[link.type];
  const directionArrow = direction === 'in' ? '←' : '→';
  
  return (
    <article
      className="related-node-quote"
      style={{ borderLeftColor: config.color }}
      onClick={onClick}
    >
      <div className="related-quote-meta">
        <span 
          className="related-quote-type" 
          style={{ color: config.color }}
        >
          {config.label} {directionArrow}
        </span>
        {otherInfo && (
          <span className="related-quote-date">
            {otherInfo.reportDate}
          </span>
        )}
      </div>
      
      <div className="related-quote-title">
        {otherInfo?.node.title || '加载中⋯'}
      </div>
      
      {link.label && (
        <div className="related-quote-label">{link.label}</div>
      )}
    </article>
  );
}
```

### 22.5 节点详情页样式

追加到 `mobile.css`：

```css
.mobile-node-detail {
  min-height: 100vh;
  background: var(--color-background-primary);
}

.mobile-detail-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-background-primary);
  border-bottom: 0.5px solid var(--color-border-tertiary);
}

.mobile-back-btn {
  font-size: 20px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  margin-left: -8px;
}

.mobile-back-btn:active {
  color: var(--color-text-primary);
}

.mobile-detail-context {
  flex: 1;
  min-width: 0;
}

.mobile-detail-date {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.mobile-detail-crumb {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-detail-body {
  padding: 20px 16px;
}

.mobile-detail-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.tag-chip {
  display: inline-block;
  border-radius: 999px;
  font-weight: 500;
}

.tag-chip-md {
  font-size: 11px;
  padding: 3px 8px;
}

.tag-chip-sm {
  font-size: 10px;
  padding: 2px 6px;
}

.mobile-detail-title {
  font-size: 22px;
  font-weight: 500;
  line-height: 1.3;
  margin: 0 0 6px;
}

.mobile-detail-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 20px;
}

.mobile-detail-prose {
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-text-primary);
}

.mobile-detail-prose p {
  margin: 0 0 14px;
}

.mobile-detail-prose strong {
  font-weight: 500;
}

.mobile-detail-prose a {
  color: var(--color-text-info);
  text-decoration: none;
}

.mobile-detail-keypoints {
  margin-top: 20px;
  padding: 14px;
  background: var(--color-background-tertiary);
  border-radius: var(--border-radius-md);
}

.mobile-keypoints-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-bottom: 8px;
}

.mobile-detail-keypoints ul {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.7;
}

.mobile-related-section {
  border-top: 8px solid var(--color-background-tertiary);
  padding: 20px 16px;
}

.mobile-related-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.mobile-related-title {
  font-size: 14px;
  font-weight: 500;
}

.mobile-related-count {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.related-node-quote {
  background: var(--color-background-tertiary);
  border-left: 3px solid;
  padding: 12px 14px;
  border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
  margin-bottom: 8px;
  cursor: pointer;
  transition: opacity 120ms;
}

.related-node-quote:active {
  opacity: 0.7;
}

.related-quote-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.related-quote-type {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.related-quote-date {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.related-quote-title {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}

.related-quote-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}
```

### 22.6 验证

1. 在移动端 Feed 点击任一节点 → 进入 `MobileNodeDetail`
2. 顶部 sticky header 显示返回箭头 + 日期 + 节点标题
3. 主体：tags chip 列表 → 大标题 → 副标题 → markdown 正文 → key_points 框
4. 底部"关联讨论"区：每条关联是引用块，左竖条颜色对应类型（蓝/紫/灰/红）
5. 引用块上方标注"演进 ←  2026.4.12"，中间是另一节点标题，下方是 link.label
6. 点击引用块 → 跳转到那个节点的详情页（路径变了，整个页面重新加载）
7. 点击 tag chip → 跳转到主题页（路径变成 `/weekly-mindmap/topics/<slug>`，但页面还没实现，下一指令补）
8. 点击返回箭头 → 回到 Feed

---

## 指令 23：主题 tab + 主题流页

### 23.1 TopicsTab 组件

`frontend/src/weekly/mobile/components/TopicsTab.tsx`：

```typescript
import { useTags } from '../../hooks/useTags';
import { useTimelineStore } from '../../store/timelineStore';
import { useNavigate } from 'react-router-dom';
import { TopicCard } from './TopicCard';

// 主推 6 个主题（手动策展，按重要性排序）
const FEATURED_TOPICS = ['gold', 'liquidity', 'geopolitics', 'energy', 'us-stocks', 'cycle'];

export function TopicsTab() {
  const { data: tags, loading } = useTags();
  const linkIndex = useTimelineStore((s) => s.linkIndex);
  const navigate = useNavigate();
  
  if (loading || !tags) return <div className="loading-hint">加载中⋯</div>;
  
  const tagsBySlug = new Map(tags.map((t) => [t.slug, t]));
  
  // 计算每个 tag 下有多少节点（基于 linkIndex 推导，避免再发请求）
  // 简化：先全部显示，节点数从一个 helper 函数估算
  const featured = FEATURED_TOPICS
    .map((slug) => tagsBySlug.get(slug))
    .filter((t): t is NonNullable<typeof t> => !!t);
  
  const otherTags = tags.filter((t) => !FEATURED_TOPICS.includes(t.slug));
  
  return (
    <div className="topics-tab">
      <div className="topics-grid">
        {featured.map((tag) => (
          <TopicCard 
            key={tag.slug} 
            tag={tag} 
            onClick={() => navigate(`/weekly-mindmap/topics/${tag.slug}`)}
          />
        ))}
      </div>
      
      <div className="topics-index">
        <div className="topics-index-label">完整索引</div>
        <div className="topics-index-chips">
          {otherTags.map((tag) => (
            <span 
              key={tag.slug}
              className="topic-index-chip"
              onClick={() => navigate(`/weekly-mindmap/topics/${tag.slug}`)}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function IndexTab() {
  const { data: tags, loading } = useTags();
  const navigate = useNavigate();
  
  if (loading || !tags) return <div className="loading-hint">加载中⋯</div>;
  
  // 索引 tab：所有 tag 一起列出，按字母/拼音排序
  const sorted = [...tags].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  
  return (
    <div className="topics-tab">
      <div className="topics-index-chips" style={{ marginTop: 4 }}>
        {sorted.map((tag) => (
          <span 
            key={tag.slug}
            className="topic-index-chip"
            onClick={() => navigate(`/weekly-mindmap/topics/${tag.slug}`)}
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  );
}
```

### 23.2 TopicCard 组件

`frontend/src/weekly/mobile/components/TopicCard.tsx`：

```typescript
import type { Tag, ColorClass } from '../../types';

const TOPIC_COLORS: Record<ColorClass, { bg: string; title: string; meta: string }> = {
  'c-amber':  { bg: '#FAEEDA', title: '#412402', meta: '#854F0B' },
  'c-blue':   { bg: '#E6F1FB', title: '#042C53', meta: '#185FA5' },
  'c-teal':   { bg: '#E1F5EE', title: '#04342C', meta: '#0F6E56' },
  'c-purple': { bg: '#EEEDFE', title: '#26215C', meta: '#534AB7' },
  'c-coral':  { bg: '#FAECE7', title: '#4A1B0C', meta: '#993C1D' },
  'c-pink':   { bg: '#FBEAF0', title: '#4B1528', meta: '#993556' },
  'c-gray':   { bg: '#F1EFE8', title: '#2C2C2A', meta: '#5F5E5A' },
  'c-green':  { bg: '#EAF3DE', title: '#173404', meta: '#3B6D11' },
  'c-red':    { bg: '#FCEBEB', title: '#501313', meta: '#A32D2D' },
};

interface TopicCardProps {
  tag: Tag;
  onClick: () => void;
}

export function TopicCard({ tag, onClick }: TopicCardProps) {
  const palette = TOPIC_COLORS[tag.color] || TOPIC_COLORS['c-gray'];
  
  return (
    <article 
      className="topic-card"
      style={{ background: palette.bg }}
      onClick={onClick}
    >
      <div className="topic-card-title" style={{ color: palette.title }}>
        {tag.name}
      </div>
      {tag.description && (
        <div className="topic-card-meta" style={{ color: palette.meta }}>
          {tag.description}
        </div>
      )}
    </article>
  );
}
```

### 23.3 MobileTopicView 组件（主题流页）

`frontend/src/weekly/mobile/MobileTopicView.tsx`：

```typescript
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { weeklyApi } from '../api/weeklyApi';
import { useTags } from '../hooks/useTags';
import type { Node } from '../types';
import { NodeFeedItem } from './components/NodeFeedItem';

export function MobileTopicView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: tags } = useTags();
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportDateMap, setReportDateMap] = useState<Record<string, string>>({});
  
  const tag = tags?.find((t) => t.slug === slug);
  
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    
    weeklyApi.getTagTimeline(slug).then(async (nodes) => {
      // 按时间倒序（与 Feed 保持一致）
      const sorted = [...nodes].sort((a, b) => 
        b.report_id.localeCompare(a.report_id)
      );
      setNodes(sorted);
      
      // 拉取所有相关报告日期
      const reportIds = Array.from(new Set(sorted.map((n) => n.report_id)));
      const reports = await Promise.all(reportIds.map((id) => weeklyApi.getReport(id)));
      const map: Record<string, string> = {};
      for (const r of reports) {
        map[r.id] = r.date;
      }
      setReportDateMap(map);
    }).finally(() => setLoading(false));
  }, [slug]);
  
  return (
    <div className="mobile-topic-view">
      <header className="mobile-detail-header">
        <button 
          className="mobile-back-btn" 
          onClick={() => navigate(-1)}
          aria-label="返回"
        >
          ←
        </button>
        <div className="mobile-detail-context">
          <div className="mobile-detail-date">主题</div>
          <div className="mobile-detail-crumb">
            {tag?.name || slug} {nodes.length > 0 && `· ${nodes.length} 节点`}
          </div>
        </div>
      </header>
      
      <main style={{ padding: 16 }}>
        {tag?.description && (
          <p className="topic-description">{tag.description}</p>
        )}
        
        {loading ? (
          <div className="loading-hint">加载中⋯</div>
        ) : nodes.length === 0 ? (
          <div className="empty-hint">暂无相关节点</div>
        ) : (
          nodes.map((node) => (
            <NodeFeedItem 
              key={node.id} 
              node={node} 
              reportDate={reportDateMap[node.report_id] || ''}
            />
          ))
        )}
      </main>
    </div>
  );
}
```

### 23.4 注册主题路由

`App.tsx` 增加：

```typescript
import { MobileTopicView } from './weekly/mobile/MobileTopicView';

function WeeklyTopicEntry() {
  const isMobile = useIsMobile();
  // 桌面端的主题视图第三期才做，先用移动版顶上
  return isMobile ? <MobileTopicView /> : <MobileTopicView />;
}

// 路由：
// /weekly-mindmap/topics/:slug → WeeklyTopicEntry
```

### 23.5 主题相关样式

追加到 `mobile.css`：

```css
.topics-tab {
  display: flex;
  flex-direction: column;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 24px;
}

.topic-card {
  border-radius: var(--border-radius-md);
  padding: 14px 12px;
  cursor: pointer;
  transition: opacity 120ms, transform 120ms;
  min-height: 64px;
}

.topic-card:active {
  opacity: 0.85;
  transform: scale(0.98);
}

.topic-card-title {
  font-size: 14px;
  font-weight: 500;
}

.topic-card-meta {
  font-size: 11px;
  margin-top: 4px;
  line-height: 1.4;
}

.topics-index {
  padding-top: 12px;
  border-top: 0.5px solid var(--color-border-tertiary);
}

.topics-index-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-bottom: 8px;
}

.topics-index-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.topic-index-chip {
  font-size: 12px;
  padding: 5px 12px;
  background: var(--color-background-primary);
  color: var(--color-text-secondary);
  border-radius: 999px;
  border: 0.5px solid var(--color-border-tertiary);
  cursor: pointer;
  transition: background 120ms;
}

.topic-index-chip:active {
  background: var(--color-background-secondary);
}

.topic-description {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 16px;
  padding: 12px;
  background: var(--color-background-tertiary);
  border-radius: var(--border-radius-md);
}

.loading-hint, .empty-hint {
  text-align: center;
  padding: 40px 16px;
  color: var(--color-text-tertiary);
  font-size: 13px;
}
```

### 23.6 验证

1. 切换到"主题" tab → 看到 6 个彩色主题卡片网格 + 下方完整索引 chip 列表
2. 点击"黄金"卡片 → 进入 `/weekly-mindmap/topics/gold`
3. 主题流页：顶部返回栏 + 主题名 + 节点数；下方是该主题下所有节点（按时间倒序），样式与 Feed 一致
4. 切换到"索引" tab → 所有 tag 平铺，按拼音排序
5. 点击任一索引 chip → 进入对应主题流页
6. 节点详情页里的 tag chip 也能跳到主题流页

---

## 指令 24：移动端打磨（触摸优化 + 收尾）

### 24.1 视口 meta 标签

在 `frontend/index.html` 的 `<head>` 里确保有：

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#FFFFFF" />
```

如果项目用了 PWA/manifest，把 `theme-color` 设成白色让 iOS 状态栏看起来融入。

### 24.2 安全区适配（刘海屏 / 底部条）

修改 `mobile.css` 的 sticky 元素，加上 safe-area inset：

```css
.mobile-header {
  padding-top: max(14px, env(safe-area-inset-top));
}

.mobile-detail-header {
  padding-top: max(12px, env(safe-area-inset-top));
}

.mobile-content,
.mobile-topic-view main,
.mobile-related-section {
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}
```

### 24.3 阻止双击缩放 + 触摸态优化

追加到 `mobile.css`：

```css
.mobile-app * {
  -webkit-touch-callout: none;
  -webkit-user-select: text;
}

/* 但允许在正文里选中复制 */
.mobile-detail-prose,
.mobile-detail-prose * {
  -webkit-user-select: text;
  user-select: text;
}

.mobile-app button,
.mobile-app .node-feed-item,
.mobile-app .related-node-quote,
.mobile-app .topic-card,
.mobile-app .topic-index-chip,
.mobile-app .tag-chip {
  touch-action: manipulation;  /* 禁用双击放大延迟 */
}
```

### 24.4 滚动恢复

桌面端用户在节点详情页滚到底部，点关联跳到另一节点——希望新页面从顶部开始。已经在 `MobileNodeDetail` 里加了 `useEffect(() => window.scrollTo(0, 0), [id])`，但 Feed 页之间切 tab 不需要滚动重置（用户期望保持位置）。这是符合预期的。

但有一个边角：用户进 Feed → 点节点进详情 → 返回 → 期望 Feed 滚动位置保持。React Router 默认会保持，但因为我们用 `setActiveTab` 切 tab 时组件被卸载重建，所以要把 tab 切换提升到 URL 层。

简化处理：暂不做 tab 持久化（用户切回 Feed 总是从顶部）。如果你后面觉得不爽再处理。

### 24.5 加载性能

`LatestFeed` 当前会同时拉取 7 个 report 的详情（`Promise.all`）。数据量不大没问题，但可以加个简单的 in-flight 去重：

`frontend/src/weekly/api/weeklyApi.ts` 里给 `getReport` 加缓存：

```typescript
const reportCache = new Map<string, Promise<ReportDetail>>();

async function getReport(id: string): Promise<ReportDetail> {
  if (reportCache.has(id)) return reportCache.get(id)!;
  
  const promise = fetch(`${BASE}/api/weekly/reports/${id}`)
    .then((res) => {
      if (!res.ok) {
        reportCache.delete(id);  // 失败时清缓存允许重试
        throw new Error(`Failed: ${res.status}`);
      }
      return res.json();
    });
  
  reportCache.set(id, promise);
  return promise;
}
```

同样的处理可以加在 `getNode`。这样节点详情页快速来回切换不会重复发请求。

### 24.6 错误边界

在 `MobileApp.tsx` 外面包一个简单的错误边界，避免某个组件抛错把整个移动端崩掉：

`frontend/src/weekly/mobile/components/MobileErrorBoundary.tsx`：

```typescript
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MobileErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: any) {
    console.error('Mobile error:', error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="mobile-error">
          <h2>出错了</h2>
          <p>{this.state.error?.message || '未知错误'}</p>
          <button onClick={() => window.location.reload()}>重新加载</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

`App.tsx` 里包一下：

```typescript
function WeeklyEntry() {
  const isMobile = useIsMobile();
  return isMobile ? (
    <MobileErrorBoundary>
      <MobileApp />
    </MobileErrorBoundary>
  ) : <TimelineView />;
}
```

样式追加：

```css
.mobile-error {
  padding: 40px 24px;
  text-align: center;
}

.mobile-error h2 {
  font-size: 18px;
  font-weight: 500;
}

.mobile-error p {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 12px 0 24px;
}

.mobile-error button {
  font-size: 14px;
  padding: 10px 24px;
  background: var(--color-text-primary);
  color: var(--color-background-primary);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
}
```

### 24.7 README 更新

在 `frontend/src/weekly/README.md` 追加一段：

```markdown
## 移动端

`mobile/` 目录下是面向手机的独立组件树。设计理念：

- 不复用桌面端 UI（`TimelineView`、`LinkLayer` 等）
- 共用数据层：`api/`、`types.ts`、`store/timelineStore.ts`、`hooks/`
- 通过 `useIsMobile()` 在 `App.tsx` 路由层做分发

入口：

- `MobileApp.tsx` — 总入口（Feed/主题/索引 三个 tab）
- `MobileNodeDetail.tsx` — 节点详情页
- `MobileTopicView.tsx` — 主题流页

视觉：节点按 color 字段着色（黄金黄/能源紫/...），关联以左竖条引用块呈现，颜色对应 4 种类型（蓝=演进 紫=共振 灰=对照 红=因果）。
```

### 24.8 完整体验验收


如果上面有任何卡顿或困惑，告诉我具体是哪一步，我针对性调整。

---

## 边角说明

**为什么不引入 react-router 嵌套路由切 tab**：移动端三个 tab 是平级 UI 状态，URL 切换会导致浏览器记录三条历史，返回键体验差。用 `useState` 管理就够了，简单可靠。

**为什么 `RelatedNodeQuote` 要单独拉 `getNode + getReport`**：因为 link index 里只有 link 本身的数据，节点详情和所属周报日期需要额外拉。用全局 Map 缓存避免重复请求。

**没做的事**：
- pull-to-refresh
- 节点详情页的"分享到微信"按钮（如果你想加，套个微信 SDK 即可）
- 评论/点赞之类的社交功能
- 搜索框（先用主题 tab 顶替）

**Tab 持久化**：当前每次切 tab 都从 0 开始拉数据。如果未来用户量大、API 调用心疼，把 LatestFeed 的 reportDetails 提升到 store 里缓存。
