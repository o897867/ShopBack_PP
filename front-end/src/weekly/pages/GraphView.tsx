import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { weeklyApi } from "../api/weeklyApi";
import type { NodeDetail, LinkDetail, ReportSummary } from "../types";
import React from "react";
import { STROKE_COLORS, dashArray, hasArrow, strengthOpacity } from "../utils/linkStyles";
import HoverPanel from "../components/HoverPanel";
import ViewToolbar from "../components/ViewToolbar";
import "../weekly.css";

/* ── Types ── */

interface GroupData {
  reportId: string;
  date: string;
  title: string;
  nodeCount: number;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  isGroup: boolean;
  nodeData?: NodeDetail;
  groupData?: GroupData;
}

interface AggLinkData {
  id: string;
  fromId: string;
  toId: string;
  count: number;
  dominantType: LinkDetail["type"];
  dominantStrength: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  linkData?: LinkDetail;
  aggData?: AggLinkData;
}

/* ── Constants ── */

const NODE_W = 160;
const NODE_H = 48;
const NODE_RX = 8;
const GROUP_W = 180;
const GROUP_H = 64;
const GROUP_RX = 12;

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  "c-amber":  { bg: "#fffbeb", border: "#d97706", text: "#92400e" },
  "c-blue":   { bg: "#eff6ff", border: "#2563eb", text: "#1e40af" },
  "c-teal":   { bg: "#f0fdfa", border: "#0d9488", text: "#115e59" },
  "c-purple": { bg: "#faf5ff", border: "#9333ea", text: "#6b21a8" },
  "c-coral":  { bg: "#fff7ed", border: "#ea580c", text: "#9a3412" },
  "c-pink":   { bg: "#fdf2f8", border: "#db2777", text: "#9d174d" },
  "c-gray":   { bg: "#f9fafb", border: "#4b5563", text: "#1f2937" },
  "c-green":  { bg: "#f0fdf4", border: "#16a34a", text: "#166534" },
  "c-red":    { bg: "#fef2f2", border: "#dc2626", text: "#991b1b" },
};

/* ── Helpers ── */

/** Which report does this node belong to? */
function nodeReportId(nodeId: string, nodeMap: Map<string, NodeDetail>): string | undefined {
  return nodeMap.get(nodeId)?.report_id;
}

/** Build aggregated group-to-group links */
function aggregateLinks(
  links: LinkDetail[],
  nodeMap: Map<string, NodeDetail>,
  expanded: Set<string>,
): { individual: LinkDetail[]; aggregated: AggLinkData[] } {
  const individual: LinkDetail[] = [];
  // key = "reportA|reportB" (sorted), value = links in that pair
  const pairBuckets = new Map<string, LinkDetail[]>();

  for (const link of links) {
    const fromReport = nodeReportId(link.from_node_id, nodeMap);
    const toReport = nodeReportId(link.to_node_id, nodeMap);
    if (!fromReport || !toReport) continue;

    const fromExpanded = expanded.has(fromReport);
    const toExpanded = expanded.has(toReport);

    if (fromExpanded && toExpanded) {
      individual.push(link);
    } else if (!fromExpanded && !toExpanded) {
      // Both collapsed → aggregate
      if (fromReport === toReport) continue; // same report, skip
      const key = [fromReport, toReport].sort().join("|");
      if (!pairBuckets.has(key)) pairBuckets.set(key, []);
      pairBuckets.get(key)!.push(link);
    } else {
      // Mixed: one expanded, one collapsed → show individual but reroute collapsed end to group
      individual.push(link);
    }
  }

  const aggregated: AggLinkData[] = [];
  for (const [key, bucket] of pairBuckets) {
    const [rA, rB] = key.split("|");
    // Find dominant type (most frequent)
    const typeCounts = new Map<string, number>();
    let maxStrength = 1;
    for (const l of bucket) {
      typeCounts.set(l.type, (typeCounts.get(l.type) ?? 0) + 1);
      if (l.strength > maxStrength) maxStrength = l.strength;
    }
    let dominantType = bucket[0].type;
    let maxCount = 0;
    for (const [t, c] of typeCounts) {
      if (c > maxCount) { maxCount = c; dominantType = t as LinkDetail["type"]; }
    }
    aggregated.push({
      id: `agg-${key}`,
      fromId: `group-${rA}`,
      toId: `group-${rB}`,
      count: bucket.length,
      dominantType,
      dominantStrength: maxStrength,
    });
  }

  return { individual, aggregated };
}

