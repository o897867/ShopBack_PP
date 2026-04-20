# Weekly Mindmap - Frontend

A weekly report visualization module embedded in the ShopBack project. Renders structured financial reports as an interactive timeline with cross-week links and node detail pages.

## Module Structure

```
src/weekly/
  api/
    weeklyApi.ts        # Fetch-based API client (7 endpoints)
  components/
    HoverPanel.tsx      # Fixed-position tooltip (summary, key_points, links)
    LinkLayer.tsx       # SVG overlay for cross-week bezier curves
    NodeCard.tsx        # Single node card with color ramp
    ReportColumn.tsx    # Column header + ordered node cards
  hooks/
    useLinks.ts         # Fetch links, optionally filtered by node
    useReportDetail.ts  # Fetch single report with nodes
    useReports.ts       # Fetch report list
  pages/
    NodeDetailPage.tsx  # Node detail: markdown body, sidebar, linked nodes
    TimelineView.tsx    # Main timeline: columns + link layer + hover
  types.ts              # TypeScript types (NodeDetail, LinkDetail, etc.)
  weekly.css            # All module styles (scoped via wm- prefix)
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/weekly-mindmap` | TimelineView | Timeline with latest 2 reports |
| `/weekly-mindmap/nodes/:id` | NodeDetailPage | Node detail with markdown + links |

Routes are registered in `App.jsx` and lazy-loaded.

## Development

```bash
cd front-end
npm install --legacy-peer-deps
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:8001` (configured in `vite.config.js`). Make sure the backend is running first.

## Dependencies Added

- `react-router-dom` - Path-based routing (coexists with main app's hash routing)
- `react-markdown` - Renders node body_markdown on detail page
- `@xyflow/react` - Reserved for Phase 3 graph view
