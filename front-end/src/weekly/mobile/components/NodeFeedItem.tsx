import { useNavigate } from "react-router-dom";
import { useTimelineStore } from "../../store/timelineStore";
import type { NodeDetail, NodeColor } from "../../types";

interface NodeFeedItemProps {
  node: NodeDetail;
  reportDate: string;
}

const COLOR_PALETTE: Record<
  NodeColor,
  { bg: string; title: string; subtitle: string; body: string; border: string }
> = {
  "c-amber":  { bg: "#FAEEDA", title: "#412402", subtitle: "#854F0B", body: "#633806", border: "#FAC775" },
  "c-blue":   { bg: "#E6F1FB", title: "#042C53", subtitle: "#185FA5", body: "#0C447C", border: "#85B7EB" },
  "c-teal":   { bg: "#E1F5EE", title: "#04342C", subtitle: "#0F6E56", body: "#085041", border: "#5DCAA5" },
  "c-purple": { bg: "#EEEDFE", title: "#26215C", subtitle: "#534AB7", body: "#3C3489", border: "#AFA9EC" },
  "c-coral":  { bg: "#FAECE7", title: "#4A1B0C", subtitle: "#993C1D", body: "#712B13", border: "#F0997B" },
  "c-pink":   { bg: "#FBEAF0", title: "#4B1528", subtitle: "#993556", body: "#72243E", border: "#ED93B1" },
  "c-gray":   { bg: "#F1EFE8", title: "#2C2C2A", subtitle: "#5F5E5A", body: "#444441", border: "#B4B2A9" },
  "c-green":  { bg: "#EAF3DE", title: "#173404", subtitle: "#3B6D11", body: "#27500A", border: "#97C459" },
  "c-red":    { bg: "#FCEBEB", title: "#501313", subtitle: "#A32D2D", body: "#791F1F", border: "#F09595" },
};

const SUMMARY_LIMIT = 100;

export function NodeFeedItem({ node, reportDate }: NodeFeedItemProps) {
  const navigate = useNavigate();
  const linkIndex = useTimelineStore((s) => s.linkIndex);
  const tagMap = useTimelineStore((s) => s.tagMap);
  const palette = COLOR_PALETTE[node.color] || COLOR_PALETTE["c-gray"];

  const linkCount = linkIndex?.node_link_count[node.id] || 0;

  const summary = node.summary || "";
  const summaryDisplay =
    summary.length > SUMMARY_LIMIT
      ? summary.slice(0, SUMMARY_LIMIT) + "\u22EF"
      : summary;

  const handleClick = () => {
    navigate(`/weekly-mindmap/nodes/${node.id}`);
  };

  const tags = node.tags || [];

  return (
    <article
      className="node-feed-item"
      style={{ background: palette.bg }}
      onClick={handleClick}
    >
      <h2 className="node-feed-title" style={{ color: palette.title }}>
        {node.title}
      </h2>

      {node.subtitle && (
        <div className="node-feed-subtitle" style={{ color: palette.subtitle }}>
          {node.subtitle}
        </div>
      )}

      {summaryDisplay && (
        <p className="node-feed-summary" style={{ color: palette.body }}>
          {summaryDisplay}
        </p>
      )}

      <div
        className="node-feed-footer"
        style={{ borderTopColor: palette.border }}
      >
        {linkCount > 0 && (
          <span
            className="node-feed-link-count"
            style={{ color: palette.subtitle }}
          >
            ↗ {linkCount} 处关联
          </span>
        )}

        <div className="node-feed-tags">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="node-feed-tag"
              style={{
                color: palette.subtitle,
                background: "rgba(255,255,255,0.5)",
              }}
            >
              {tagMap[tag] || tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
