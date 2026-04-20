import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { ReportDetail } from "../types";
import { useTimelineStore } from "../store/timelineStore";
import { getNodeVisualState, type VisibilityInputs } from "../store/selectors";
import NodeCard from "./NodeCard";

interface Props {
  report: ReportDetail;
  nodeRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
}

export default function ReportColumn({ report, nodeRefs }: Props) {
  const {
    hoveredNodeId,
    focusedNodeId,
    visibleTypes,
    showAllLinks,
    linkIndex,
    tagMap,
  } = useTimelineStore();
  const setHovered = useTimelineStore((s) => s.setHovered);
  const setFocused = useTimelineStore((s) => s.setFocused);
  const navigate = useNavigate();

  const refCallback = useCallback(
    (nodeId: string) => (el: HTMLDivElement | null) => {
      if (el) nodeRefs.current.set(nodeId, el);
      else nodeRefs.current.delete(nodeId);
    },
    [nodeRefs],
  );

  const inputs: VisibilityInputs | null = linkIndex
    ? {
        hoveredNodeId,
        focusedNodeId,
        showAllLinks,
        visibleTypes,
        nodeToLinks: linkIndex.node_to_links,
        linksById: linkIndex.links_by_id,
      }
    : null;

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
        <div className="wm-column-author">{report.author}</div>
      </div>
      {report.nodes
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((node) => (
          <NodeCard
            key={node.id}
            ref={refCallback(node.id)}
            node={node}
            visualState={inputs ? getNodeVisualState(node.id, inputs) : "normal"}
            linkCount={linkIndex?.node_link_count[node.id] || 0}
            tagMap={tagMap}
            onHover={setHovered}
            onClick={() => {
              if (focusedNodeId === node.id) {
                navigate(`/weekly-mindmap/nodes/${node.id}`);
              } else {
                setFocused(node.id);
              }
            }}
          />
        ))}
    </div>
  );
}
