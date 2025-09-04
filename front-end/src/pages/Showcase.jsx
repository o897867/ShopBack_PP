import React, { useEffect, useState } from 'react';
import showcaseService from '../services/showcaseService.js';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import './Showcase.css';

const Showcase = () => {
  const { currentLanguage } = useLanguage();
  const tr = (key) => t(key, currentLanguage);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null); // CFD/股票/虚拟币 landing sections
  const [selectedEvent, setSelectedEvent] = useState(null);

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
              {!selectedSection && <span className="s-crumb s-crumb-active">行业</span>}
              {selectedSection && (
                <>
                  <button className="s-btn s-btn-ghost" onClick={() => setSelectedSection(null)}>← 返回</button>
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
            <button className="s-section-bubble" onClick={() => setSelectedSection('股票')}>
              <span>股票</span>
            </button>
            <button className="s-section-bubble" onClick={() => setSelectedSection('虚拟币')}>
              <span>虚拟币</span>
            </button>
          </div>
        </div>
      )}

      {/* After selecting a section */}
      {!loading && !selectedCategory && !selectedEvent && selectedSection && (
        <div className="s-section">
          <div className="s-section-title">{selectedSection}</div>

          {selectedSection === 'CFD' ? (
            <div className="s-broker s-card">
              <div className="s-broker-header">
                <div className="s-broker-brand">
                  <div className="s-broker-logo">TMGM</div>
                  <div className="s-broker-tags">
                    <span className="s-chip">ASIC</span>
                    <span className="s-chip">VFSCN</span>
                  </div>
                </div>
                <div className="s-broker-rating">
                  <div className="s-rating-badge">A+</div>
                  <div className="s-meta">综合评分</div>
                </div>
              </div>

              <div className="s-broker-body">
                <div className="s-broker-info">
                  <div className="s-info-title">基础信息</div>
                  <ul className="s-info-list">
                    <li><span>名称</span><strong>TMGM</strong></li>
                    <li><span>类别</span><strong>CFD 经纪商</strong></li>
                    <li><span>监管</span><strong>ASIC, VFSCN</strong></li>
                    <li><span>评分</span><strong>A+</strong></li>
                    <li><span>官方网址</span><strong><a href="#" onClick={(e)=>e.preventDefault()}>tmgm.com</a></strong></li>
                  </ul>
                </div>
                <div className="s-broker-news">
                  <div className="s-info-title">公司消息</div>
                  <div className="s-news-list">
                    <div className="s-news-item">
                      <div className="s-news-title">TMGM 推出新产品升级与平台优化</div>
                      <div className="s-meta">近期 · 简讯</div>
                    </div>
                    <div className="s-news-item">
                      <div className="s-news-title">合规动态：维持 ASIC、VFSCN 多重监管</div>
                      <div className="s-meta">行业观察</div>
                    </div>
                    <div className="s-news-item">
                      <div className="s-news-title">服务体验升级：客户支持与教育内容丰富</div>
                      <div className="s-meta">平台更新</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="s-grid s-grid-events">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="s-card s-card-hover">
                  <div className="s-card-title">{selectedSection} · 内容预留</div>
                  <div className="s-meta">敬请期待</div>
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
