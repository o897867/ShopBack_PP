# 第一期补丁 · 增量修改指令

**背景**：第一期已完成，现在有两处数据模型需要扩展（新增 `ai_generated` 字段 + 拆分一个节点），并替换种子数据为完整 7 期版本。

按顺序执行，中间不要跳步。

---

## 指令 9：数据模型增量

在 `backend/weekly/models.py` 的 `Report` 类中，新增一个字段：

```python
ai_generated = Column(Boolean, default=False, nullable=False)
```

放在 `updated_at` 之前。含义：标识这期周报是否由 AI 助手（如 Gemini）整理而成，前端会据此显示"AI 整理"徽章。

在 `backend/weekly/schemas.py` 中，同步更新 `ReportSummary` 和 `ReportDetail`，增加：

```python
ai_generated: bool = False
```

在 `frontend/src/weekly/types.ts` 中，`Report` 接口增加：

```typescript
ai_generated: boolean;
```

完成后确认三个文件都修改，无拼写错误。

---

## 指令 10：数据库重建

因为是开发阶段，不走迁移路径，直接重建。

1. 删除现有数据库文件：
   ```bash
   rm backend/data/weekly.db
   ```

2. 重跑建表脚本：
   ```bash
   python backend/scripts/init_weekly_db.py
   ```

3. 验证新字段已生成：
   ```bash
   sqlite3 backend/data/weekly.db "PRAGMA table_info(weekly_reports);"
   ```
   应该在输出里看到 `ai_generated` 列。

---

## 指令 11：替换种子数据

用户会提供两份完整的 JSON 文件：
- `backend/scripts/seed_data/reports_nodes.json`（7 期周报 + 33 个节点）
- `backend/scripts/seed_data/links_tags.json`（24 条关联 + 28 个 tag）

把它们放到 `backend/scripts/seed_data/` 目录下（需先创建该目录）。

重写 `backend/scripts/seed_weekly.py`，让它：

1. 从两个 JSON 文件读取数据
2. 插入顺序严格按：Tag → Report → Node → Link（外键依赖顺序）
3. 每次运行前先清空这四张表（开发期间允许重置）
4. 打印进度：每插入一批后输出 "✓ Inserted N reports"、"✓ Inserted N nodes" 等
5. 处理 Tag 的父子关系：先插入所有无 parent 的 tag，再插入有 parent 的（避免外键错）

脚本大致结构：

```python
# backend/scripts/seed_weekly.py
import json
from pathlib import Path
from sqlalchemy.orm import Session
from weekly.database import engine, SessionLocal
from weekly.models import Report, Node, Link, Tag, LinkType

SEED_DIR = Path(__file__).parent / "seed_data"

def load_json(name):
    with open(SEED_DIR / name, encoding="utf-8") as f:
        return json.load(f)

def clear_all(db: Session):
    # 外键级联会自动处理 Node 和 Link
    db.query(Link).delete()
    db.query(Node).delete()
    db.query(Report).delete()
    db.query(Tag).delete()
    db.commit()

def seed_tags(db, tags_data):
    # 先插无 parent 的
    roots = [t for t in tags_data if not t.get("parent_slug")]
    children = [t for t in tags_data if t.get("parent_slug")]
    for t in roots + children:
        db.add(Tag(**t))
    db.commit()
    print(f"✓ Inserted {len(tags_data)} tags")

# ... 其他 seed 函数同理

def main():
    db = SessionLocal()
    try:
        clear_all(db)

        reports_nodes = load_json("reports_nodes.json")
        links_tags = load_json("links_tags.json")

        seed_tags(db, links_tags["tags"])
        seed_reports(db, reports_nodes["reports"])
        seed_nodes(db, reports_nodes["nodes"])
        seed_links(db, links_tags["links"])

        print("\n✨ Seeding complete.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
```

执行后访问：

- `http://localhost:8000/api/weekly/reports` → 应返回 7 期周报
- `http://localhost:8000/api/weekly/reports/2026-03-22` → 检查 `ai_generated: true`
- `http://localhost:8000/api/weekly/tags` → 应返回 28 个 tag
- `http://localhost:8000/api/weekly/links` → 应返回 24 条关联

---

## 指令 12：前端"AI 整理"徽章

在 `frontend/src/weekly/components/ReportColumn.tsx` 的列头（日期+标题那行）旁边，条件渲染一个小徽章：

```tsx
{report.ai_generated && (
  <span style={{
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'var(--color-background-secondary)',
    color: 'var(--color-text-tertiary)',
    border: '0.5px solid var(--color-border-tertiary)',
    marginLeft: '8px',
    verticalAlign: 'middle'
  }}>
    AI 整理
  </span>
)}
```

（具体样式按你项目现有的 token 体系微调，上面只是示意。）

验收：打开 `/weekly-mindmap`，找到 3.22 那一列的列头，应该能看到 "AI 整理" 徽章；其他 6 列没有。

---

## 指令 13：跨周连线的视觉区分

既然现在有 24 条关联、4 种类型，连线的视觉区分要真正实现出来。

在 `frontend/src/weekly/components/LinkLayer.tsx`（或你实际取的名字）里，根据 `link.type` 设置 SVG path 的样式：

| type | stroke-dasharray | 是否带箭头 |
|---|---|---|
| evolution | `none`（实线） | 否 |
| causation | `none`（实线） | 是（用 `marker-end`） |
| contrast | `6,4`（虚线） | 否 |
| resonance | `2,3`（点线） | 否 |

同时：

- 连线颜色按 `link.strength` 的值调节透明度：strength=3 → opacity=0.7，strength=2 → opacity=0.5，strength=1 → opacity=0.35
- 鼠标悬停在连线上时 opacity 调到 1，并在鼠标旁显示 `link.label`

完成后 7 期周报的时间线视图应该呈现出一张有层次的网络图。

---

## 收尾验收

全部完成后，走一遍完整流程：

1. 启动后端：`uvicorn main:app --reload`
2. 启动前端：`cd frontend && npm run dev`
3. 打开 `/weekly-mindmap`
4. 左右滚动查看所有 7 期
5. 悬停任意节点看详情卡
6. 检查 3.22 的 "AI 整理" 徽章
7. 观察 4 种连线类型的视觉区分
8. 点击任一节点跳转详情页

一切正常，第一期收官。
