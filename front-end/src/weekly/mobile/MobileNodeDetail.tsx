import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { weeklyApi } from "../api/weeklyApi";
import { useTimelineStore } from "../store/timelineStore";
import type { NodeDetail, LinkDetail } from "../types";
import { TagChip } from "./components/TagChip";
import { RelatedNodeQuote } from "./components/RelatedNodeQuote";
import "./styles/mobile.css";

export default function MobileNodeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const linkIndex = useTimelineStore((s) => s.linkIndex);
  const setLinkIndex = useTimelineStore((s) => s.setLinkIndex);

  const [node, setNode] = useState<NodeDetail | null>(null);
  const [reportDate, setReportDate] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch link index if user navigated directly
  useEffect(() => {
    if (!linkIndex) {
      weeklyApi.getLinkIndex().then(setLinkIndex).catch(console.error);
    }
  }, [linkIndex, setLinkIndex]);

  // Fetch node + report date
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    weeklyApi
      .getNode(id)
      .then((n) => {
        setNode(n);
        return weeklyApi.getReport(n.report_id);
      })
      .then((report) => {
        setReportDate(report.date);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (loading || !node) {
    return <NodeDetailSkeleton />;
  }

  // Find all related links (in + out)
  const relatedLinks: Array<{
    link: LinkDetail;
    otherNodeId: string;
    direction: "in" | "out";
  }> = [];
  if (linkIndex) {
    const linkIds = linkIndex.node_to_links[node.id] || [];
    for (const lid of linkIds) {
      const link = linkIndex.links_by_id[lid];
      if (!link) continue;
      if (link.from_node_id === node.id) {
        relatedLinks.push({ link, otherNodeId: link.to_node_id, direction: "out" });
      } else {
        relatedLinks.push({ link, otherNodeId: link.from_node_id, direction: "in" });
      }
    }
  }

  const tags = node.tags || [];
  const keyPoints = node.key_points || [];

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
        {tags.length > 0 && (
          <div className="mobile-detail-tags">
            {tags.map((tag) => (
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

        {keyPoints.length > 0 && (
          <aside className="mobile-detail-keypoints">
            <div className="mobile-keypoints-label">关键判断</div>
            <ul>
              {keyPoints.map((kp, i) => (
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
