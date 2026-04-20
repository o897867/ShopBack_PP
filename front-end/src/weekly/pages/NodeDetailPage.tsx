import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { weeklyApi } from "../api/weeklyApi";
import type { NodeDetail, LinkDetail, ReportSummary } from "../types";
import { TYPE_LABELS } from "../utils/linkStyles";
import "../weekly.css";

interface LinkedNode {
  node: NodeDetail;
  link: LinkDetail;
  reportDate: string;
}

export default function NodeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [node, setNode] = useState<NodeDetail | null>(null);
  const [links, setLinks] = useState<LinkDetail[]>([]);
  const [linkedNodes, setLinkedNodes] = useState<LinkedNode[]>([]);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // 1. Fetch node + links in parallel
        const [nodeData, linksData] = await Promise.all([
          weeklyApi.getNode(id),
          weeklyApi.listLinks(id),
        ]);
        if (cancelled) return;
        setNode(nodeData);
        setLinks(linksData);

        // 2. Fetch the parent report for breadcrumb
        const reports = await weeklyApi.listReports();
        if (cancelled) return;
        const parentReport = reports.find((r) => r.id === nodeData.report_id) ?? null;
        setReport(parentReport);

        // 3. Fetch linked nodes (the "other end" of each link)
        const otherIds = linksData.map((l) =>
          l.from_node_id === id ? l.to_node_id : l.from_node_id,
        );
        const uniqueIds = [...new Set(otherIds)];
        const otherNodes = await Promise.all(
          uniqueIds.map((nid) => weeklyApi.getNode(nid)),
        );
        if (cancelled) return;

        const nodeMap = new Map(otherNodes.map((n) => [n.id, n]));
        const resolved: LinkedNode[] = linksData
          .map((l) => {
            const otherId = l.from_node_id === id ? l.to_node_id : l.from_node_id;
            const otherNode = nodeMap.get(otherId);
            if (!otherNode) return null;
            const otherReport = reports.find((r) => r.id === otherNode.report_id);
            return {
              node: otherNode,
              link: l,
              reportDate: otherReport?.date ?? otherNode.report_id,
            };
          })
          .filter((x): x is LinkedNode => x !== null);
        setLinkedNodes(resolved);
      } catch (e) {
        if (!cancelled) setError(e as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="wm-loading">Loading...</div>;
  if (error) return <div className="wm-error">Error: {error.message}</div>;
  if (!node) return <div className="wm-error">Node not found</div>;

  return (
    <div className="wm-detail">
      {/* Breadcrumb */}
      <nav className="wm-breadcrumb">
        <Link to="/weekly-mindmap">Timeline</Link>
        <span className="sep">/</span>
        {report && (
          <>
            <span>{report.date}</span>
            <span className="sep">/</span>
          </>
        )}
        <span className="current">{node.title}</span>
      </nav>

      {/* Header */}
      <div className="wm-detail-header">
        <h1 className="wm-detail-title">{node.title}</h1>
        {node.subtitle && (
          <div className="wm-detail-subtitle">{node.subtitle}</div>
        )}
      </div>

      {/* Body + Sidebar */}
      <div className="wm-detail-body">
        <div className="wm-detail-main">
          {node.body_markdown ? (
            <div className="wm-markdown">
              <ReactMarkdown>{node.body_markdown}</ReactMarkdown>
            </div>
          ) : node.summary ? (
            <p>{node.summary}</p>
          ) : (
            <p style={{ color: "#94a3b8" }}>No content available.</p>
          )}
        </div>

        <aside className="wm-detail-sidebar">
          {node.key_points && node.key_points.length > 0 && (
            <div className="wm-sidebar-section">
              <div className="wm-sidebar-label">Key Points</div>
              <ul className="wm-sidebar-kp">
                {node.key_points.map((kp, i) => (
                  <li key={i}>{kp}</li>
                ))}
              </ul>
            </div>
          )}

          {node.tags && node.tags.length > 0 && (
            <div className="wm-sidebar-section">
              <div className="wm-sidebar-label">Tags</div>
              <div className="wm-sidebar-tags">
                {node.tags.map((tag) => (
                  <span key={tag} className="wm-sidebar-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Linked nodes */}
      {linkedNodes.length > 0 && (
        <div className="wm-linked-section">
          <h2 className="wm-linked-heading">
            Related Nodes ({linkedNodes.length})
          </h2>
          <div className="wm-linked-grid">
            {linkedNodes.map(({ node: other, link, reportDate }) => (
              <Link
                key={link.id}
                to={`/weekly-mindmap/nodes/${other.id}`}
                className="wm-linked-card"
              >
                <div className="wm-linked-card-title">{other.title}</div>
                <div className="wm-linked-card-meta">{reportDate}</div>
                <div className="wm-linked-card-label">
                  <span className="wm-linked-card-type">
                    {TYPE_LABELS[link.type] ?? link.type}
                  </span>
                  {link.label && <span>{link.label}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
