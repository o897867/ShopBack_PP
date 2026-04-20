import { useCallback, useEffect, useRef, useState } from "react";
import { weeklyApi } from "../api/weeklyApi";
import type { LinkDetail, NodeDetail, ReportDetail } from "../types";
import ReportColumn from "../components/ReportColumn";
import HoverPanel from "../components/HoverPanel";
import LinkLayer from "../components/LinkLayer";
import ViewToolbar from "../components/ViewToolbar";
import "../weekly.css";

export default function TimelineView() {
  const [reports, setReports] = useState<ReportDetail[]>([]);
  const [links, setLinks] = useState<LinkDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showLinks, setShowLinks] = useState(true);

  // Hover state
  const [hovered, setHovered] = useState<{
    node: NodeDetail;
    pos: { x: number; y: number };
  } | null>(null);

  // Refs
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([weeklyApi.listReports(), weeklyApi.listLinks()])
      .then(async ([summaries, allLinks]) => {
        if (cancelled) return;
        // Load full detail for all reports
        const ids = summaries.map((s) => s.id);
        const details = await Promise.all(ids.map((id) => weeklyApi.getReport(id)));
        if (cancelled) return;
        setReports(details);
        setLinks(allLinks);
      })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  // Hover handlers
  const onNodeHover = useCallback(
    (e: React.MouseEvent, node: NodeDetail) => {
      setHovered({ node, pos: { x: e.clientX, y: e.clientY } });
    },
    [],
  );
  const onNodeLeave = useCallback(() => setHovered(null), []);

  // Links related to hovered node
  const hoveredLinks = hovered
    ? links.filter(
        (l) =>
          l.from_node_id === hovered.node.id ||
          l.to_node_id === hovered.node.id,
      )
    : [];

  if (loading) {
    return (
      <div className="wm-root">
        <div style={{ padding: 32, color: "#64748b" }}>Loading...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="wm-root">
        <div style={{ padding: 32, color: "#dc2626" }}>Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="wm-root">
      <ViewToolbar>
        <label className="wm-toggle">
          <input
            type="checkbox"
            checked={showLinks}
            onChange={(e) => setShowLinks(e.target.checked)}
          />
          Show cross-week links
        </label>
      </ViewToolbar>

      {/* Timeline */}
      <div className="wm-timeline" ref={containerRef}>
        <LinkLayer
          links={links}
          nodeRefs={nodeRefs}
          containerRef={containerRef}
          visible={showLinks}
        />
        {reports.map((r) => (
          <ReportColumn
            key={r.id}
            report={r}
            nodeRefs={nodeRefs}
            onNodeHover={onNodeHover}
            onNodeLeave={onNodeLeave}
          />
        ))}
      </div>

      {/* Hover panel */}
      {hovered && (
        <HoverPanel
          node={hovered.node}
          links={hoveredLinks}
          position={hovered.pos}
        />
      )}
    </div>
  );
}
