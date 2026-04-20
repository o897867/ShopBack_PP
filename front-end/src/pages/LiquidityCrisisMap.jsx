import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";

const SimpleExplainer = lazy(() => import("../components/SimpleExplainer.jsx"));

const NODES = [
  // Layer 1: External triggers (top)
  { id: "geopolitics", label: "地缘政治\n与关税冲击", x: 165, y: 85, category: "trigger", detail: "有效关税率13.5%(1946年来最高)，IEEPA最高法院审查中，4月已触发债市抛售", size: 38 },
  { id: "debt_wall", label: "债务到期墙\n$9万亿/年", x: 550, y: 85, category: "fiscal", detail: "2026-2028年$15万亿到期，84%短期国债依赖，利息支出$9700亿超国防", size: 44 },
  { id: "fed_independence", label: "美联储\n独立性威胁", x: 935, y: 85, category: "trigger", detail: "首次尝试罢免联储理事，鲍威尔任期到2026，前主席联名警告", size: 36 },
  // Layer 2: Key mechanisms
  { id: "basis", label: "基差交易\n$1万亿+敞口", x: 280, y: 240, category: "leverage", detail: "对冲基金敞口50-100倍，73.8%隔夜逆回购融资，规模为2020年1.5倍", size: 42 },
  { id: "fed", label: "美联储\n资产负债表困境", x: 790, y: 240, category: "policy", detail: "隔夜逆$2.89万亿逼近枯竭，已重启$400亿/月国债购买(RMP)", size: 46 },
  // Layer 3: Core hub
  { id: "treasury", label: "国债市场\n结构性脆弱", x: 550, y: 370, category: "core", detail: "~$30万亿市场，做市能力严重不足，流动性脆弱性上升", size: 54 },
  { id: "japan", label: "日本利率\n正常化", x: 975, y: 300, category: "trigger", detail: "BOJ利率0.75%(1995来最高)，$5000亿套利交易承压，最大美债外国持有者", size: 34 },
  // Layer 4: Transmission
  { id: "private_credit", label: "私人信贷\n$3.5万亿暗雷", x: 150, y: 480, category: "credit", detail: "40%借款人负现金流，\u201c真实\u201d违约率~5%，First Brands/Tricolor违约暴雷", size: 44 },
  { id: "repo", label: "回购市场\n压力传导枢纽", x: 550, y: 530, category: "core", detail: "TGCR超IORB，SRF被迫动用$294亿创纪录，季末利率反复突破上限", size: 44 },
  { id: "crypto", label: "加密金融\n传染渠道", x: 910, y: 460, category: "crypto", detail: "BTC从$126K暴跌至$60K(-52%)，稳定币持$1300亿国债，DATs敞口崩塌", size: 40 },
  // Layer 5: Systemic players
  { id: "nbfi", label: "非银金融\n$257万亿", x: 320, y: 660, category: "shadow", detail: "占全球金融资产51%，保险$6万亿(1/3投私人信贷)，MMF $7.8万亿", size: 40 },
  { id: "banks", label: "银行体系\n未实现亏损$4810亿", x: 730, y: 660, category: "banking", detail: "40%存款无保险，对NBFI敞口$4.5万亿，对私人信贷$950亿信贷额度", size: 40 },
  { id: "stablecoin", label: "稳定币\n$3100亿", x: 980, y: 590, category: "crypto", detail: "Tether持$1410亿国债(全球第17)，99%通过单一托管，无贴现窗口接入", size: 34 },
  // Layer 6: Outcome
  { id: "crisis", label: "流动性\n危机", x: 550, y: 810, category: "outcome", detail: "评估概率: 15-25%，远高于正常基线", size: 58 },
];

