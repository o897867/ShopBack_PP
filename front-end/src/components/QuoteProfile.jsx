import React, { useMemo } from 'react';

/**
 * 价格分布（伪深度）：用最近的报价历史，将买量/卖量按价位桶累积，
 * 生成左右对称的简易直方图，视觉上接近 volume profile。
 */
const QuoteProfile = ({ history = [], bucketSize = 0.5, maxRows = 22 }) => {
  const buckets = useMemo(() => {
    if (!history.length) return [];

    const map = new Map();
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    history.forEach((q) => {
      const mid = Number(q.mid || q.bid || q.ask || 0);
      if (!mid) return;
      const bidSize = Number(q.bid_size || 0);
      const askSize = Number(q.ask_size || 0);
      const bucket = Math.round(mid / bucketSize) * bucketSize;
      const key = bucket.toFixed(2);
      const prev = map.get(key) || { price: bucket, buy: 0, sell: 0 };
      prev.buy += bidSize;
      prev.sell += askSize;
      map.set(key, prev);
      minPrice = Math.min(minPrice, bucket);
      maxPrice = Math.max(maxPrice, bucket);
    });

    const arr = Array.from(map.values()).sort((a, b) => b.price - a.price);
    // 限制行数以保持紧凑
    return arr.slice(0, maxRows);
  }, [history, bucketSize, maxRows]);

  const maxVol = useMemo(() => {
    if (!buckets.length) return 1;
    return Math.max(...buckets.map((b) => Math.max(b.buy, b.sell, b.buy + b.sell)));
  }, [buckets]);

  if (!buckets.length) {
    return <div className="profile-empty">暂无足够报价历史生成分布</div>;
  }

  const fmt = (v, d = 1) => (v === null || v === undefined ? '--' : Number(v).toFixed(d));

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div></div>
        <div></div>
        <div className="profile-legend">
          <span className="legend-sell">Sell</span>
          <span className="legend-buy">Buy</span>
        </div>
      </div>
      <div className="profile-grid">
        {buckets.map((b) => {
          const buyPct = Math.min(100, (b.buy / maxVol) * 100);
          const sellPct = Math.min(100, (b.sell / maxVol) * 100);
          return (
            <div className="profile-row" key={b.price}>
              <div className="profile-price">{fmt(b.price, 2)}</div>
              <div className="profile-bars">
                <div className="bar sell" style={{ width: `${sellPct}%` }} />
                <div className="bar buy" style={{ width: `${buyPct}%` }} />
              </div>
              <div className="profile-vol">
                <span className="sell-text">{fmt(b.sell, 1)}</span>
                <span className="buy-text">{fmt(b.buy, 1)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuoteProfile;
