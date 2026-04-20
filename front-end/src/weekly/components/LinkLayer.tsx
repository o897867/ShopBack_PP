import { useCallback, useEffect, useState } from "react";
import type { LinkDetail, LinkType } from "../types";
import { STROKE_COLORS, dashArray, hasArrow, strengthOpacity } from "../utils/linkStyles";

interface Props {
  links: LinkDetail[];
  nodeRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  visible: boolean;
}

interface LinePath {
  id: string;
  type: LinkType;
  label: string | null;
  strength: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export default function LinkLayer({ links, nodeRefs, containerRef, visible }: Props) {
  const [paths, setPaths] = useState<LinePath[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hovered, setHovered] = useState<{ id: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!visible) { setPaths([]); return; }

    function recalc() {
      const container = containerRef.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      setSize({ w: container.scrollWidth, h: container.scrollHeight });

      const next: LinePath[] = [];
      for (const link of links) {
        const fromEl = nodeRefs.current.get(link.from_node_id);
        const toEl = nodeRefs.current.get(link.to_node_id);
        if (!fromEl || !toEl) continue;

        const fRect = fromEl.getBoundingClientRect();
        const tRect = toEl.getBoundingClientRect();

        // Positions relative to container's scroll-aware origin
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;

        const x1 = fRect.right - cRect.left + scrollLeft;
        const y1 = fRect.top + fRect.height / 2 - cRect.top + scrollTop;
        const x2 = tRect.left - cRect.left + scrollLeft;
        const y2 = tRect.top + tRect.height / 2 - cRect.top + scrollTop;

        next.push({ id: link.id, type: link.type, label: link.label, strength: link.strength, x1, y1, x2, y2 });
      }
      setPaths(next);
    }

    // Initial calc + debounced resize
    const timer = setTimeout(recalc, 50);
    window.addEventListener("resize", recalc);
    const container = containerRef.current;
    container?.addEventListener("scroll", recalc);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", recalc);
      container?.removeEventListener("scroll", recalc);
    };
  }, [links, nodeRefs, containerRef, visible]);

  const onLinkEnter = useCallback((e: React.MouseEvent, p: LinePath) => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    setHovered({
      id: p.id,
      x: e.clientX - cRect.left + container.scrollLeft,
      y: e.clientY - cRect.top + container.scrollTop,
    });
  }, [containerRef]);

  const onLinkMove = useCallback((e: React.MouseEvent) => {
    if (!hovered) return;
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    setHovered((prev) =>
      prev
        ? { ...prev, x: e.clientX - cRect.left + container.scrollLeft, y: e.clientY - cRect.top + container.scrollTop }
        : null,
    );
  }, [hovered, containerRef]);

  if (!visible || paths.length === 0) return null;

  const hoveredPath = hovered ? paths.find((p) => p.id === hovered.id) : null;

  return (
    <svg className="wm-link-layer" width={size.w} height={size.h} onMouseMove={onLinkMove}>
      <defs>
        {/* Arrow markers per color */}
        {Object.entries(STROKE_COLORS).map(([type, color]) => (
          <marker
            key={type}
            id={`arrow-${type}`}
            viewBox="0 0 10 7"
            refX="10"
            refY="3.5"
            markerWidth="8"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={color} />
          </marker>
        ))}
      </defs>
      {paths.map((p) => {
        const midX = (p.x1 + p.x2) / 2;
        const d = `M ${p.x1} ${p.y1} C ${midX} ${p.y1}, ${midX} ${p.y2}, ${p.x2} ${p.y2}`;
        const isHovered = hovered?.id === p.id;
        const opacity = isHovered ? 1 : strengthOpacity(p.strength);
        return (
          <g key={p.id}>
            {/* Invisible wide hit area for hover */}
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={12}
              onMouseEnter={(e) => onLinkEnter(e, p)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            />
            <path
              d={d}
              fill="none"
              stroke={STROKE_COLORS[p.type]}
              strokeWidth={1.5}
              strokeDasharray={dashArray(p.type)}
              markerEnd={hasArrow(p.type) ? `url(#arrow-${p.type})` : undefined}
              opacity={opacity}
              style={{ pointerEvents: "none" }}
            />
            {p.label && (() => {
              const lw = p.label.length * 7 + 12;
              const lx = midX;
              const ly = (p.y1 + p.y2) / 2 - 6;
              return (
                <>
                  <rect
                    x={lx - lw / 2}
                    y={ly - 10}
                    width={lw}
                    height={18}
                    rx={9}
                    fill="#fff"
                    stroke={STROKE_COLORS[p.type]}
                    strokeWidth={0.5}
                    opacity={0.95}
                    style={{ pointerEvents: "none" }}
                  />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={11}
                    fontWeight={500}
                    fill={STROKE_COLORS[p.type]}
                    style={{ pointerEvents: "none" }}
                  >
                    {p.label}
                  </text>
                </>
              );
            })()}
          </g>
        );
      })}

      {/* Hover tooltip */}
      {hoveredPath && hovered && hoveredPath.label && (
        <g>
          <rect
            x={hovered.x + 10}
            y={hovered.y - 14}
            width={hoveredPath.label.length * 8 + 16}
            height={22}
            rx={4}
            fill="#1e293b"
            opacity={0.9}
          />
          <text
            x={hovered.x + 10 + 8}
            y={hovered.y}
            dominantBaseline="central"
            fontSize={11}
            fill="#fff"
          >
            {hoveredPath.label}
          </text>
        </g>
      )}
    </svg>
  );
}