const EDGES = [
  // Basis trade connections
  { from: "basis", to: "treasury", label: "保证金追缴↑\n被迫抛售", color: "#ef4444", width: 3 },
  { from: "basis", to: "repo", label: "融资依赖", color: "#ef4444", width: 2.5 },
  // Fed connections
  { from: "fed", to: "repo", label: "隔夜逆枯竭↑\n利率飙升", color: "#f59e0b", width: 2.5 },
  { from: "fed", to: "treasury", label: "QT/RMP↔\n流动性影响", color: "#f59e0b", width: 2 },
  { from: "fed_independence", to: "fed", label: "政治干预", color: "#a855f7", width: 2 },
  { from: "fed_independence", to: "treasury", label: "风险溢价↑", color: "#a855f7", width: 1.5 },
  // Debt wall
  { from: "debt_wall", to: "treasury", label: "$9万亿/年\n再融资", color: "#f97316", width: 3 },
  { from: "debt_wall", to: "fed", label: "财政主导\n压力", color: "#f97316", width: 2 },
  // Geopolitics
  { from: "geopolitics", to: "treasury", label: "关税冲击↑\n债市抛售", color: "#ec4899", width: 2 },
  { from: "geopolitics", to: "basis", label: "波动率↑↑\n追缴保证金", color: "#ec4899", width: 1.5 },
  // Japan
  { from: "japan", to: "treasury", label: "套利解除↑\n抛售美债", color: "#06b6d4", width: 2 },
  // Private credit
  { from: "private_credit", to: "banks", label: "$950亿信贷额度\n传染", color: "#10b981", width: 2.5 },
  { from: "private_credit", to: "nbfi", label: "保险/养老金\n敞口", color: "#10b981", width: 2 },
  // Crypto
  { from: "crypto", to: "banks", label: "银行赞助\n加密基金", color: "#8b5cf6", width: 1.5 },
  { from: "stablecoin", to: "treasury", label: "撤回↔抛售\n$1300亿国债", color: "#8b5cf6", width: 2 },
  { from: "stablecoin", to: "repo", label: "短期融资\n承压", color: "#8b5cf6", width: 1.5 },
  { from: "crypto", to: "stablecoin", label: "信心传导", color: "#8b5cf6", width: 1.5 },
  // Repo as hub
  { from: "repo", to: "crisis", label: "融资冻结", color: "#ef4444", width: 3 },
  // Banks
  { from: "banks", to: "crisis", label: "信用紧缩\n存款外逃", color: "#6366f1", width: 2 },
  { from: "banks", to: "nbfi", label: "对NBFI\n$4.5万亿敞口", color: "#6366f1", width: 2 },
  // NBFI
  { from: "nbfi", to: "crisis", label: "MMF赎回\n衍生品追缴", color: "#14b8a6", width: 2 },
  { from: "nbfi", to: "repo", label: "融资需求\n集中", color: "#14b8a6", width: 1.5 },
  // Treasury to crisis
  { from: "treasury", to: "crisis", label: "流动性踩踏\n收益率飙升", color: "#ef4444", width: 3.5 },
];

const CATEGORY_COLORS = {
  core: { bg: "#1e1b2e", border: "#ef4444", text: "#fca5a5", glow: "rgba(239,68,68,0.3)" },
  leverage: { bg: "#1e1b2e", border: "#f97316", text: "#fdba74", glow: "rgba(249,115,22,0.3)" },
  policy: { bg: "#1e1b2e", border: "#f59e0b", text: "#fcd34d", glow: "rgba(245,158,11,0.3)" },
  fiscal: { bg: "#1e1b2e", border: "#f97316", text: "#fdba74", glow: "rgba(249,115,22,0.3)" },
  credit: { bg: "#1e1b2e", border: "#10b981", text: "#6ee7b7", glow: "rgba(16,185,129,0.3)" },
  crypto: { bg: "#1e1b2e", border: "#8b5cf6", text: "#c4b5fd", glow: "rgba(139,92,246,0.3)" },
  trigger: { bg: "#1e1b2e", border: "#ec4899", text: "#f9a8d4", glow: "rgba(236,72,153,0.3)" },
  shadow: { bg: "#1e1b2e", border: "#14b8a6", text: "#5eead4", glow: "rgba(20,184,166,0.3)" },
  banking: { bg: "#1e1b2e", border: "#6366f1", text: "#a5b4fc", glow: "rgba(99,102,241,0.3)" },
  outcome: { bg: "#2d0a0a", border: "#dc2626", text: "#fca5a5", glow: "rgba(220,38,38,0.5)" },
};

const LEGEND = [
  { color: "#ef4444", label: "国债/回购 核心风险" },
  { color: "#f97316", label: "杠杆/财政 压力" },
  { color: "#f59e0b", label: "货币政策 约束" },
  { color: "#ec4899", label: "外部 触发器" },
  { color: "#10b981", label: "私人信贷 传染" },
  { color: "#8b5cf6", label: "加密/稳定币 渠道" },
  { color: "#14b8a6", label: "影子银行 脆弱性" },
  { color: "#6366f1", label: "银行体系 传导" },
];

function getQuadraticMidpoint(x1, y1, x2, y2, offset = 40) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return { cx: mx + nx * offset, cy: my + ny * offset };
}

