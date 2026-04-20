import { useCallback } from "react";
import type { NodeDetail, ReportDetail } from "../types";
import NodeCard from "./NodeCard";

interface Props {
  report: ReportDetail;
  nodeRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onNodeHover: (e: React.MouseEvent, node: NodeDetail) => void;
  onNodeLeave: () => void;
}

export default function ReportColumn({
  report,
  nodeRefs,
  onNodeHover,
  onNodeLeave,
}: Props) {
  const refCallback = useCallback(
    (nodeId: string) => (el: HTMLDivElement | null) => {
      if (el) nodeRefs.current.set(nodeId, el);
      else nodeRefs.current.delete(nodeId);
    },
    [nodeRefs],
  );

  return (
    <div className="wm-column">
      <div className="wm-column-header">
        <div className="wm-column-date">{report.date}</div>
        <div className="wm-column-title">
          {report.title}
          {report.ai_generated && (
            <span className="wm-ai-badge">AI 整理</span>
          )}
        </div>
      </div>
      {report.nodes
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((node) => (
          <NodeCard
            key={node.id}
            ref={refCallback(node.id)}
            node={node}
            onMouseEnter={onNodeHover}
            onMouseLeave={onNodeLeave}
          />
        ))}
    </div>
  );
}
