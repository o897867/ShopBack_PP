import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import { useLanguage } from '../hooks/useLanguage.jsx';
import './Analytics.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
);

const API = import.meta.env.VITE_API_URL || '';

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetch(`${API}${url}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url]);
  return { data, loading };
}

/* ========== XAU Tab ========== */
function XauTab() {
  const { data: daily, loading: l1 } = useFetch('/api/analytics/xau/daily-stats?days=90');
  const { data: vol, loading: l2 } = useFetch('/api/analytics/xau/volatility?days=90');
  const { data: sess } = useFetch('/api/analytics/xau/sessions');
  const { data: weekly } = useFetch('/api/analytics/xau/weekly');

  if (l1 || l2) return <div className="an-loading">Loading...</div>;
  if (!daily?.results) return <div className="an-empty">No data available</div>;

  const ds = daily.results;
  const labels = ds.map(d => d.date.slice(5));
  const closes = ds.map(d => d.close);

  const priceChart = {
    labels,
    datasets: [{
      label: 'XAU Close',
      data: closes,
      borderColor: '#D4AF37',
      backgroundColor: 'rgba(212,175,55,0.1)',
      fill: true,
      pointRadius: 0,
      borderWidth: 1.5,
    }],
  };

  const volSeries = vol?.results?.series || [];
  const volChart = {
    labels: volSeries.map(d => d.date.slice(5)),
    datasets: [
      {
        label: '20d Vol',
        data: volSeries.map(d => d.vol_20d ? +(d.vol_20d * 100).toFixed(1) : null),
        borderColor: '#6366f1',
        pointRadius: 0,
        borderWidth: 1.5,
      },
      {
        label: 'ATR-14',
        data: volSeries.map(d => d.atr_14),
        borderColor: '#f59e0b',
        pointRadius: 0,
        borderWidth: 1.5,
        yAxisID: 'y1',
      },
    ],
  };

  const sessions = sess?.results || {};
  const sessLabels = Object.keys(sessions);
  const sessChart = {
    labels: sessLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [{
      label: 'Avg Return %',
      data: sessLabels.map(s => sessions[s]?.avg_return_pct),
      backgroundColor: sessLabels.map(s =>
        (sessions[s]?.avg_return_pct || 0) >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'
      ),
    }],
  };

  return (
    <div className="an-grid">
      <div className="an-card an-card--wide">
        <h3>Daily Close Price (90d)</h3>
        <div className="an-chart"><Line data={priceChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
      </div>

      <div className="an-card an-card--wide">
        <h3>Volatility</h3>
        <p className="an-meta">
          Regime: <strong>{vol?.results?.current_regime}</strong> |
          20d Vol: {vol?.results?.current_vol_20d ? (vol.results.current_vol_20d * 100).toFixed(1) + '%' : '-'} |
          Percentile: {vol?.results?.vol_percentile}%
        </p>
        <div className="an-chart">
          <Line data={volChart} options={{
            responsive: true, maintainAspectRatio: false,
            scales: { y: { position: 'left', title: { display: true, text: 'Vol %' } }, y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'ATR' } } },
            plugins: { legend: { position: 'top' } },
          }} />
        </div>
      </div>

      <div className="an-card">
        <h3>Session Performance</h3>
        <div className="an-chart"><Bar data={sessChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
        <div className="an-stats">
          {sessLabels.map(s => (
            <div key={s} className="an-stat">
              <span className="an-stat__label">{s}</span>
              <span className="an-stat__value">Win {sessions[s]?.win_rate}%</span>
            </div>
          ))}
        </div>
      </div>

      {weekly?.results && (
        <div className="an-card">
          <h3>Weekly Summary</h3>
          <div className="an-table-wrap">
            <table className="an-table">
              <thead><tr><th>Week</th><th>Open</th><th>Close</th><th>Return</th><th>Trend</th></tr></thead>
              <tbody>
                {weekly.results.slice(-8).map(w => (
                  <tr key={w.week_ending}>
                    <td>{w.week_ending.slice(5)}</td>
                    <td>{w.open?.toFixed(0)}</td>
                    <td>{w.close?.toFixed(0)}</td>
                    <td className={w.return_pct >= 0 ? 'an-up' : 'an-down'}>{w.return_pct?.toFixed(2)}%</td>
                    <td>{w.trend === 'up' ? '\u2191' : '\u2193'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== News Tab ========== */
function NewsTab() {
  const { data: sent, loading: l1 } = useFetch('/api/analytics/news/sentiment');
  const { data: cats } = useFetch('/api/analytics/news/categories');
  const { data: corr } = useFetch('/api/analytics/news/correlation');
  const { data: syms } = useFetch('/api/analytics/news/symbols');

  if (l1) return <div className="an-loading">Loading...</div>;

  const series = sent?.results?.series || [];
  const last60 = series.slice(-60);

  const sentChart = {
    labels: last60.map(d => d.date.slice(5)),
    datasets: [
      { label: 'Positive', data: last60.map(d => d.positive), backgroundColor: 'rgba(34,197,94,0.6)', stack: 'a' },
      { label: 'Neutral', data: last60.map(d => d.neutral), backgroundColor: 'rgba(245,158,11,0.4)', stack: 'a' },
      { label: 'Negative', data: last60.map(d => d.negative), backgroundColor: 'rgba(239,68,68,0.6)', stack: 'a' },
    ],
  };

  const overall = cats?.results?.overall || {};
  const catLabels = Object.keys(overall);
  const catColors = ['#6366f1', '#f59e0b', '#22c55e', '#D4AF37', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899'];
  const catChart = {
    labels: catLabels,
    datasets: [{ data: catLabels.map(k => overall[k]), backgroundColor: catColors.slice(0, catLabels.length) }],
  };

  const corrData = corr?.results || {};
  const scatter = corrData.scatter || [];
  const scatterChart = {
    datasets: [{
      label: 'Sentiment vs Next-Day Return',
      data: scatter.map(d => ({ x: d.net_sentiment, y: d.next_day_return })),
      backgroundColor: 'rgba(99,102,241,0.5)',
      pointRadius: 4,
    }],
  };

  const topSyms = syms?.results?.top_symbols || [];

  return (
    <div className="an-grid">
      <div className="an-card an-card--wide">
        <h3>Daily Sentiment (60d)</h3>
        <p className="an-meta">
          Total: {sent?.results?.summary?.total_articles_with_sentiment?.toLocaleString()} articles |
          Avg Net: {sent?.results?.summary?.avg_net_sentiment?.toFixed(3)}
        </p>
        <div className="an-chart">
          <Bar data={sentChart} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } }, plugins: { legend: { position: 'top' } } }} />
        </div>
      </div>

      {catLabels.length > 0 && (
        <div className="an-card">
          <h3>Category Distribution</h3>
          <div className="an-chart an-chart--sq">
            <Doughnut data={catChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } } }} />
          </div>
        </div>
      )}

      <div className="an-card">
        <h3>Sentiment-Price Correlation</h3>
        <div className="an-corr-stats">
          <div><span>Same Day</span><strong>{corrData.same_day_correlation ?? '-'}</strong></div>
          <div><span>Next Day</span><strong>{corrData.next_day_correlation ?? '-'}</strong></div>
          {corrData.lag_correlations && Object.entries(corrData.lag_correlations).map(([k, v]) => (
            <div key={k}><span>Lag {k.split('_')[1]}d</span><strong>{v}</strong></div>
          ))}
        </div>
        {scatter.length > 0 && (
          <div className="an-chart an-chart--sq">
            <Scatter data={scatterChart} options={{
              responsive: true, maintainAspectRatio: false,
              scales: { x: { title: { display: true, text: 'Net Sentiment' } }, y: { title: { display: true, text: 'Next-Day Return %' } } },
              plugins: { legend: { display: false } },
            }} />
          </div>
        )}
      </div>

      {topSyms.length > 0 && (
        <div className="an-card an-card--wide">
          <h3>Top Mentioned Symbols</h3>
          <div className="an-chart">
            <Bar data={{
              labels: topSyms.slice(0, 15).map(s => s.symbol),
              datasets: [{ label: 'Mentions', data: topSyms.slice(0, 15).map(s => s.count), backgroundColor: 'rgba(99,102,241,0.6)' }],
            }} options={{
              responsive: true, maintainAspectRatio: false, indexAxis: 'y',
              plugins: { legend: { display: false } },
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== Main ========== */
export default function Analytics() {
  const [tab, setTab] = useState('xau');
  const { data: status } = useFetch('/api/analytics/status');

  return (
    <div className="an">
      <header className="an-header">
        <h1>Analytics Dashboard</h1>
        {status && (
          <p className="an-meta">
            Data from S3 via Lambda |
            Last updated: {status.analyses?.xau_daily_stats?.last_modified?.slice(0, 16).replace('T', ' ') || 'N/A'}
          </p>
        )}
      </header>

      <div className="an-tabs">
        <button className={`an-tab ${tab === 'xau' ? 'active' : ''}`} onClick={() => setTab('xau')}>
          XAU / Gold
        </button>
        <button className={`an-tab ${tab === 'news' ? 'active' : ''}`} onClick={() => setTab('news')}>
          News Sentiment
        </button>
      </div>

      {tab === 'xau' ? <XauTab /> : <NewsTab />}
    </div>
  );
}
