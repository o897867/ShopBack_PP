import { forwardRef } from "react";
import type { NodeDetail } from "../types";

interface Props {
  node: NodeDetail;
  onMouseEnter: (e: React.MouseEvent, node: NodeDetail) => void;
  onMouseLeave: () => void;
}

const NodeCard = forwardRef<HTMLDivElement, Props>(
  ({ node, onMouseEnter, onMouseLeave }, ref) => (
    <div
      ref={ref}
      className={`wm-node ${node.color}`}
      data-node-id={node.id}
      onMouseEnter={(e) => onMouseEnter(e, node)}
      onMouseLeave={onMouseLeave}
    >
      <div className="wm-node-title">{node.title}</div>
      {node.subtitle && <div className="wm-node-subtitle">{node.subtitle}</div>}
      {node.tags && node.tags.length > 0 && (
        <div className="wm-node-tags">
          {node.tags.map((t) => (
            <span key={t} className="wm-node-tag">{t}</span>
          ))}
        </div>
      )}
    </div>
  ),
);

NodeCard.displayName = "NodeCard";
export default NodeCard;
