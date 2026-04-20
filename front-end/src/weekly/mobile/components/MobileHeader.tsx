import { useReports } from "../../hooks/useReports";
import { useTimelineStore } from "../../store/timelineStore";

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
