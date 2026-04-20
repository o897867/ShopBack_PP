import { useEffect, useMemo, useState } from "react";
import type { LinkDetail, LinkType } from "../types";
import { useTimelineStore } from "../store/timelineStore";
import { getVisibleLinkIds, type VisibilityInputs } from "../store/selectors";

/* ── Style helpers ── */

const LINK_COLORS: Record<LinkType, string> = {
  evolution: "#2563eb",
  causation: "#ea580c",
  contrast: "#4b5563",
  resonance: "#9333ea",
};

function getDasharray(type: LinkType): string | undefined {
  switch (type) {
    case "evolution":
    case "causation":
      return undefined;
    case "contrast":
      return "6,4";
    case "resonance":
      return "2,3";
  }
}

function getStrengthOpacity(strength: number): number {
  if (strength >= 3) return 0.7;
  if (strength === 2) return 0.5;
  return 0.35;
}

/* ── Label layout types & constants ── */

interface LabelLayout {
  linkId: string;
  text: string;
  color: string;
  x: number;
  y: number;
  idealY: number;
  flipped: boolean;
}

const LABEL_MIN_GAP = 22;
const LABEL_X_OVERLAP_THRESHOLD = 80;
const LABEL_OFFSET_FROM_LINE = 25;
const TIMELINE_TOP_PADDING = 12;

/* ── Text width estimation ── */

function getTextWidth(text: string): number {
  return text.split("").reduce((sum, ch) => {
    return sum + (/[\u4e00-\u9fa5]/.test(ch) ? 11 : 6);
  }, 0);
}

/* ── Label collision avoidance ── */

function computeLabelLayouts(
  links: Array<{ link: LinkDetail; fromEl: HTMLElement; toEl: HTMLElement }>,
  containerEl: HTMLElement,
): Map<string, LabelLayout> {
  const cRect = containerEl.getBoundingClientRect();
  const scrollLeft = containerEl.scrollLeft;
  const scrollTop = containerEl.scrollTop;

  // Step 1: compute ideal positions
  const layouts: LabelLayout[] = links
    .filter(({ link }) => !!link.label)
    .map(({ link, fromEl, toEl }) => {
      const fRect = fromEl.getBoundingClientRect();
      const tRect = toEl.getBoundingClientRect();

      const fromX = fRect.left + fRect.width / 2 - cRect.left + scrollLeft;
      const toX = tRect.left + tRect.width / 2 - cRect.left + scrollLeft;
      const fromY = fRect.top + fRect.height / 2 - cRect.top + scrollTop;
      const toY = tRect.top + tRect.height / 2 - cRect.top + scrollTop;

      const x = (fromX + toX) / 2;
      const idealY = Math.min(fromY, toY) - LABEL_OFFSET_FROM_LINE;

      return {
        linkId: link.id,
        text: link.label!,
        color: LINK_COLORS[link.type],
        x,
        y: idealY,
        idealY,
        flipped: false,
      };
    });

  // Step 2: sort by y ascending
  layouts.sort((a, b) => a.y - b.y);

  // Step 3: push down overlapping labels (only when x is close)
  for (let i = 1; i < layouts.length; i++) {
    const current = layouts[i];
    let ceiling = -Infinity;
    for (let j = 0; j < i; j++) {
      const prev = layouts[j];
      if (Math.abs(prev.x - current.x) < LABEL_X_OVERLAP_THRESHOLD) {
        ceiling = Math.max(ceiling, prev.y + LABEL_MIN_GAP);
      }
    }
    if (ceiling !== -Infinity && current.y < ceiling) {
      current.y = ceiling;
    }
  }

  // Step 4: flip labels pushed too far from their ideal position
  for (const layout of layouts) {
    const overflow = layout.y - layout.idealY;
    if (overflow > 60) {
      layout.y = layout.idealY + LABEL_OFFSET_FROM_LINE * 2 + (overflow - 60);
      layout.flipped = true;
    }
  }

  // Step 5: clamp to top
  for (const layout of layouts) {
    if (layout.y < TIMELINE_TOP_PADDING) {
      layout.y = TIMELINE_TOP_PADDING;
    }
  }

  return new Map(layouts.map((l) => [l.linkId, l]));
}

/* ── Geometry ── */

