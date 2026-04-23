import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import TopNav from '../components/TopNav.jsx';
import './Analytics.css';

const API = import.meta.env.VITE_API_URL || '';

/* ═══════════════════════════════════════════════════════════════════
 * Data — watchlist tickers, sector map, market snapshot
 * ═══════════════════════════════════════════════════════════════════ */

const WATCHLIST = [
  { sym: 'NVDA', name: '英伟达 · NVIDIA Corp.', exchange: 'NASDAQ', spark: [10,9,11,7,8,5,6,3,4,1] },
  { sym: 'AAPL', name: '苹果 · Apple Inc.',     exchange: 'NASDAQ', spark: [5,6,4,5,7,6,8,7,9,8] },
  { sym: 'TSLA', name: '特斯拉 · Tesla Inc.',   exchange: 'NASDAQ', spark: [4,7,5,9,7,10,8,11,9,12] },
  { sym: 'BTC',  name: '比特币 · Bitcoin',       exchange: 'CRYPTO', spark: [11,8,10,5,6,3,5,2,4,1] },
  { sym: 'SPX',  name: '标普500 · S&P 500',     exchange: 'INDEX',  spark: [7,6,8,6,7,5,6,5,6,4] },
  { sym: 'GLD',  name: '黄金ETF · Gold ETF',    exchange: 'NYSE',   spark: [10,9,10,8,7,6,5,4,3,2] },
  { sym: 'DXY',  name: '美元指数 · Dollar Index',exchange: 'INDEX',  spark: [6,5,7,6,8,7,9,8,10,9] },
];

const TIME_WINDOWS = ['1D', '5D', '1M', '3M', 'YTD', '1Y', '5Y', 'MAX'];

const SECTORS = [
  { sym: 'XLK', name: 'Technology',         delta: '+1.82%', cls: 'an-hg-4', size: 'an-heat__cell--xl' },
  { sym: 'XLC', name: 'Comms',              delta: '+1.14%', cls: 'an-hg-3' },
  { sym: 'XLY', name: 'Discretionary',      delta: '+0.58%', cls: 'an-hg-2' },
  { sym: 'XLF', name: 'Financials',         delta: '+0.22%', cls: 'an-hg-1' },
  { sym: 'XLI', name: 'Industrials',        delta: '+0.04%', cls: 'an-hg-0' },
  { sym: 'XLV', name: 'Health',             delta: '\u22120.31%', cls: 'an-hr-1' },
  { sym: 'XLP', name: 'Staples',            delta: '\u22120.64%', cls: 'an-hr-2' },
  { sym: 'XLE \u00b7 XLU', name: 'Energy & Utilities', delta: '\u22121.12%  \u22121.40%', cls: 'an-hr-3', size: 'an-heat__cell--lg' },
  { sym: 'XLRE', name: 'Real Estate',       delta: '\u22122.08%', cls: 'an-hr-4', size: 'an-heat__cell--lg' },
];

const MARKET_ROWS = [
  { sym:'NVDA', name:'NVIDIA',        last:142.08, chg:+3.42, pct:+2.47, vol:'248.1M', cap:'3.49T', up:true,  spark:[8,9,7,10,7,8,6,7,5,6,4,5,3,4,2,3,2,3,1,2] },
  { sym:'AAPL', name:'Apple',         last:217.84, chg:-0.92, pct:-0.42, vol:'54.2M',  cap:'3.31T', up:false, spark:[4,5,4,6,5,7,6,8,7,8,7,9,8,9,8,9,10,9,10,9] },
  { sym:'TSLA', name:'Tesla',         last:189.12, chg:+4.88, pct:+2.65, vol:'108.7M', cap:'603B',  up:true,  spark:[6,8,5,9,7,10,7,8,6,7,5,7,4,6,3,5,4,5,2,3] },
  { sym:'BTC',  name:'Bitcoin',       last:110842,  chg:+1924, pct:+1.77, vol:'$48.2B', cap:'2.18T', up:true,  spark:[10,9,10,8,7,8,5,6,4,5,3,4,2,3,1,2,1,2,1,1] },
  { sym:'META', name:'Meta',          last:598.40, chg:+9.22, pct:+1.57, vol:'22.1M',  cap:'1.52T', up:true,  spark:[8,7,8,6,7,5,6,4,5,4,5,3,4,3,4,2,3,2,3,1] },
  { sym:'GOOGL',name:'Alphabet',      last:175.64, chg:+1.11, pct:+0.64, vol:'31.8M',  cap:'2.16T', up:true,  spark:[7,8,6,7,7,6,7,5,6,6,5,6,4,5,4,5,3,4,4,3] },
  { sym:'AMZN', name:'Amazon',        last:185.90, chg:-0.45, pct:-0.24, vol:'27.4M',  cap:'1.95T', up:false, spark:[5,6,5,7,6,8,7,8,7,9,8,9,10,8,9,10,9,10,9,10] },
  { sym:'SPX',  name:'S&P 500',       last:5821.4, chg:+32.8, pct:+0.57, vol:'2.1B',   cap:'\u2014',up:true,  spark:[7,7,6,7,6,6,5,6,5,5,4,5,4,4,3,4,3,3,2,3] },
  { sym:'DXY',  name:'Dollar Index',  last:104.22, chg:-0.14, pct:-0.13, vol:'\u2014',  cap:'\u2014',up:false, spark:[5,5,6,5,6,7,6,7,6,7,8,7,8,7,8,8,9,8,9,8] },
  { sym:'GLD',  name:'Gold ETF',      last:248.41, chg:+1.02, pct:+0.41, vol:'7.9M',   cap:'83.8B', up:true,  spark:[10,9,10,8,9,8,7,8,6,7,6,5,6,4,5,3,4,3,2,2] },
];

