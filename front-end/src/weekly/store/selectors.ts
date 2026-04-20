import type { LinkType, LinkDetail } from "../types";

export interface VisibilityInputs {
  hoveredNodeId: string | null;
  focusedNodeId: string | null;
  showAllLinks: boolean;
  visibleTypes: Set<LinkType>;
  nodeToLinks: Record<string, string[]>;
  linksById: Record<string, LinkDetail>;
}

/**
 * Determine which links should be rendered.
 * Priority: focused > hovered > showAll > none
 */
export function getVisibleLinkIds(inputs: VisibilityInputs): Set<string> {
  const { hoveredNodeId, focusedNodeId, showAllLinks, visibleTypes, nodeToLinks, linksById } = inputs;

  const activeNode = focusedNodeId || hoveredNodeId;

  if (activeNode) {
    const ids = nodeToLinks[activeNode] || [];
    return new Set(
      ids.filter((id) => {
        const link = linksById[id];
        return link && visibleTypes.has(link.type);
      }),
    );
  }

  if (showAllLinks) {
    return new Set(
      Object.values(linksById)
        .filter((l) => visibleTypes.has(l.type))
        .map((l) => l.id),
    );
  }

  return new Set();
}

/**
 * Determine a node's opacity.
 * No active node: all 1. Active: self + neighbors = 1, others = 0.25.
 */
export function getNodeOpacity(
  nodeId: string,
  inputs: VisibilityInputs,
): number {
  const activeNode = inputs.focusedNodeId || inputs.hoveredNodeId;
  if (!activeNode) return 1;
  if (nodeId === activeNode) return 1;

  const activeLinkIds = inputs.nodeToLinks[activeNode] || [];
  const neighbors = new Set<string>();
  for (const linkId of activeLinkIds) {
    const link = inputs.linksById[linkId];
    if (!link) continue;
    if (link.from_node_id === activeNode) neighbors.add(link.to_node_id);
    if (link.to_node_id === activeNode) neighbors.add(link.from_node_id);
  }

  return neighbors.has(nodeId) ? 1 : 0.25;
}

/**
 * Node visual state for styling.
 */
export type NodeVisualState = "active" | "neighbor" | "dimmed" | "normal";

export function getNodeVisualState(
  nodeId: string,
  inputs: VisibilityInputs,
): NodeVisualState {
  const activeNode = inputs.focusedNodeId || inputs.hoveredNodeId;
  if (!activeNode) return "normal";
  if (nodeId === activeNode) return "active";

  const activeLinkIds = inputs.nodeToLinks[activeNode] || [];
  for (const linkId of activeLinkIds) {
    const link = inputs.linksById[linkId];
    if (!link) continue;
    if (link.from_node_id === nodeId || link.to_node_id === nodeId) return "neighbor";
  }

  return "dimmed";
}
