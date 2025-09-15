import React, { useEffect, useState } from 'react';
import showcaseService from '../services/showcaseService.js';
import cfdService from '../services/cfdService.js';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import './Showcase.css';

const Showcase = () => {
  const { currentLanguage } = useLanguage();
  const tr = (key) => t(key, currentLanguage);

  // Translate rating_breakdown keys heuristically
  const translateBreakdownKey = (raw) => {
    if (!raw) return '';
    let s = String(raw).trim();
    // Remove enclosing colon/parenthesis parts and normalize
    s = s.replace(/[：:]+\s*$/g, '');
    s = s.replace(/\([^)]*\)/g, ''); // remove parenthetical content
    s = s.replace(/[\[\]【】]/g, '');
    s = s.replace(/\s+/g, ' ').trim();

    // Try direct slug mapping from cleaned string
    const slugFrom = (txt) => txt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const trySlug = (key) => {
      const val = t(`showcase.breakdownKeys.${key}`, currentLanguage);
      return val && val !== `showcase.breakdownKeys.${key}` ? val : null;
    };
    const directSlug = slugFrom(s);
    const direct = trySlug(directSlug);
    if (direct) return direct;

    // Chinese variants → slugs
    const zhMap = {
      '监管强度': 'regulation', '监管': 'regulation', '监管合规': 'regulation', '合规': 'regulation', '合规性': 'regulation', '安全': 'regulation', '安全性': 'regulation',
      '透明度与合规': 'regulation', '透明度': 'regulation',
      '交易成本': 'fees', '费用': 'fees', '手续费': 'fees', '佣金': 'fees',
      '点差': 'spreads', '点差成本': 'spreads',
      '执行与流动性': 'execution', '流动性': 'execution',
      '平台与产品': 'platform', '平台': 'platform', '工具': 'platform', '平台与工具': 'platform', '平台功能': 'platform', '交易平台': 'platform',
      '产品': 'products', '产品与市场': 'products', '市场': 'products', '可交易品种': 'products', '交易品种': 'products',
      '执行': 'execution', '成交': 'execution', '成交速度': 'execution', '执行速度': 'execution', '滑点': 'execution', '下单速度': 'execution',
      '稳定性与口碑': 'reliability', '可靠性': 'reliability', '稳定性': 'reliability', '可用性': 'reliability', '稳定': 'reliability', '口碑': 'reliability',
      '服务与教育': 'support', '客服': 'support', '客服支持': 'support', '客户支持': 'support', '售后支持': 'support', '服务': 'support',
      '教育': 'education', '培训': 'education', '学习': 'education',
      '研究': 'research', '分析': 'research', '资讯': 'research',
      '研究与教育': 'education-research', '教育与研究': 'education-research',
      '出入金': 'funding', '充值与提现': 'funding', '充值': 'funding', '提现': 'funding', '存取款': 'funding', '资金进出': 'funding',
      '总体': 'overall', '总体评分': 'overall', '综合': 'overall', '综合评分': 'overall', '总评': 'overall', '整体': 'overall'
    };
    if (zhMap[s]) {
      const v = trySlug(zhMap[s]);
      if (v) return v;
    }

    // English variants → slugs
    const enMap = {
      'regulation': 'regulation', 'regulatory': 'regulation', 'compliance': 'regulation', 'safety': 'regulation', 'security': 'regulation',
      'fees': 'fees', 'fee': 'fees', 'costs': 'fees', 'commissions': 'fees', 'commission': 'fees', 'trading-costs': 'fees',
      'spread': 'spreads', 'spreads': 'spreads',
      'platform': 'platform', 'tools': 'platform', 'platform-tools': 'platform', 'platform-and-tools': 'platform',
      'products': 'products', 'markets': 'products', 'instruments': 'products', 'products-and-markets': 'products',
      'execution': 'execution', 'slippage': 'execution', 'order-execution': 'execution',
      'reliability': 'reliability', 'stability': 'reliability', 'uptime': 'reliability', 'availability': 'reliability',
      'support': 'support', 'customer-support': 'support', 'customer-service': 'support', 'service': 'support',
      'education': 'education', 'training': 'education', 'learning': 'education',
      'research': 'research', 'analysis': 'research', 'insights': 'research', 'news': 'research',
      'education-research': 'education-research', 'research-education': 'education-research',
      'funding': 'funding', 'payments': 'funding', 'deposits': 'funding', 'withdrawals': 'funding', 'deposits-withdrawals': 'funding',
      'overall': 'overall', 'overall-score': 'overall', 'summary': 'overall'
    };
    const enSlug = enMap[directSlug];
    if (enSlug) {
      const v = trySlug(enSlug);
      if (v) return v;
    }

    // Fallback to original
    return s;
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null); // CFD/股票/虚拟币 landing sections
  const [selectedEvent, setSelectedEvent] = useState(null);
  // CFD data
  const [cfdBrokers, setCfdBrokers] = useState([]);
  const [cfdNews, setCfdNews] = useState({}); // { [brokerId]: news[] }
  const [cfdLoading, setCfdLoading] = useState(false);
  const [cfdError, setCfdError] = useState(null);
  const [selectedBroker, setSelectedBroker] = useState(null); // broker detail
  const [selectedBrokerNews, setSelectedBrokerNews] = useState([]);

  // Hash helpers: read and write #showcase?section=CFD&broker=ID
  const parseShowcaseHash = () => {
    const raw = (window.location.hash || '').replace('#','');
    const [page, query] = raw.split('?');
    if (page !== 'showcase') return {};
    const params = new URLSearchParams(query || '');
    const section = params.get('section') || null;
    const broker = params.get('broker');
    const brokerId = broker ? parseInt(broker, 10) : null;
    return { section, brokerId: Number.isFinite(brokerId) ? brokerId : null };
  };

  const writeShowcaseHash = (opts = {}) => {
    const params = new URLSearchParams();
    if (opts.section) params.set('section', opts.section);
    if (opts.brokerId) params.set('broker', String(opts.brokerId));
    const newHash = `showcase${params.toString() ? `?${params.toString()}` : ''}`;
    const current = (window.location.hash || '').replace('#','');
    if (current !== newHash) window.location.hash = newHash;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await showcaseService.getCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const loadEvents = async (category) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedEvent(null);
      const data = await showcaseService.getEventsByCategory(category.id);
      setEvents(Array.isArray(data) ? data : []);
      setSelectedCategory(category);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openEvent = async (eventId) => {
    try {
      setLoading(true);
      setError(null);
      const detail = await showcaseService.getEventDetail(eventId);
      setSelectedEvent(detail);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Load CFD brokers + news when section is chosen
  useEffect(() => {
    const loadCFD = async () => {
      if (selectedSection !== 'CFD') return;
      setSelectedBroker(null);
      setSelectedBrokerNews([]);
      try {
        setCfdLoading(true);
        setCfdError(null);
        const brokers = await cfdService.getBrokers();
        setCfdBrokers(Array.isArray(brokers) ? brokers : []);
        // fetch news for each broker in parallel
        const newsEntries = await Promise.all(
          (Array.isArray(brokers) ? brokers : []).map(async (b) => {
            try {
              const news = await cfdService.getBrokerNews(b.id);
              return [b.id, news];
            } catch (e) {
              return [b.id, []];
            }
          })
        );
        const newsMap = Object.fromEntries(newsEntries);
        setCfdNews(newsMap);
      } catch (e) {
        setCfdError(e.message);
      } finally {
        setCfdLoading(false);
      }
    };
    loadCFD();
  }, [selectedSection]);

  // Initialize from hash (details deep link) and listen to hash changes
  useEffect(() => {
    const applyFromHash = async () => {
      const { section, brokerId } = parseShowcaseHash();
      if (section === 'CFD') {
        setSelectedSection('CFD');
        if (brokerId) {
          await openBroker(brokerId);
        }
      }
    };
    applyFromHash();
    const onHash = () => {
      applyFromHash();
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const openBroker = async (brokerId) => {
    try {
      setCfdLoading(true);
      setCfdError(null);
      const [detail, news] = await Promise.all([
        cfdService.getBroker(brokerId),
        cfdService.getBrokerNews(brokerId)
      ]);
      setSelectedBroker(detail);
      setSelectedBrokerNews(Array.isArray(news) ? news : []);
      writeShowcaseHash({ section: 'CFD', brokerId });
    } catch (e) {
      setCfdError(e.message);
    } finally {
      setCfdLoading(false);
    }
  };

  const backToCFDList = () => {
    setSelectedBroker(null);
    setSelectedBrokerNews([]);
    writeShowcaseHash({ section: 'CFD' });
  };

  // Keep hash in sync when only section changes to CFD
  useEffect(() => {
    if (selectedSection === 'CFD' && !selectedBroker) {
      writeShowcaseHash({ section: 'CFD' });
    }
    if (!selectedSection) {
      // Clear showcase query when leaving section
      const current = (window.location.hash || '').replace('#','');
      if (current.startsWith('showcase?')) window.location.hash = 'showcase';
    }
  }, [selectedSection, selectedBroker]);

  const backToCategories = () => {
    setSelectedCategory(null);
    setSelectedEvent(null);
    setEvents([]);
  };

  const backToEvents = () => {
    setSelectedEvent(null);
  };

  return (
    <div className="s-container s-aurora-bg">
      <div className="s-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="s-particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }} />
        ))}
      </div>
      <div className="s-header">
        <div className="s-breadcrumb">
          {!selectedCategory && !selectedEvent && (
            <>
              {!selectedSection && <span className="s-crumb s-crumb-active">{tr('showcase.categories')}</span>}
              {selectedSection && (
                <>
                  <button className="s-btn s-btn-ghost" onClick={() => setSelectedSection(null)}>← {tr('showcase.back')}</button>
                  <span className="s-crumb s-crumb-active">{selectedSection}</span>
                </>
              )}
            </>
          )}
          {selectedCategory && !selectedEvent && (
            <>
              <button className="s-btn s-btn-ghost" onClick={backToCategories}>← {tr('showcase.back')}</button>
              <span className="s-crumb">{selectedCategory.name}</span>
            </>
          )}
          {selectedEvent && (
            <>
              <button className="s-btn s-btn-ghost" onClick={backToEvents}>← {tr('showcase.back')}</button>
              <span className="s-crumb">{selectedCategory?.name || tr('showcase.events')}</span>
              <span className="s-crumb s-crumb-active">{selectedEvent.title}</span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="s-alert s-alert-error">{error}</div>
      )}

      {loading && (
        <div className="s-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="s-card s-skeleton" />
          ))}
        </div>
      )}

      {/* Landing sections: CFD / 股票 / 虚拟币 */}
      {!loading && !selectedCategory && !selectedEvent && !selectedSection && (
        <div className="s-landing">
          <div className="s-sections">
            <button className="s-section-bubble" onClick={() => setSelectedSection('CFD')}>
              <span>CFD</span>
            </button>
            <button className="s-section-bubble" onClick={() => setSelectedSection('stocks')}>
              <span>{tr('showcase.sections.stocks')}</span>
            </button>
            <button className="s-section-bubble" onClick={() => setSelectedSection('crypto')}>
              <span>{tr('showcase.sections.crypto')}</span>
            </button>
          </div>
        </div>
      )}

      {/* After selecting a section */}
      {!loading && !selectedCategory && !selectedEvent && selectedSection && (
        <div className="s-section">
          <div className="s-section-title">{selectedSection}</div>
          {selectedSection === 'CFD' ? (
            <>
              {cfdError && <div className="s-alert s-alert-error">{cfdError}</div>}
              {cfdLoading && (
                <div className="s-grid">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="s-card s-skeleton" />
                  ))}
                </div>
              )}
              {!cfdLoading && !selectedBroker && cfdBrokers.length === 0 && (
                <div className="s-empty">{tr('showcase.noBrokers')}</div>
              )}
              {/* Broker detail view */}
              {!cfdLoading && selectedBroker && (
                <div className="s-detail">
                  <div className="s-detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="s-btn s-btn-ghost" onClick={backToCFDList}>← {tr('showcase.back')}</button>
                    <h1 className="s-detail-title" style={{ marginLeft: 8 }}>{selectedBroker.name}</h1>
                  </div>
                  <div className="s-broker-header">
                    <div className="s-broker-brand">
                      <div className="s-broker-logo" style={{ overflow: 'hidden' }}>
                        {selectedBroker.logo_url ? (
                          <img src={selectedBroker.logo_url} alt={selectedBroker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          (selectedBroker.name || '?').slice(0, 4).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#2a5ea8' }}>{selectedBroker.name}</div>
                        <div className="s-broker-tags">
                          {(selectedBroker.regulators || '').split(',').map(s => s.trim()).filter(Boolean).map((r, idx) => (
                            <span key={idx} className="s-chip">{r}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                      <div className="s-broker-rating">
                        <div className="s-rating-badge">{selectedBroker.rating || '-'}</div>
                        <div className="s-meta">{tr('showcase.overallScore')}</div>
                      </div>
                  </div>

                  <div className="s-broker-body">
                    <div className="s-broker-info">
                      <div className="s-info-title">{tr('showcase.basicInfo')}</div>
                      <ul className="s-info-list">
                        <li><span>{tr('showcase.name')}</span><strong>{selectedBroker.name}</strong></li>
                        <li><span>{tr('showcase.category')}</span><strong>{tr('showcase.cfdBroker')}</strong></li>
                        <li><span>{tr('showcase.regulators')}</span><strong>{(selectedBroker.regulators || '').split(',').map(s => s.trim()).filter(Boolean).join(', ') || '-'}</strong></li>
                        <li><span>{tr('showcase.rating')}</span><strong>{selectedBroker.rating || '-'}</strong></li>
                        <li><span>{tr('showcase.website')}</span><strong>{selectedBroker.website ? <a href={selectedBroker.website} target="_blank" rel="noreferrer">{(selectedBroker.website || '').replace(/^https?:\/\//,'').replace(/\/$/,'')}</a> : '-'}</strong></li>
                      </ul>
                      {selectedBroker.rating_breakdown && (
                        <div style={{ marginTop: 10 }}>
                          <div className="s-info-title">{tr('showcase.ratingBreakdown')}</div>
                          <div className="s-news-list">
                              {Object.entries(selectedBroker.rating_breakdown).map(([k, v]) => {
                                const score = typeof v === 'object' && v !== null ? v.score : v;
                                const weight = typeof v === 'object' && v !== null ? v.weight : undefined;
                                return (
                                  <div key={k} className="s-news-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div className="s-news-title">{translateBreakdownKey(k)}</div>
                                  <div className="s-meta">{weight != null ? `${tr('showcase.weight')} ${Math.round(weight*100)}% · ` : ''}{tr('showcase.score')} {score}</div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="s-broker-news">
                      <div className="s-info-title">{tr('showcase.companyNews')}</div>
                      <div className="s-news-list">
                        {selectedBrokerNews.length === 0 && <div className="s-meta">{tr('showcase.noNews')}</div>}
                        {selectedBrokerNews.map(n => (
                          <div key={n.id} className="s-news-item">
                            <div className="s-news-title">{n.title}</div>
                            <div className="s-meta">{n.tag || tr('showcase.update')}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Broker list view */}
              {!cfdLoading && !selectedBroker && cfdBrokers.map((b) => {
                const regs = (b.regulators || '').split(',').map(s => s.trim()).filter(Boolean);
                const news = cfdNews[b.id] || [];
                const siteText = (b.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
                return (
                  <div key={b.id} className="s-broker s-card" style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => openBroker(b.id)}>
                    <div className="s-broker-header">
                      <div className="s-broker-brand">
                        <div className="s-broker-logo" style={{ overflow: 'hidden' }}>
                          {b.logo_url ? (
                            <img src={b.logo_url} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            (b.name || '?').slice(0, 4).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#2a5ea8' }}>{b.name}</div>
                          <div className="s-broker-tags">
                            {regs.map((r, idx) => <span key={idx} className="s-chip">{r}</span>)}
                          </div>
                        </div>
                      </div>
                      <div className="s-broker-rating">
                        <div className="s-rating-badge">{b.rating || '-'}</div>
                        <div className="s-meta">{tr('showcase.overallScore')}</div>
                      </div>
                    </div>

                    <div className="s-broker-body">
                      <div className="s-broker-info">
                        <div className="s-info-title">{tr('showcase.basicInfo')}</div>
                        <ul className="s-info-list">
                          <li><span>{tr('showcase.name')}</span><strong>{b.name}</strong></li>
                          <li><span>{tr('showcase.category')}</span><strong>{tr('showcase.cfdBroker')}</strong></li>
                          <li><span>{tr('showcase.regulators')}</span><strong>{regs.join(', ') || '-'}</strong></li>
                          <li><span>{tr('showcase.rating')}</span><strong>{b.rating || '-'}</strong></li>
                          <li><span>{tr('showcase.website')}</span><strong>{b.website ? <a href={b.website} target="_blank" rel="noreferrer" onClick={(e)=> e.stopPropagation()}>{siteText}</a> : '-'}</strong></li>
                        </ul>
                        {b.rating_breakdown && (
                          <div style={{ marginTop: 10 }}>
                            <div className="s-info-title">{tr('showcase.ratingBreakdown')}</div>
                            <div className="s-news-list">
                              {Object.entries(b.rating_breakdown).map(([k, v]) => {
                                const score = typeof v === 'object' && v !== null ? v.score : v;
                                const weight = typeof v === 'object' && v !== null ? v.weight : undefined;
                                return (
                                  <div key={k} className="s-news-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="s-news-title">{translateBreakdownKey(k)}</div>
                                    <div className="s-meta">{weight != null ? `${tr('showcase.weight')} ${Math.round(weight*100)}% · ` : ''}{tr('showcase.score')} {score}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="s-broker-news">
                        <div className="s-info-title">{tr('showcase.companyNews')}</div>
                        <div className="s-news-list">
                          {news.length === 0 && <div className="s-meta">{tr('showcase.noNews')}</div>}
                          {news.map((n) => (
                            <div key={n.id} className="s-news-item">
                              <div className="s-news-title">{n.title}</div>
                              <div className="s-meta">{n.tag || tr('showcase.update')}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="s-grid s-grid-events">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="s-card s-card-hover">
                  <div className="s-card-title">{selectedSection} · {tr('showcase.placeholderContent')}</div>
                  <div className="s-meta">{tr('showcase.comingSoon')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && selectedCategory && !selectedEvent && (
        <div className="s-section">
          <div className="s-section-title">{selectedCategory.name} · {tr('showcase.events')}</div>
          <div className="s-grid s-grid-events">
            {events.map((ev) => (
              <div key={ev.id} className="s-card s-card-hover" onClick={() => openEvent(ev.id)}>
                <div className="s-card-title s-ellipsis-2">{ev.title}</div>
                <div className="s-meta">{tr('showcase.createdAt')}: {new Date(ev.created_at).toLocaleString()}</div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="s-empty">{tr('messages.noData')}</div>
            )}
          </div>
        </div>
      )}

      {!loading && selectedEvent && (
        <div className="s-detail">
          <div className="s-detail-header">
            <h1 className="s-detail-title">{selectedEvent.title}</h1>
            <div className="s-meta">
              {tr('showcase.createdAt')}: {new Date(selectedEvent.created_at).toLocaleString()} · {tr('showcase.submittedBy')}: {selectedEvent.submitted_by || '-'}
            </div>
          </div>
          {selectedEvent.content && (
            <div className="s-content">{selectedEvent.content}</div>
          )}
          {selectedEvent.images && selectedEvent.images.length > 0 && (
            <div className="s-gallery">
              {selectedEvent.images.map((url, idx) => (
                <div key={idx} className="s-thumb">
                  <img src={url} alt={`img-${idx}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Showcase;
