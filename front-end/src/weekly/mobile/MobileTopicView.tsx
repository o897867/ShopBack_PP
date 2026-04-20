import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { weeklyApi } from "../api/weeklyApi";
import { useTags } from "../hooks/useTags";
import type { NodeDetail } from "../types";
import { NodeFeedItem } from "./components/NodeFeedItem";
import "./styles/mobile.css";

export default function MobileTopicView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: tags } = useTags();

  const [nodes, setNodes] = useState<NodeDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportDateMap, setReportDateMap] = useState<Record<string, string>>(
    {},
  );

  const tag = tags?.find((t) => t.slug === slug);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    weeklyApi
      .getTagTimeline(slug)
      .then(async (nodes) => {
        const sorted = [...nodes].sort((a, b) =>
          b.report_id.localeCompare(a.report_id),
        );
        setNodes(sorted);

        const reportIds = Array.from(new Set(sorted.map((n) => n.report_id)));
        const reports = await Promise.all(
          reportIds.map((id) => weeklyApi.getReport(id)),
        );
        const map: Record<string, string> = {};
        for (const r of reports) {
          map[r.id] = r.date;
        }
        setReportDateMap(map);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
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
            {tag?.name || slug}{" "}
            {nodes.length > 0 && `· ${nodes.length} 节点`}
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
              reportDate={reportDateMap[node.report_id] || ""}
            />
          ))
        )}
      </main>
    </div>
  );
}
