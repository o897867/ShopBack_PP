import React from 'react';
import './OrderBook.css';
import { useXauQuote } from '../hooks/useXauQuote';
import { useXauQuoteHistory } from '../hooks/useXauQuoteHistory';
import QuoteSparkline from '../components/QuoteSparkline';
import QuoteProfile from '../components/QuoteProfile';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../translations/index';

const formatNumber = (num, decimals = 1) => {
  if (num === null || num === undefined) return '--';
  return Number(num).toFixed(decimals);
};

const formatTime = (ts) => {
  if (!ts) return '--';
  const d = new Date(ts * (ts > 1e12 ? 1 : 1000)); // support sec or ms
  return d.toLocaleTimeString();
};

const OrderBook = () => {
  const { currentLanguage } = useLanguage();
  const translate = (key) => t(key, currentLanguage);

  const { quote, error, isLoading } = useXauQuote(2000);
  const { history, error: historyError } = useXauQuoteHistory(4000);

  const bid = quote?.bid || null;
  const ask = quote?.ask || null;
  const bidSize = quote?.bid_size || null;
  const askSize = quote?.ask_size || null;
  const mid = bid && ask ? (bid + ask) / 2 : null;
  const spread = bid && ask ? ask - bid : null;

  const recentQuotes = history.slice(-10).reverse(); // latest first

  return (
    <div className="orderbook-container">
      <div className="orderbook-inner">
        <h2 className="orderbook-title">{translate('orderbook.hero.badge')}</h2>
        <p className="orderbook-subtitle">{translate('orderbook.hero.subtitle')}</p>

        <div className="orderbook-section">
          <div className="orderbook-cards">
            <div className="orderbook-card bid">
              <div className="label">{translate('orderbook.cards.bidLabel')}</div>
              <div className="price">{formatNumber(bid, 1)}</div>
              <div className="size">{translate('orderbook.cards.quantityLabel')} {formatNumber(bidSize, 1)}</div>
            </div>
            <div className="orderbook-card ask">
              <div className="label">{translate('orderbook.cards.askLabel')}</div>
              <div className="price">{formatNumber(ask, 1)}</div>
              <div className="size">{translate('orderbook.cards.quantityLabel')} {formatNumber(askSize, 1)}</div>
            </div>
            <div className="orderbook-card neutral">
              <div className="label">{translate('orderbook.cards.midLabel')}</div>
              <div className="price">{formatNumber(mid, 1)}</div>
              <div className="size">{translate('orderbook.cards.spreadLabel')} {formatNumber(spread, 2)}</div>
            </div>
          </div>
        </div>

        <div className="orderbook-section orderbook-chart">
          <div className="orderbook-grid">
            <div className="orderbook-panel wide">
              <QuoteSparkline history={history} />
            </div>
            <div className="orderbook-panel narrow">
              <div className="chart-title">{translate('orderbook.chart.priceDistribution')}</div>
              <QuoteProfile history={history} bucketSize={0.5} />
            </div>
          </div>
        </div>

        <div className="orderbook-section orderbook-history">
          <div className="history-header">
            <div>{translate('orderbook.history.time')}</div>
            <div>{translate('orderbook.history.bidVolume')}</div>
            <div>{translate('orderbook.history.bidPrice')}</div>
            <div>{translate('orderbook.history.askPrice')}</div>
            <div>{translate('orderbook.history.askVolume')}</div>
            <div>{translate('orderbook.history.spread')}</div>
          </div>
          {recentQuotes.map((q, idx) => (
            <div className="history-row" key={idx}>
              <div className="time-text">{formatTime(q.timestamp)}</div>
              <div className="bid-size">{formatNumber(q.bid_size, 1)}</div>
              <div className="bid-text">{formatNumber(q.bid, 1)}</div>
              <div className="ask-text">{formatNumber(q.ask, 1)}</div>
              <div className="ask-size">{formatNumber(q.ask_size, 1)}</div>
              <div className="spread-text">{formatNumber(q.spread, 2)}</div>
            </div>
          ))}
          {historyError && <div className="muted">{translate('orderbook.history.fetchError', { error: historyError })}</div>}
        </div>

        <div className="orderbook-footer">
          {isLoading ? translate('orderbook.footer.loading') : error ? translate('orderbook.footer.error', { error }) : translate('orderbook.footer.lastUpdate', { time: formatTime(quote?.timestamp) })}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
