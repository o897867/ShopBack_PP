import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTags } from "../hooks/useTags";
import { useTagTimeline } from "../hooks/useTagTimeline";
import ViewToolbar from "../components/ViewToolbar";
import "../weekly.css";

const TAG_BORDER: Record<string, string> = {
  "c-amber": "#d97706",
  "c-blue": "#2563eb",
  "c-teal": "#0d9488",
  "c-purple": "#9333ea",
  "c-coral": "#ea580c",
  "c-pink": "#db2777",
  "c-gray": "#4b5563",
  "c-green": "#16a34a",
  "c-red": "#dc2626",
};

export default function TopicsView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: tags, loading: tagsLoading } = useTags();
  const { data: nodes, loading: nodesLoading } = useTagTimeline(slug);

  // Auto-redirect to first tag if none selected
  useEffect(() => {
    if (!slug && tags.length > 0) {
      navigate(`/weekly-mindmap/topics/${tags[0].slug}`, { replace: true });
    }
  }, [slug, tags, navigate]);

  const activeTag = tags.find((t) => t.slug === slug);

  if (tagsLoading) {
    return (
      <div className="wm-root">
        <ViewToolbar />
        <div className="wm-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="wm-root">
      <ViewToolbar />

      <div className="wm-topics-layout">
        {/* Sidebar */}
        <aside className="wm-topics-sidebar">
          <div className="wm-topics-sidebar-label">Topics</div>
          {tags.map((tag) => (
            <Link
              key={tag.slug}
              to={`/weekly-mindmap/topics/${tag.slug}`}
              className={`wm-topics-tag-item ${tag.slug === slug ? "active" : ""}`}
            >
              <span
                className="wm-topics-tag-dot"
                style={{ background: TAG_BORDER[tag.color] ?? "#94a3b8" }}
              />
              <span>{tag.name}</span>
            </Link>
          ))}
        </aside>

        {/* Main */}
        <main className="wm-topics-main">
          {activeTag && (
            <div className="wm-topics-header">
              <h2 className="wm-topics-title">{activeTag.name}</h2>
              {activeTag.description && (
                <p className="wm-topics-desc">{activeTag.description}</p>
              )}
            </div>
          )}

          {nodesLoading ? (
            <div className="wm-loading">Loading nodes...</div>
          ) : nodes.length === 0 ? (
            <div className="wm-loading">No nodes found for this topic.</div>
          ) : (
            <div className="wm-topics-timeline">
              {nodes.map((node) => (
                <Link
                  key={node.id}
                  to={`/weekly-mindmap/nodes/${node.id}`}
                  className={`wm-topics-card ${node.color}`}
                >
                  <div className="wm-topics-card-date">{node.report_id}</div>
                  <div className="wm-topics-card-title">{node.title}</div>
                  {node.subtitle && (
                    <div className="wm-topics-card-subtitle">{node.subtitle}</div>
                  )}
                  {node.summary && (
                    <div className="wm-topics-card-summary">{node.summary}</div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
