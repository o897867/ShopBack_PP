import React, { useCallback, useEffect, useState } from 'react';
import TopNav from '../components/TopNav.jsx';
import './Fortune.css';

// ─── LuckBar ────────────────────────────────────────────────

function LuckBar({ luck, tag }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(luck), 100);
    return () => clearTimeout(t);
  }, [luck]);

  return (
    <div className="fortune-luck-bar">
      <div className="fortune-luck-bar__header">
        <span>财运指数</span>
        <span>{luck}%</span>
      </div>
      <div className="fortune-luck-bar__track">
        <div
          className="fortune-luck-bar__fill"
          data-tag={tag}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

// ─── GuaCard ────────────────────────────────────────────────

function GuaCard({ gua, visible }) {
  return (
    <div className={`fortune-gua-card ${visible ? 'fortune-gua-card--visible' : ''}`}>
      <div className="fortune-gua-header">
        <span className="fortune-gua-name">{gua.name}</span>
        <span className="fortune-gua-tag" data-tag={gua.tag}>{gua.tag}</span>
      </div>

      <p className="fortune-gua-sub">{gua.sub}</p>

      <p className="fortune-gua-verdict">{gua.verdict}</p>

      <div className="fortune-gua-grid">
        {[
          { label: '今日操作', value: gua.action },
          { label: '仓位建议', value: gua.position },
          { label: '止损心法', value: gua.stoploss },
          { label: '吉时', value: gua.time },
        ].map(({ label, value }) => (
          <div key={label} className="fortune-gua-cell">
            <div className="fortune-gua-cell__label">{label}</div>
            <div className="fortune-gua-cell__value">{value}</div>
          </div>
        ))}
      </div>

      <LuckBar luck={gua.luck} tag={gua.tag} />
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────

const Fortune = ({ onNavigate }) => {
  const [gua, setGua] = useState(null);
  const [visible, setVisible] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('');
  const [copied, setCopied] = useState(false);
  const [castCount, setCastCount] = useState(0);

  useEffect(() => {
    setDate(
      new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })
    );
  }, []);

  const fetchGua = useCallback(async (reroll = false) => {
    setLoading(true);
    setVisible(false);

    // spinning animation
    setSpinning(true);
    await new Promise((r) => setTimeout(r, 600));
    setSpinning(false);

    try {
      const url = reroll ? '/api/fortune?reroll=1' : '/api/fortune';
      const res = await fetch(url);
      const data = await res.json();
      setGua(data.gua);
      setCastCount((c) => c + 1);
      setTimeout(() => setVisible(true), 50);
    } catch (e) {
      console.error('起卦失败', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const copyFortune = () => {
    if (!gua) return;
    const text = `【每日一卦】${gua.name}\n${gua.sub}\n\n${gua.verdict}\n\n今日操作：${gua.action} | 仓位：${gua.position} | 财运：${gua.luck}%`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fortune-wrapper">
      <TopNav onNavigate={onNavigate} />
      <div className="fortune-page">
      <p className="fortune-eyebrow">每日一卦 · 交易玄机</p>

      {/* Shrine icon */}
      <div className="fortune-shrine">
        <div className="fortune-shrine__ring" />
        <div className="fortune-shrine__ring--inner" />
        <span
          className={`fortune-shrine__char ${spinning ? 'fortune-shrine__char--spinning' : ''}`}
        >
          {gua?.char ?? '卦'}
        </span>
      </div>

      <p className="fortune-date">{date}</p>

      {gua && <GuaCard gua={gua} visible={visible} />}

      <p className="fortune-disclaimer">
        本卦象纯属娱乐，亏损概不负责，盈利请记得烧香还愿
      </p>

      <button
        className="fortune-cast-btn"
        onClick={() => fetchGua(castCount > 0)}
        disabled={loading}
      >
        {loading ? '天机涌动…' : castCount === 0 ? '起卦问财' : '再问一卦'}
      </button>

      {gua && visible && (
        <div className="fortune-secondary-actions">
          <button className="fortune-secondary-btn" onClick={copyFortune}>
            {copied ? '已复制！' : '复制签文'}
          </button>
          <button className="fortune-secondary-btn" onClick={() => fetchGua(false)}>
            查看今日卦
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

export default Fortune;
