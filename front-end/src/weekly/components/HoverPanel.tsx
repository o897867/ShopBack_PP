import type { LinkDetail, NodeDetail } from "../types";
import { TYPE_LABELS } from "../utils/linkStyles";

interface Props {
  node: NodeDetail;
  links: LinkDetail[];
  position: { x: number; y: number };
}

export default function HoverPanel({ node, links, position }: Props) {
  // Keep panel within viewport
  const style: React.CSSProperties = {
    left: position.x + 16,
    top: position.y,
    maxHeight: "70vh",
    overflowY: "auto",
  };

  return (
    <div className="wm-hover" style={style}>
      <div className="wm-hover-title">{node.title}</div>
      {node.summary && <div className="wm-hover-summary">{node.summary}</div>}

      {node.key_points && node.key_points.length > 0 && (
        <ul className="wm-hover-kp">
          {node.key_points.map((kp, i) => (
            <li key={i}>{kp}</li>
          ))}
        </ul>
      )}

      {links.length > 0 && (
        <div className="wm-hover-links">
          {links.map((l) => (
            <div key={l.id} className="wm-hover-link">
              <span className="wm-hover-link-type">
                {TYPE_LABELS[l.type] ?? l.type}
              </span>
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
