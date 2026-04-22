import React, { useMemo } from 'react';

// Simple sparkline for mid price and spread overlay
const QuoteSparkline = ({ history = [], height = 280, padding = 14 }) => {
  const { midPath, spreadPath, points, svgWidth } = useMemo(() => {
    if (!history.length) return { midPath: '', spreadPath: '', points: [], svgWidth: 200 };

    const mids = history.map((q) => q.mid).filter((v) => typeof v === 'number');
    const minVal = Math.min(...mids);
    const maxVal = Math.max(...mids);

    const h = height - padding * 2;
    const n = history.length;
    const baseWidth = 260;
    const stepX = n > 1 ? (baseWidth - padding * 2) / (n - 1) : baseWidth / 2;
    const svgWidth = Math.max(baseWidth, padding * 2 + stepX * (n - 1));

    const scaleY = (v) => {
      if (maxVal === minVal) return padding + h / 2;
      return padding + h - ((v - minVal) / (maxVal - minVal)) * h;
    };

    const pts = history.map((q, idx) => ({
      x: padding + idx * stepX,
      y: scaleY(q.mid),
    }));

    const midPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

    const spreadPts = history.map((q, idx) => ({
      x: padding + idx * stepX,
      y1: scaleY((q.mid || 0) - (q.spread || 0) / 2),
      y2: scaleY((q.mid || 0) + (q.spread || 0) / 2),
    }));
    const spreadPath = spreadPts.map((p) => `M${p.x},${p.y1} L${p.x},${p.y2}`).join(' ');

    return { midPath, spreadPath, points: pts, svgWidth };
  }, [history, height, padding]);

  return (
    <div className="sparkline-wrapper">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${svgWidth} ${height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="midGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3a3" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#22d3a3" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path d={spreadPath} stroke="#f59e0b" strokeWidth="0.6" strokeOpacity="0.55" fill="none" />
        <path d={midPath} stroke="#22d3a3" strokeWidth="1.4" fill="none" />
        <path d={`${midPath} L ${svgWidth} ${height} L 0 ${height} Z`} fill="url(#midGradient)" />
        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r={2.0} fill="#d4a31f" opacity="0.8" />
        ))}
      </svg>
    </div>
  );
};

export default QuoteSparkline;