/* ── Component ── */

export default function GraphView() {
  const navigate = useNavigate();
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simLinks, setSimLinks] = useState<SimLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<{
    node: NodeDetail;
    links: LinkDetail[];
    pos: { x: number; y: number };
  } | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<{
    group: GroupData;
    nodes: NodeDetail[];
    pos: { x: number; y: number };
  } | null>(null);

  const dragRef = useRef<{ idx: number; ox: number; oy: number } | null>(null);
  const simulationRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);
  // Raw data refs — survive across rebuilds
  const reportsRef = useRef<ReportSummary[]>([]);
  const allNodesRef = useRef<NodeDetail[]>([]);
  const allLinksRef = useRef<LinkDetail[]>([]);
  const nodeMapRef = useRef<Map<string, NodeDetail>>(new Map());
  const reportNodesRef = useRef<Map<string, NodeDetail[]>>(new Map());
  // Track last-known positions of group nodes so children start there
  const lastGroupPosRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  /* ── Build / Rebuild simulation ── */
  const buildSimulation = useCallback((expanded: Set<string>) => {
    const reports = reportsRef.current;
    const nodeMap = nodeMapRef.current;
    const reportNodes = reportNodesRef.current;
    const allLinks = allLinksRef.current;

    // Stop previous
    simulationRef.current?.stop();

    // Build SimNodes
    const sNodes: SimNode[] = [];
    const angleStep = (2 * Math.PI) / Math.max(reports.length, 1);
    const radius = 200;

    reports.forEach((r, i) => {
      const children = reportNodes.get(r.id) ?? [];
      if (expanded.has(r.id)) {
        // Expanded → add individual nodes
        const groupPos = lastGroupPosRef.current.get(r.id);
        const cx = groupPos?.x ?? Math.cos(i * angleStep) * radius;
        const cy = groupPos?.y ?? Math.sin(i * angleStep) * radius;
        children.forEach((node, j) => {
          const angle = (2 * Math.PI * j) / Math.max(children.length, 1);
          const spread = 80;
          sNodes.push({
            id: node.id,
            isGroup: false,
            nodeData: node,
            x: cx + Math.cos(angle) * spread,
            y: cy + Math.sin(angle) * spread,
          });
        });
      } else {
        // Collapsed → group node
        const prevPos = lastGroupPosRef.current.get(r.id);
        sNodes.push({
          id: `group-${r.id}`,
          isGroup: true,
          groupData: {
            reportId: r.id,
            date: r.date,
            title: r.title,
            nodeCount: children.length,
          },
          x: prevPos?.x ?? Math.cos(i * angleStep) * radius,
          y: prevPos?.y ?? Math.sin(i * angleStep) * radius,
        });
      }
    });

    // Build links
    const { individual, aggregated } = aggregateLinks(allLinks, nodeMap, expanded);

    const idToIdx = new Map<string, number>();
    sNodes.forEach((sn, i) => idToIdx.set(sn.id, i));

    const sLinks: SimLink[] = [];

    // Aggregated group→group
    for (const agg of aggregated) {
      const si = idToIdx.get(agg.fromId);
      const ti = idToIdx.get(agg.toId);
      if (si == null || ti == null) continue;
      sLinks.push({ source: si, target: ti, aggData: agg });
    }

    // Individual links (may reference groups for mixed case)
    for (const link of individual) {
      const fromReport = nodeReportId(link.from_node_id, nodeMap);
      const toReport = nodeReportId(link.to_node_id, nodeMap);
      if (!fromReport || !toReport) continue;

      const fromId = expanded.has(fromReport) ? link.from_node_id : `group-${fromReport}`;
      const toId = expanded.has(toReport) ? link.to_node_id : `group-${toReport}`;
      const si = idToIdx.get(fromId);
      const ti = idToIdx.get(toId);
      if (si == null || ti == null) continue;
      sLinks.push({ source: si, target: ti, linkData: link });
    }

    // Simulation
    const sim = forceSimulation<SimNode>(sNodes)
      .force("charge", forceManyBody().strength(-400))
      .force("link", forceLink<SimNode, SimLink>(sLinks).distance(200))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide<SimNode>((d) => d.isGroup ? 60 : 50))
      .on("tick", () => {
        // Track group positions
        for (const sn of sNodes) {
          if (sn.isGroup && sn.groupData) {
            lastGroupPosRef.current.set(sn.groupData.reportId, { x: sn.x ?? 0, y: sn.y ?? 0 });
          }
        }
        setSimNodes([...sNodes]);
        setSimLinks([...sLinks]);
      });

    simulationRef.current = sim;
  }, []);

  /* ── Initial fetch ── */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [reports, nodes, links] = await Promise.all([
          weeklyApi.listReports(),
          weeklyApi.listNodes(),
          weeklyApi.listLinks(),
        ]);
        if (cancelled) return;

        reportsRef.current = reports;
        allNodesRef.current = nodes;
        allLinksRef.current = links;

        const nodeMap = new Map<string, NodeDetail>();
        nodes.forEach((n) => nodeMap.set(n.id, n));
        nodeMapRef.current = nodeMap;

        const reportNodes = new Map<string, NodeDetail[]>();
        for (const n of nodes) {
          if (!reportNodes.has(n.report_id)) reportNodes.set(n.report_id, []);
          reportNodes.get(n.report_id)!.push(n);
        }
        reportNodesRef.current = reportNodes;

        buildSimulation(expandedReports);
        setLoading(false);
      } catch (e) {
        if (!cancelled) setError(e as Error);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      simulationRef.current?.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Toggle expand ── */
  const toggleExpand = useCallback((reportId: string) => {
    setExpandedReports((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) next.delete(reportId);
      else next.add(reportId);
      buildSimulation(next);
      return next;
    });
    setHoveredGroup(null);
  }, [buildSimulation]);

  /* ── Drag ── */
  const onPointerDown = useCallback(
    (e: React.PointerEvent, idx: number) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as Element).closest("g")?.setPointerCapture?.(e.pointerId);
      const node = simNodes[idx];
      dragRef.current = { idx, ox: e.clientX - (node.x ?? 0), oy: e.clientY - (node.y ?? 0) };
      node.fx = node.x;
      node.fy = node.y;
      simulationRef.current?.alphaTarget(0.3).restart();
    },
    [simNodes],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const { idx, ox, oy } = dragRef.current;
      const node = simNodes[idx];
      node.fx = e.clientX - ox;
      node.fy = e.clientY - oy;
    },
    [simNodes],
  );

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return;
    const { idx } = dragRef.current;
    const node = simNodes[idx];
    node.fx = null;
    node.fy = null;
    dragRef.current = null;
    simulationRef.current?.alphaTarget(0);
  }, [simNodes]);

  /* ── Hover & Click ── */
  const onLeafEnter = useCallback(
    (e: React.MouseEvent, nodeData: NodeDetail) => {
      const related = allLinksRef.current.filter(
        (l) => l.from_node_id === nodeData.id || l.to_node_id === nodeData.id,
      );
      setHovered({ node: nodeData, links: related, pos: { x: e.clientX, y: e.clientY } });
    },
    [],
  );

  const onGroupEnter = useCallback(
    (e: React.MouseEvent, groupData: GroupData) => {
      const nodes = reportNodesRef.current.get(groupData.reportId) ?? [];
      setHoveredGroup({ group: groupData, nodes, pos: { x: e.clientX, y: e.clientY } });
    },
    [],
  );

  const onLeafClick = useCallback(
    (nodeData: NodeDetail) => {
      if (dragRef.current) return;
      navigate(`/weekly-mindmap/nodes/${nodeData.id}`);
    },
    [navigate],
  );

  const onGroupClick = useCallback(
    (reportId: string) => {
      if (dragRef.current) return;
      toggleExpand(reportId);
    },
    [toggleExpand],
  );

  /* ── Loading / Error ── */
  if (loading) {
    return (
      <div className="wm-root">
        <ViewToolbar />
        <div className="wm-loading">Loading graph...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="wm-root">
        <ViewToolbar />
        <div className="wm-error">Error: {error.message}</div>
      </div>
    );
  }

  /* ── ViewBox ── */
  const pad = 140;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const sn of simNodes) {
    const x = sn.x ?? 0, y = sn.y ?? 0;
    const hw = sn.isGroup ? GROUP_W / 2 : NODE_W / 2;
    const hh = sn.isGroup ? GROUP_H / 2 : NODE_H / 2;
    if (x - hw < minX) minX = x - hw;
    if (y - hh < minY) minY = y - hh;
    if (x + hw > maxX) maxX = x + hw;
    if (y + hh > maxY) maxY = y + hh;
  }
  if (!isFinite(minX)) { minX = -400; minY = -300; maxX = 400; maxY = 300; }
  const vb = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;

  /* ── Render ── */
  return (
    <div className="wm-root">
      <ViewToolbar />

      <div
        className="wm-graph-container"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <svg className="wm-graph-svg" viewBox={vb} preserveAspectRatio="xMidYMid meet">
          <defs>
            {Object.entries(STROKE_COLORS).map(([type, color]) => (
              <marker
                key={type}
                id={`ga-${type}`}
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

          {/* ── Links ── */}
          {simLinks.map((sl, idx) => {
            const src = sl.source as SimNode;
            const tgt = sl.target as SimNode;

            if (sl.aggData) {
              // Aggregated group→group link
              const agg = sl.aggData;
              const mx = ((src.x ?? 0) + (tgt.x ?? 0)) / 2;
              const my = ((src.y ?? 0) + (tgt.y ?? 0)) / 2;
              const countLabel = `${agg.count} 条关联`;
              const color = STROKE_COLORS[agg.dominantType];
              return (
                <g key={agg.id}>
                  <line
                    x1={src.x ?? 0} y1={src.y ?? 0}
                    x2={tgt.x ?? 0} y2={tgt.y ?? 0}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray={dashArray(agg.dominantType)}
                    opacity={strengthOpacity(agg.dominantStrength)}
                  />
                  <rect
                    x={mx - countLabel.length * 4 - 6}
                    y={my - 10}
                    width={countLabel.length * 8 + 12}
                    height={18}
                    rx={9}
                    fill="#fff"
                    stroke={color}
                    strokeWidth={0.5}
                    opacity={0.95}
                  />
                  <text
                    x={mx} y={my}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={10}
                    fontWeight={500}
                    fill={color}
                  >
                    {countLabel}
                  </text>
                </g>
              );
            }

            // Individual link
            const lt = sl.linkData!.type;
            const mx = ((src.x ?? 0) + (tgt.x ?? 0)) / 2;
            const my = ((src.y ?? 0) + (tgt.y ?? 0)) / 2;
            const label = sl.linkData!.label;
            return (
              <g key={sl.linkData!.id}>
                <line
                  x1={src.x ?? 0} y1={src.y ?? 0}
                  x2={tgt.x ?? 0} y2={tgt.y ?? 0}
                  stroke={STROKE_COLORS[lt]}
                  strokeWidth={1.5}
                  strokeDasharray={dashArray(lt)}
                  markerEnd={hasArrow(lt) ? `url(#ga-${lt})` : undefined}
                  opacity={strengthOpacity(sl.linkData!.strength)}
                />
                {label && (
                  <>
                    <rect
                      x={mx - label.length * 3.5 - 6}
                      y={my - 9}
                      width={label.length * 7 + 12}
                      height={16}
                      rx={8}
                      fill="#fff"
                      stroke={STROKE_COLORS[lt]}
                      strokeWidth={0.5}
                      opacity={0.9}
                    />
                    <text
                      x={mx} y={my}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={10}
                      fill={STROKE_COLORS[lt]}
                    >
                      {label}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* ── Nodes ── */}
          {simNodes.map((sn, i) => {
            const x = sn.x ?? 0, y = sn.y ?? 0;

            if (sn.isGroup && sn.groupData) {
              // Group node
              const g = sn.groupData;
              const isExpanded = expandedReports.has(g.reportId);
              const titleText = g.title.length > 18 ? g.title.slice(0, 17) + "\u2026" : g.title;
              return (
                <g
                  key={sn.id}
                  transform={`translate(${x - GROUP_W / 2}, ${y - GROUP_H / 2})`}
                  style={{ cursor: "pointer" }}
                  onPointerDown={(e) => onPointerDown(e, i)}
                  onMouseEnter={(e) => onGroupEnter(e, g)}
                  onMouseLeave={() => setHoveredGroup(null)}
                  onClick={() => onGroupClick(g.reportId)}
                >
                  <rect
                    width={GROUP_W} height={GROUP_H}
                    rx={GROUP_RX}
                    fill="#f8fafc"
                    stroke="#4b5563"
                    strokeWidth={1.5}
                  />
                  {/* Date */}
                  <text
                    x={GROUP_W / 2} y={18}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={11} fontWeight={700}
                    fill="#1f2937"
                  >
                    {g.date}
                  </text>
                  {/* Title */}
                  <text
                    x={GROUP_W / 2} y={36}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={10}
                    fill="#64748b"
                  >
                    {titleText}
                  </text>
                  {/* Count + expand indicator */}
                  <text
                    x={GROUP_W / 2} y={52}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={9}
                    fill="#94a3b8"
                  >
                    {isExpanded ? "▼" : "▶"} {g.nodeCount} 个节点
                  </text>
                </g>
              );
            }

            // Leaf node
            const nd = sn.nodeData!;
            const c = COLOR_MAP[nd.color] ?? COLOR_MAP["c-gray"];
            const title = nd.title.length > 16 ? nd.title.slice(0, 15) + "\u2026" : nd.title;
            const sub = nd.subtitle;
            const subText = sub ? (sub.length > 22 ? sub.slice(0, 21) + "\u2026" : sub) : null;

            return (
              <g
                key={sn.id}
                transform={`translate(${x - NODE_W / 2}, ${y - NODE_H / 2})`}
                style={{ cursor: "grab" }}
                onPointerDown={(e) => onPointerDown(e, i)}
                onMouseEnter={(e) => onLeafEnter(e, nd)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onLeafClick(nd)}
              >
                <rect
                  width={NODE_W} height={NODE_H}
                  rx={NODE_RX}
                  fill={c.bg}
                  stroke={c.border}
                  strokeWidth={1}
                />
                <text
                  x={NODE_W / 2} y={subText ? NODE_H / 2 - 7 : NODE_H / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={12} fontWeight={600}
                  fill={c.text}
                >
                  {title}
                </text>
                {subText && (
                  <text
                    x={NODE_W / 2} y={NODE_H / 2 + 10}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={9}
                    fill={c.text}
                    opacity={0.6}
                  >
                    {subText}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Leaf hover panel */}
      {hovered && (
        <HoverPanel
          node={hovered.node}
          links={hovered.links}
          position={hovered.pos}
        />
      )}

      {/* Group hover tooltip */}
      {hoveredGroup && (
        <div
          className="wm-group-tooltip"
          style={{
            position: "fixed",
            left: hoveredGroup.pos.x + 16,
            top: hoveredGroup.pos.y - 10,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{hoveredGroup.group.date} — {hoveredGroup.group.title}</div>
          {hoveredGroup.nodes.map((n) => (
            <div key={n.id} style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
              • {n.title}
            </div>
          ))}
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>点击展开</div>
        </div>
      )}
    </div>
  );
}
