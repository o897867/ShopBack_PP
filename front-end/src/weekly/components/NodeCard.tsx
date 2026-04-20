import { forwardRef, type CSSProperties } from "react";
import type { NodeDetail, NodeColor } from "../types";
import type { NodeVisualState } from "../store/selectors";

interface Props {
  node: NodeDetail;
  visualState: NodeVisualState;
  linkCount: number;
  tagMap?: Record<string, string>;
  onHover: (id: string | null) => void;
  onClick: () => void;
}

/* ── Color helpers ── */

const COLOR_MAP: Record<string, { bg50: string; border400: string; border600: string; boxShadow50: string }> = {
  amber:  { bg50: "#fffbeb", border400: "#d97706", border600: "#92400e", boxShadow50: "rgba(217,119,6,0.15)" },
  blue:   { bg50: "#eff6ff", border400: "#3b82f6", border600: "#2563eb", boxShadow50: "rgba(37,99,235,0.15)" },
  teal:   { bg50: "#f0fdfa", border400: "#14b8a6", border600: "#0d9488", boxShadow50: "rgba(13,148,136,0.15)" },
  purple: { bg50: "#faf5ff", border400: "#a855f7", border600: "#9333ea", boxShadow50: "rgba(147,51,234,0.15)" },
  coral:  { bg50: "#fff7ed", border400: "#f97316", border600: "#ea580c", boxShadow50: "rgba(234,88,12,0.15)" },
  pink:   { bg50: "#fdf2f8", border400: "#ec4899", border600: "#db2777", boxShadow50: "rgba(219,39,119,0.15)" },
  gray:   { bg50: "#f9fafb", border400: "#9ca3af", border600: "#4b5563", boxShadow50: "rgba(75,85,99,0.15)" },
  green:  { bg50: "#f0fdf4", border400: "#22c55e", border600: "#16a34a", boxShadow50: "rgba(22,163,74,0.15)" },
  red:    { bg50: "#fef2f2", border400: "#ef4444", border600: "#dc2626", boxShadow50: "rgba(220,38,38,0.15)" },
};

function getColorName(color: NodeColor): string {
  return color.replace("c-", "");
}

function getCardStyle(state: NodeVisualState, color: NodeColor): CSSProperties {
  const name = getColorName(color);
  const c = COLOR_MAP[name] || COLOR_MAP.gray;

  const base: CSSProperties = {
    transition: "opacity 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
  };

  switch (state) {
    case "active":
      return {
        ...base,
        background: c.bg50,
        border: `1.5px solid ${c.border600}`,
        boxShadow: `0 0 0 3px ${c.boxShadow50}`,
        opacity: 1,
      };
    case "neighbor":
      return {
        ...base,
        background: c.bg50,
        border: `1px solid ${c.border400}`,
        opacity: 1,
      };
    case "dimmed":
      return { ...base, opacity: 0.06 };
    case "normal":
    default:
      return { ...base, opacity: 1 };
  }
}

const NodeCard = forwardRef<HTMLDivElement, Props>(
  ({ node, visualState, linkCount, tagMap, onHover, onClick }, ref) => (
    <div
      ref={ref}
      className={`wm-node ${node.color}`}
      data-node-id={node.id}
      style={getCardStyle(visualState, node.color)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <div className="wm-node-header">
        <div className="wm-node-title">{node.title}</div>
        {linkCount > 0 && (
          <span className={`wm-link-badge${linkCount >= 4 ? " is-hub" : ""}`}>
            {linkCount}
          </span>
        )}
      </div>
      {node.subtitle && <div className="wm-node-subtitle">{node.subtitle}</div>}
      {node.tags && node.tags.length > 0 && (
        <div className="wm-node-tags">
          {node.tags.map((t) => (
            <span key={t} className="wm-node-tag">{tagMap?.[t] || t}</span>
          ))}
        </div>
      )}
    </div>
  ),
);

NodeCard.displayName = "NodeCard";
export default NodeCard;