/* ═══════════════════════════════════════════════════════════════════
 * Helpers
 * ═══════════════════════════════════════════════════════════════════ */

function pad(n) { return String(n).padStart(2, '0'); }

function fmt(n, dig = 2) {
  return typeof n === 'number'
    ? n.toLocaleString('en-US', { minimumFractionDigits: dig, maximumFractionDigits: dig })
    : n;
}

/** Tiny sparkline SVG for ticker tabs */
function Sparkline({ points, width = 44, height = 14 }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const pts = points.map((v, i) =>
    `${(i * step).toFixed(1)},${((1 - (v - min) / range) * (height - 2) + 1).toFixed(1)}`
  ).join(' ');
  return (
    <svg className="an-tkr-tab__spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** Table sparkline */
function TableSpark({ points, up, width = 60, height = 14 }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const d = points.map((v, i) =>
    `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)},${((v - min) / range * (height - 2) + 1).toFixed(1)}`
  ).join(' ');
  const col = up ? '#166534' : '#991b1b';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={d} fill="none" stroke={col} strokeWidth="1.2" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * Candle + Volume chart builder (deterministic pseudo-random)
 * ═══════════════════════════════════════════════════════════════════ */

function useCandleData() {
  return useMemo(() => {
    const N = 78, W = 5, GAP = 3;
    let price = 136, prng = 0.42;
    const r = () => { prng = (prng * 9301 + 49297) % 233280; return prng / 233280; };
    const rows = [];
    for (let i = 0; i < N; i++) {
      const open = price;
      const drift = Math.sin(i / 9) * 1.2 + 0.04;
      const close = open + drift + (r() - 0.5) * 2.2;
      const hi = Math.max(open, close) + r() * 1.2;
      const lo = Math.min(open, close) - r() * 1.2;
      rows.push({ open, close, hi, lo, vol: 0.3 + r() * 0.9 });
      price = close;
    }
    const allP = rows.flatMap(c => [c.hi, c.lo]);
    const pMin = Math.min(...allP) - 1, pMax = Math.max(...allP) + 1;
    const TOP = 10, BOT = 170;
    const y = (p) => BOT - ((p - pMin) / (pMax - pMin)) * (BOT - TOP);
    const vMax = Math.max(...rows.map(c => c.vol));
    return { rows, y, vMax, N, W, GAP };
  }, []);
}

/* ═══════════════════════════════════════════════════════════════════
 * Sub-components
 * ═══════════════════════════════════════════════════════════════════ */

function CandleChart({ data }) {
  const { rows, y, vMax, N, W, GAP } = data;
  return (
    <>
      <svg className="an-candles-svg" viewBox="0 0 620 180" preserveAspectRatio="none">
        <line className="an-grid-line" x1="0" y1="30" x2="620" y2="30" />
        <line className="an-grid-line" x1="0" y1="70" x2="620" y2="70" />
        <line className="an-grid-line" x1="0" y1="110" x2="620" y2="110" />
        <line className="an-grid-line" x1="0" y1="150" x2="620" y2="150" />
        {rows.map((c, i) => {
          const x = 8 + i * (W + GAP);
          const up = c.close >= c.open;
          const cls = up ? 'an-cd-up' : 'an-cd-dn';
          const yTop = y(Math.max(c.open, c.close));
          const yBot = y(Math.min(c.open, c.close));
          const h = Math.max(1, yBot - yTop);
          return (
            <g key={i}>
              <line className={`an-cd-wick ${cls}`} x1={x + W / 2} y1={y(c.hi)} x2={x + W / 2} y2={y(c.lo)} />
              <rect className={cls} x={x} y={yTop} width={W} height={h} />
            </g>
          );
        })}
      </svg>
      <svg className="an-vol-svg" viewBox="0 0 620 70" preserveAspectRatio="none">
        {rows.map((c, i) => {
          const x = 8 + i * (W + GAP);
          const h = (c.vol / vMax) * 60;
          const up = c.close >= c.open;
          return <rect key={i} className={`an-vol-bar ${up ? 'an-vol-bar--up' : 'an-vol-bar--dn'}`} x={x} y={66 - h} width={W} height={h} />;
        })}
        <line className="an-grid-line" x1="0" y1="68" x2="620" y2="68" />
      </svg>
    </>
  );
}

function SectorHeatmap({ isChinese }) {
  return (
    <div>
      <div className="an-heat-label">
        {isChinese ? 'S&P 500 板块热图 · Sector heatmap' : 'S&P 500 sector heatmap'}
      </div>
      <div className="an-heat">
        {SECTORS.map((s, i) => (
          <div key={i} className={`an-heat__cell ${s.size || ''} ${s.cls}`}>
            <div>
              <div className="an-heat__sym">{s.sym}</div>
              <div className="an-heat__name">{s.name}</div>
            </div>
            <div className="an-heat__delta">{s.delta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VolatilityPanel({ isChinese }) {
  return (
    <div className="an-vola-panel">
      <h3 className="an-vola-title">
        {isChinese ? '波动率曲面 · Volatility surface' : 'Volatility surface'}
      </h3>
      <p className="an-vola-sub">
        {isChinese
          ? '历史波动率（实线）与隐含波动率（虚线）的分叉，暗示市场对财报的定价已偏紧。'
          : 'The divergence between historical (solid) and implied (dashed) volatility suggests the market has already priced in earnings tightly.'}
      </p>
      <svg className="an-vola-svg" viewBox="0 0 900 140" preserveAspectRatio="none">
        <defs>
          <linearGradient id="vola-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#b45309" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0.00" />
          </linearGradient>
        </defs>
        <line className="an-grid-line" x1="0" y1="30" x2="900" y2="30" />
        <line className="an-grid-line" x1="0" y1="70" x2="900" y2="70" />
        <line className="an-grid-line" x1="0" y1="110" x2="900" y2="110" />
        {/* HV */}
        <path className="an-vola-hv" d="M 0,90 C 80,88 160,70 240,80 S 400,95 500,75 S 700,50 900,55" />
        {/* IV area */}
        <path fill="url(#vola-grad)" opacity="0.5" d="M 0,100 C 80,100 160,85 240,90 S 400,100 500,80 S 700,40 900,20 L 900,140 L 0,140 Z" />
        {/* IV line */}
        <path className="an-vola-iv" d="M 0,100 C 80,100 160,85 240,90 S 400,100 500,80 S 700,40 900,20" />
        {/* x labels */}
        <g className="an-chart-axis-x">
          <text x="2" y="132">T-60</text>
          <text x="300" y="132">T-30</text>
          <text x="600" y="132">T-14</text>
          <text x="890" y="132" textAnchor="end">TODAY</text>
        </g>
        <g className="an-chart-axis-y">
          <text x="6" y="28">80%</text>
          <text x="6" y="68">50%</text>
          <text x="6" y="108">20%</text>
        </g>
        <text x="885" y="18" textAnchor="end" className="an-price-annot" fill="#b45309">IV &nbsp; 72.4%</text>
        <text x="885" y="52" textAnchor="end" className="an-price-annot">HV &nbsp; 38.1%</text>
      </svg>
    </div>
  );
}

function MarketTable() {
  return (
    <table className="an-tbl">
      <thead>
        <tr>
          <th style={{ width: 110 }}>Ticker</th>
          <th>Name</th>
          <th>Last</th>
          <th>Chg</th>
          <th>Chg%</th>
          <th>Vol</th>
          <th>Spark · 20d</th>
          <th>Mkt cap</th>
        </tr>
      </thead>
      <tbody>
        {MARKET_ROWS.map(r => (
          <tr key={r.sym}>
            <td><span className="an-sym">{r.sym}</span></td>
            <td className="an-name">{r.name}</td>
            <td>{fmt(r.last, r.last > 10000 ? 0 : 2)}</td>
            <td className={r.up ? 'an-up' : 'an-down'}>
              {r.up ? '+' : ''}{fmt(r.chg, r.last > 10000 ? 0 : 2)}
            </td>
            <td className={r.up ? 'an-up' : 'an-down'}>
              {r.up ? '+' : ''}{fmt(r.pct)}%
            </td>
            <td>{r.vol}</td>
            <td className="an-spark"><TableSpark points={r.spark} up={r.up} /></td>
            <td>{r.cap}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * Main component
 * ═══════════════════════════════════════════════════════════════════ */

export default function Analytics({ onNavigate }) {
  const { currentLanguage } = useLanguage();
  const isChinese = currentLanguage === 'zh-CN';

  // Clock
  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Active ticker & time window
  const [activeTicker, setActiveTicker] = useState(0);
  const [activeWindow, setActiveWindow] = useState('1M');

  // Candle data (memoized)
  const candleData = useCandleData();

  // Current ticker info
  const ticker = WATCHLIST[activeTicker];

  // Date formatting
  const now = new Date();
  const dayNames = { zh: ['周日','周一','周二','周三','周四','周五','周六'], en: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] };
  const dateStr = isChinese
    ? `${now.getFullYear()}\u00b7${pad(now.getMonth()+1)}\u00b7${pad(now.getDate())} \u00b7 ${dayNames.zh[now.getDay()]}`
    : `${dayNames.en[now.getDay()]}, ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  return (
    <>
      <TopNav onNavigate={onNavigate} activePage="analytics" />

      <div className="an-col">
        {/* ── Masthead ── */}
        <section className="an-mast">
          <p className="an-mast__eyebrow">
            {isChinese ? '数据分析 · Market analytics' : 'Market analytics · 数据分析'}
          </p>
          <h1 className="an-mast__title">
            {isChinese
              ? <>数据说的话，<em>比人说的干净</em></>
              : <>Data speaks cleaner <em>than people do</em></>}
          </h1>
          <p className="an-mast__sub">
            {isChinese
              ? '实时价格、成交量、波动率与板块轮动——一页之内，读懂今天的市场情绪与结构。'
              : 'Live prices, volume, volatility, and sector rotation \u2014 read today\u2019s market sentiment and structure in a single page.'}
          </p>
          <div className="an-mast__bar">
            <span className="an-mast__stamp">{dateStr}</span>
            <span className="an-dot" />
            <span className="an-mast__clock">{clock}</span>
            <span className="an-dot" />
            <span className="an-mast__clock">
              {isChinese ? 'NYSE 开盘中' : 'NYSE open'}
            </span>
            <span className="an-live">
              <span className="an-live__dot" />
              {isChinese ? 'Live · 实时' : 'Live'}
            </span>
          </div>
        </section>

        {/* ── Asset picker + quote ── */}
        <div className="an-asset-row">
          <div className="an-asset">
            <div className="an-asset__ticker">{ticker.sym}</div>
            <div>
              <div className="an-asset__name">{ticker.name}</div>
              <div><span className="an-asset__ex">{ticker.exchange}</span></div>
            </div>
          </div>
          <div className="an-quote">
            <div className="an-quote__price">142.08</div>
            <div className="an-quote__delta an-up">
              ▲ +3.42 &nbsp; +2.47% &nbsp;·&nbsp; {isChinese ? '今日' : 'today'}
            </div>
          </div>
        </div>

        {/* ── Ticker tabs ── */}
        <div className="an-ticker-tabs">
          {WATCHLIST.map((w, i) => (
            <button
              key={w.sym}
              className={`an-tkr-tab${i === activeTicker ? ' active' : ''}`}
              onClick={() => setActiveTicker(i)}
            >
              {w.sym}
              <Sparkline points={w.spark} />
            </button>
          ))}
        </div>

        {/* ── Time window ── */}
        <div className="an-controls-row">
          <div className="an-window-tabs">
            {TIME_WINDOWS.map(w => (
              <button
                key={w}
                className={`an-wtab${w === activeWindow ? ' active' : ''}`}
                onClick={() => setActiveWindow(w)}
              >
                {w}
              </button>
            ))}
          </div>
          <div className="an-range-label">
            RANGE: 03·22 — 04·22 &nbsp; · &nbsp; 22 SESSIONS
          </div>
        </div>

        {/* ── Main price chart ── */}
        <div className="an-chart-card">
          <svg className="an-chart-svg" viewBox="0 0 940 300" preserveAspectRatio="none">
            <defs>
              <linearGradient id="area-grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0.00" />
              </linearGradient>
            </defs>
            {/* Grid */}
            <line className="an-grid-line" x1="50" y1="30" x2="920" y2="30" />
            <line className="an-grid-line" x1="50" y1="90" x2="920" y2="90" />
            <line className="an-grid-line" x1="50" y1="150" x2="920" y2="150" />
            <line className="an-grid-line" x1="50" y1="210" x2="920" y2="210" />
            <line className="an-grid-line" x1="50" y1="270" x2="920" y2="270" />
            {/* Y labels */}
            <g className="an-chart-axis-y">
              <text x="44" y="33" textAnchor="end">150</text>
              <text x="44" y="93" textAnchor="end">140</text>
              <text x="44" y="153" textAnchor="end">130</text>
              <text x="44" y="213" textAnchor="end">120</text>
              <text x="44" y="273" textAnchor="end">110</text>
            </g>
            {/* Area */}
            <path fill="url(#area-grad)" opacity="0.9" d="
              M 50,210 L 90,220 L 130,200 L 170,215 L 210,190 L 250,205 L 290,175 L 330,190
              L 370,155 L 410,170 L 450,140 L 490,160 L 530,130 L 570,150 L 610,120 L 650,100
              L 690,125 L 730,95 L 770,110 L 810,80 L 850,95 L 890,70 L 920,90 L 920,280 L 50,280 Z" />
            {/* Line */}
            <path className="an-price-line" d="
              M 50,210 L 90,220 L 130,200 L 170,215 L 210,190 L 250,205 L 290,175 L 330,190
              L 370,155 L 410,170 L 450,140 L 490,160 L 530,130 L 570,150 L 610,120 L 650,100
              L 690,125 L 730,95 L 770,110 L 810,80 L 850,95 L 890,70 L 920,90" />
            {/* 20-day MA */}
            <path d="M 50,220 C 200,215 350,180 500,150 S 800,90 920,95" fill="none" stroke="#b45309" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.85" />
            {/* Earnings annotation */}
            <line x1="650" y1="30" x2="650" y2="100" stroke="#991b1b" strokeWidth="0.8" strokeDasharray="2 2" />
            <circle className="an-price-dot" cx="650" cy="100" r="3" />
            <text className="an-price-annot" x="655" y="24">
              {isChinese ? '财报 · EARNINGS' : 'EARNINGS'}
            </text>
            {/* Current dot */}
            <circle cx="920" cy="90" r="4" fill="#166534" />
            <text className="an-price-annot" x="895" y="84" textAnchor="end" fill="#166534">142.08</text>
            {/* Baseline */}
            <line className="an-baseline" x1="50" y1="210" x2="920" y2="210" />
            {/* X labels */}
            <g className="an-chart-axis-x">
              <text x="50" y="295">03·22</text>
              <text x="210" y="295">03·29</text>
              <text x="410" y="295">04·05</text>
              <text x="610" y="295">04·12</text>
              <text x="810" y="295">04·19</text>
              <text x="920" y="295" textAnchor="end">TODAY</text>
            </g>
          </svg>
          <div className="an-chart-legend">
            <span className="an-leg"><span className="an-leg__sq" />Close</span>
            <span className="an-leg"><span className="an-leg__sq an-leg__sq--ma" />20-day MA</span>
            <span className="an-leg"><span className="an-leg__sq an-leg__sq--vol" />Volume</span>
            <span style={{ marginLeft: 'auto' }}>Source · Polygon.io aggregate</span>
          </div>
        </div>

        {/* ── Stat strip ── */}
        <div className="an-stats">
          <div className="an-stat">
            <div className="an-stat__l">{isChinese ? '开盘 · Open' : 'Open'}</div>
            <div className="an-stat__v">138.92</div>
            <div className="an-stat__sub">+0.41</div>
          </div>
          <div className="an-stat">
            <div className="an-stat__l">{isChinese ? '日高 · High' : 'High'}</div>
            <div className="an-stat__v an-up">143.74</div>
            <div className="an-stat__sub">14:02 EDT</div>
          </div>
          <div className="an-stat">
            <div className="an-stat__l">{isChinese ? '日低 · Low' : 'Low'}</div>
            <div className="an-stat__v an-down">138.10</div>
            <div className="an-stat__sub">09:48 EDT</div>
          </div>
          <div className="an-stat">
            <div className="an-stat__l">{isChinese ? '成交量 · Vol' : 'Volume'}</div>
            <div className="an-stat__v">248.1 M</div>
            <div className="an-stat__sub">30D avg 198M</div>
          </div>
          <div className="an-stat">
            <div className="an-stat__l">{isChinese ? '市值 · Mkt cap' : 'Mkt cap'}</div>
            <div className="an-stat__v">3.49 T</div>
            <div className="an-stat__sub">USD</div>
          </div>
          <div className="an-stat">
            <div className="an-stat__l">{isChinese ? '52周 · 52W' : '52W range'}</div>
            <div className="an-stat__v">94 — 147</div>
            <div className="an-stat__sub">position 87%</div>
          </div>
        </div>

        {/* ── Candles + Volume | Heatmap ── */}
        <div className="an-sec-head">
          <span className="an-sec-head__l">
            {isChinese ? 'K 线 · 成交量 · Candles + volume' : 'Candles + volume'}
          </span>
          <span className="an-sec-head__rule" />
          <span className="an-sec-head__more">5D · 5-min</span>
        </div>

        <div className="an-two-col">
          <div>
            <CandleChart data={candleData} />
          </div>
          <SectorHeatmap isChinese={isChinese} />
        </div>

        {/* ── Volatility ── */}
        <div className="an-sec-head">
          <span className="an-sec-head__l">
            {isChinese ? '波动率 · Volatility' : 'Volatility'}
          </span>
          <span className="an-sec-head__rule" />
          <span className="an-sec-head__more">60-day HV vs 30-day IV</span>
        </div>
        <VolatilityPanel isChinese={isChinese} />

        {/* ── Market snapshot table ── */}
        <div className="an-sec-head">
          <span className="an-sec-head__l">
            {isChinese ? '全市场速览 · Market snapshot' : 'Market snapshot'}
          </span>
          <span className="an-sec-head__rule" />
          <span className="an-sec-head__more">
            {isChinese ? '按成交额排序 · by volume' : 'Sorted by volume'}
          </span>
        </div>
        <MarketTable />

        {/* ── Editorial commentary ── */}
        <div className="an-sec-head">
          <span className="an-sec-head__l">
            {isChinese ? "今日解读 · Editor's note" : "Editor's note"}
          </span>
          <span className="an-sec-head__rule" />
        </div>
        <div className="an-comment">
          <div className="an-comment__by">
            {isChinese ? '临象评论员 · By editorial desk' : 'By editorial desk'}
          </div>
          <p className="an-comment__body">
            {isChinese
              ? '科技股吃下了今天的所有阳线。看似雨过天晴，但 IV 已经开始涨了——说明市场对下周的不确定性并不像价格图看起来那么从容。给自己一份谨慎，不会让你错过什么。\u201D'
              : 'Tech absorbed all of today\u2019s green. It looks like clear skies, but IV is already climbing \u2014 the market isn\u2019t as calm about next week as the price chart suggests. A dose of caution won\u2019t cost you anything.\u201D'}
          </p>
          <div className="an-comment__sig">
            <span>FILED {now.getFullYear()}\u00b7{pad(now.getMonth()+1)}\u00b7{pad(now.getDate())} · {clock.slice(0, 5)} EDT</span>
            <span>{isChinese ? '— 沈 · 市场观察' : '— Shen · Market watch'}</span>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="an-footer">
          <p className="an-footer__copy">
            {isChinese
              ? '© 2026 临象财经 · 数据仅供参考 · 投资有风险'
              : '© 2026 LinXiangFinance · Data for reference only · Invest at your own risk'}
          </p>
          <div className="an-footer__links">
            <button className="an-footer__link">
              {isChinese ? '数据说明' : 'Data disclaimer'}
            </button>
            <button className="an-footer__link">
              {isChinese ? '隐私政策' : 'Privacy'}
            </button>
            <button className="an-footer__link">
              {isChinese ? '联系我们' : 'Contact'}
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}