function computePath(
  fromEl: HTMLElement,
  toEl: HTMLElement,
  container: HTMLElement,
): string {
  const cRect = container.getBoundingClientRect();
  const fRect = fromEl.getBoundingClientRect();
  const tRect = toEl.getBoundingClientRect();
  const scrollLeft = container.scrollLeft;
  const scrollTop = container.scrollTop;

  const fromCenterX = fRect.left + fRect.width / 2 - cRect.left + scrollLeft;
  const toCenterX = tRect.left + tRect.width / 2 - cRect.left + scrollLeft;

  let startX: number, endX: number;
  if (fromCenterX > toCenterX) {
    startX = fRect.left - cRect.left + scrollLeft;
    endX = tRect.right - cRect.left + scrollLeft;
  } else {
    startX = fRect.right - cRect.left + scrollLeft;
    endX = tRect.left - cRect.left + scrollLeft;
  }

  const startY = fRect.top + fRect.height / 2 - cRect.top + scrollTop;
  const endY = tRect.top + tRect.height / 2 - cRect.top + scrollTop;

  const midX = (startX + endX) / 2;
  const midY = Math.min(startY, endY) - 20;

  return `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
}

/* ── LabelWithLeader sub-component ── */

function LabelWithLeader({
  x, y, idealY, text, color, flipped,
}: {
  x: number; y: number; idealY: number;
  text: string; color: string; flipped: boolean;
}) {
  const offset = Math.abs(y - idealY);
  const needsLeader = offset > 8;
  const leaderTargetY = flipped
    ? idealY + 8
    : idealY + LABEL_OFFSET_FROM_LINE - 4;

  const tw = getTextWidth(text) + 12;

  return (
    <>
      {needsLeader && (
        <line
          x1={x}
          y1={y + (flipped ? -4 : 4)}
          x2={x}
          y2={leaderTargetY}
          stroke={color}
          strokeWidth={0.5}
          opacity={0.4}
          style={{ pointerEvents: "none" }}
        />
      )}
      <rect
        x={x - tw / 2}
        y={y - 10}
        width={tw}
        height={18}
        rx={9}
        fill="#fff"
        stroke={color}
        strokeWidth={0.5}
        opacity={0.95}
        style={{ pointerEvents: "none" }}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={500}
        fill={color}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {text}
      </text>
    </>
  );
}

/* ── LinkPath sub-component ── */

interface LinkPathProps {
  link: LinkDetail;
  fromEl: HTMLElement;
  toEl: HTMLElement;
  containerEl: HTMLElement;
  isHovered: boolean;
  showLabel: boolean;
  labelLayout: LabelLayout | undefined;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function LinkPath({
  link,
  fromEl,
  toEl,
  containerEl,
  isHovered,
  showLabel,
  labelLayout,
  onMouseEnter,
  onMouseLeave,
}: LinkPathProps) {
  const path = computePath(fromEl, toEl, containerEl);
  const color = LINK_COLORS[link.type];
  const dasharray = getDasharray(link.type);
  const opacity = isHovered ? 1 : getStrengthOpacity(link.strength);
  const strokeWidth = isHovered ? 2 : 1.5;

  return (
    <g
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: "pointer" }}
    >
      {/* Invisible wide hit area */}
      <path d={path} stroke="transparent" strokeWidth={12} fill="none" />

      {/* Visible line */}
      <path
        d={path}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dasharray}
        fill="none"
        opacity={opacity}
        markerEnd={link.type === "causation" ? "url(#arrow-causation)" : undefined}
        style={{ pointerEvents: "none" }}
      />

      {/* Label with collision-avoidance layout */}
      {showLabel && labelLayout && (
        <LabelWithLeader
          x={labelLayout.x}
          y={labelLayout.y}
          idealY={labelLayout.idealY}
          text={labelLayout.text}
          color={color}
          flipped={labelLayout.flipped}
        />
      )}
    </g>
  );
}

/* ── Main LinkLayer ── */

interface Props {
  nodeRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function LinkLayer({ nodeRefs, containerRef }: Props) {
  const {
    linkIndex,
    hoveredNodeId,
    focusedNodeId,
    hoveredLinkId,
    visibleTypes,
    showAllLinks,
  } = useTimelineStore();
  const setHoveredLink = useTimelineStore((s) => s.setHoveredLink);

  const [version, setVersion] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Recalc on resize / scroll
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const container = containerRef.current;
    if (container) {
      setSize({ w: container.scrollWidth, h: container.scrollHeight });
    }

    window.addEventListener("resize", bump);
    container?.addEventListener("scroll", bump);
    return () => {
      window.removeEventListener("resize", bump);
      container?.removeEventListener("scroll", bump);
    };
  }, [containerRef]);

  // Update size on version change
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      setSize({ w: container.scrollWidth, h: container.scrollHeight });
    }
  }, [version, containerRef]);

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

  const visibleIds = useMemo(() => {
    if (!inputs) return new Set<string>();
    return getVisibleLinkIds(inputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredNodeId, focusedNodeId, showAllLinks, visibleTypes, linkIndex]);

  // Resolve visible links to their DOM elements
  const visibleLinks = useMemo(() => {
    if (!linkIndex) return [];
    return Array.from(visibleIds)
      .map((linkId) => {
        const link = linkIndex.links_by_id[linkId];
        if (!link) return null;
        const fromEl = nodeRefs.current.get(link.from_node_id);
        const toEl = nodeRefs.current.get(link.to_node_id);
        if (!fromEl || !toEl) return null;
        return { link, fromEl, toEl };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIds, linkIndex, version]);

  // Compute collision-avoidance label layouts
  const labelLayouts = useMemo(() => {
    const container = containerRef.current;
    if (!container || visibleLinks.length === 0) return new Map<string, LabelLayout>();
    return computeLabelLayouts(visibleLinks, container);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleLinks, version]);

  if (!linkIndex || visibleIds.size === 0) return null;

  const containerEl = containerRef.current;
  if (!containerEl) return null;

  const activeNode = focusedNodeId || hoveredNodeId;
  const showLabelsForAll = !!activeNode;

  return (
    <svg
      className="wm-link-layer"
      width={size.w}
      height={size.h}
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <marker
          id="arrow-causation"
          viewBox="0 0 10 7"
          refX="10"
          refY="3.5"
          markerWidth="8"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={LINK_COLORS.causation} />
        </marker>
      </defs>
      <g style={{ pointerEvents: "auto" }}>
        {visibleLinks.map(({ link, fromEl, toEl }) => (
          <LinkPath
            key={link.id}
            link={link}
            fromEl={fromEl}
            toEl={toEl}
            containerEl={containerEl}
            isHovered={hoveredLinkId === link.id}
            showLabel={showLabelsForAll || hoveredLinkId === link.id}
            labelLayout={labelLayouts.get(link.id)}
            onMouseEnter={() => setHoveredLink(link.id)}
            onMouseLeave={() => setHoveredLink(null)}
          />
        ))}
      </g>
    </svg>
  );
}