function CrisisMapView() {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const svgRef = useRef(null);
  const [dims, setDims] = useState({ w: 1120, h: 880 });

  const activeNode = selectedNode || hoveredNode;

  const connectedEdges = activeNode
    ? EDGES.filter(e => e.from === activeNode || e.to === activeNode)
    : [];
  const connectedNodeIds = new Set();
  if (activeNode) {
    connectedNodeIds.add(activeNode);
    connectedEdges.forEach(e => { connectedNodeIds.add(e.from); connectedNodeIds.add(e.to); });
  }

  const nodeMap = {};
  NODES.forEach(n => { nodeMap[n.id] = n; });

  const activeDetail = activeNode ? NODES.find(n => n.id === activeNode) : null;

  return (
    <div style={{
      width: "100%",
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0a0a12 0%, #0f0f1a 40%, #0a0a12 100%)",
      fontFamily: "'Noto Sans SC', 'Source Han Sans SC', sans-serif",
      color: "#e2e8f0",
      overflowX: "hidden",
      position: "relative",
      paddingBottom: 40,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet" />

      {/* Title — pushed down to avoid toggle overlap */}
      <div style={{ padding: "52px 32px 0", position: "relative", zIndex: 10 }}>
        <h1 style={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "0.02em",
          margin: 0,
          background: "linear-gradient(90deg, #fca5a5, #f59e0b, #c4b5fd)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          美国流动性危机：风险传导关系动态视图
        </h1>
        <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0", fontWeight: 300 }}>
          2025–2027 · 点击节点查看详情 · 连线显示传导路径与机制
        </p>
      </div>

      {/* Legend */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px 16px",
        padding: "10px 32px",
        position: "relative",
        zIndex: 10,
      }}>
        {LEGEND.map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, boxShadow: `0 0 6px ${l.color}60` }} />
            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* SVG Diagram */}
      <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center", padding: "0 8px" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          style={{ width: "100%", maxWidth: 1120, height: "auto", aspectRatio: `${dims.w}/${dims.h}` }}
          onClick={() => setSelectedNode(null)}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-strong">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {EDGES.map((e, i) => (
              <marker key={i} id={`arrow-${i}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={activeNode && !connectedEdges.includes(e) ? "#333" : e.color} opacity={activeNode && !connectedEdges.includes(e) ? 0.3 : 0.8} />
              </marker>
            ))}
          </defs>

          {/* Background grid */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a1a2e" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5" />

          {/* Edges */}
          {EDGES.map((e, i) => {
            const from = nodeMap[e.from];
            const to = nodeMap[e.to];
            if (!from || !to) return null;
            const isActive = activeNode && connectedEdges.includes(e);
            const isDimmed = activeNode && !isActive;
            const { cx, cy } = getQuadraticMidpoint(from.x, from.y, to.x, to.y, 38);
            const lx = (from.x + 2 * cx + to.x) / 4;
            const ly = (from.y + 2 * cy + to.y) / 4;
            const lines = e.label.split("\n");
            const labelH = lines.length * 11 + 4;
            const labelW = Math.max(...lines.map(l => l.length)) * 8.5 + 12;

            return (
              <g key={i} style={{ transition: "opacity 0.3s" }} opacity={isDimmed ? 0.08 : 1}>
                <path
                  d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
                  fill="none"
                  stroke={e.color}
                  strokeWidth={isActive ? e.width + 1 : e.width}
                  strokeDasharray={e.width < 2 ? "6 4" : "none"}
                  opacity={isActive ? 0.9 : 0.3}
                  markerEnd={`url(#arrow-${i})`}
                  filter={isActive ? "url(#glow)" : "none"}
                />
                {(isActive || !activeNode) && (
                  <>
                    <rect
                      x={lx - labelW / 2} y={ly - labelH / 2}
                      width={labelW} height={labelH}
                      rx="4" fill="#0a0a12" opacity={isActive ? 0.85 : 0.65}
                    />
                    <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill={e.color} fontWeight="500" opacity={isActive ? 1 : 0.7}>
                      {lines.map((line, j) => (
                        <tspan key={j} x={lx} dy={j === 0 ? -(lines.length - 1) * 5.5 : 11}>{line}</tspan>
                      ))}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {NODES.map(n => {
            const cat = CATEGORY_COLORS[n.category];
            const isActive = activeNode === n.id;
            const isConnected = connectedNodeIds.has(n.id);
            const isDimmed = activeNode && !isConnected;
            const r = n.size / 2;
            const isOutcome = n.category === "outcome";
            const isCore = n.category === "core";

            return (
              <g
                key={n.id}
                style={{ cursor: "pointer", transition: "opacity 0.3s" }}
                opacity={isDimmed ? 0.12 : 1}
                onMouseEnter={() => !selectedNode && setHoveredNode(n.id)}
                onMouseLeave={() => !selectedNode && setHoveredNode(null)}
                onClick={(ev) => { ev.stopPropagation(); setSelectedNode(selectedNode === n.id ? null : n.id); }}
              >
                {/* Outer glow */}
                {(isActive || isOutcome) && (
                  <circle cx={n.x} cy={n.y} r={r + 10} fill="none" stroke={cat.border} strokeWidth="1" opacity="0.35" filter="url(#glow-strong)" />
                )}
                {/* Subtle ring for core nodes */}
                {isCore && !isActive && (
                  <circle cx={n.x} cy={n.y} r={r + 5} fill="none" stroke={cat.border} strokeWidth="0.5" opacity="0.2" />
                )}
                {/* Background circle */}
                <circle
                  cx={n.x} cy={n.y} r={r}
                  fill={cat.bg}
                  stroke={cat.border}
                  strokeWidth={isActive ? 2.5 : isCore ? 2 : 1.5}
                  opacity={0.95}
                />
                {/* Pulse ring for outcome */}
                {isOutcome && (
                  <circle cx={n.x} cy={n.y} r={r + 4} fill="none" stroke={cat.border} strokeWidth="1" opacity="0.5">
                    <animate attributeName="r" from={r + 2} to={r + 18} dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Label */}
                <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="middle" fontSize={isOutcome ? "13" : isCore ? "11" : "10"} fontWeight={isOutcome ? "700" : "500"} fill={cat.text}>
                  {n.label.split("\n").map((line, j, arr) => (
                    <tspan key={j} x={n.x} dy={j === 0 ? -(arr.length - 1) * 6.5 : 13}>{line}</tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail Panel */}
      {activeDetail && (
        <div style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16162a 100%)",
          border: `1px solid ${CATEGORY_COLORS[activeDetail.category].border}60`,
          borderRadius: 12,
          padding: "14px 22px",
          maxWidth: 520,
          width: "90%",
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${CATEGORY_COLORS[activeDetail.category].glow}`,
          zIndex: 100,
          animation: "slideUp 0.25s ease-out",
        }}>
          <style>{`@keyframes slideUp { from { opacity:0; transform: translateX(-50%) translateY(12px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`}</style>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: CATEGORY_COLORS[activeDetail.category].border,
              boxShadow: `0 0 8px ${CATEGORY_COLORS[activeDetail.category].border}`,
            }} />
            <span style={{
              fontSize: 15,
              fontWeight: 700,
              color: CATEGORY_COLORS[activeDetail.category].text,
            }}>
              {activeDetail.label.replace("\n", " ")}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6, fontWeight: 300 }}>
            {activeDetail.detail}
          </p>
          {connectedEdges.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {connectedEdges.map((e, i) => {
                const targetId = e.from === activeDetail.id ? e.to : e.from;
                const target = nodeMap[targetId];
                const direction = e.from === activeDetail.id ? "→" : "←";
                return (
                  <span key={i} style={{
                    fontSize: 10,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: `${e.color}18`,
                    border: `1px solid ${e.color}40`,
                    color: e.color,
                    fontWeight: 500,
                  }}>
                    {direction} {target?.label.replace("\n", " ")}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Probability indicator */}
      <div style={{
        position: "absolute",
        top: 52,
        right: 32,
        textAlign: "right",
        zIndex: 10,
      }}>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3, fontWeight: 400 }}>严重流动性危机概率</div>
        <div style={{
          fontSize: 26,
          fontWeight: 700,
          background: "linear-gradient(90deg, #f59e0b, #ef4444)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1,
        }}>15–25%</div>
        <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>远高于正常基线水平</div>
      </div>
    </div>
  );
}

const TOGGLE_STYLES = {
  wrapper: {
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 200,
    display: "flex",
    background: "rgba(20,20,35,0.85)",
    backdropFilter: "blur(12px)",
    borderRadius: 10,
    padding: 3,
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  },
  btn: (active) => ({
    padding: "7px 18px",
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.25s",
    fontFamily: "inherit",
    background: active ? "linear-gradient(135deg, #ef4444, #f59e0b)" : "transparent",
    color: active ? "#fff" : "#94a3b8",
  }),
};

export default function LiquidityCrisisMap() {
  const [view, setView] = useState("pro");

  return (
    <>
      <div style={TOGGLE_STYLES.wrapper}>
        <button style={TOGGLE_STYLES.btn(view === "pro")} onClick={() => setView("pro")}>
          专业版
        </button>
        <button style={TOGGLE_STYLES.btn(view === "simple")} onClick={() => setView("simple")}>
          科普版
        </button>
      </div>
      {view === "pro" ? (
        <CrisisMapView />
      ) : (
        <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>Loading...</div>}>
          <SimpleExplainer />
        </Suspense>
      )}
    </>
  );
}
