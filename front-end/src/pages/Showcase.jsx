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
    <div className="s-container">
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
            <span className="s-crumb s-crumb-active">{tr('showcase.categories')}</span>
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

      {!loading && !selectedCategory && !selectedEvent && (
        <>
          <div className="s-grid">
            {categories.map((cat) => (
              <div key={cat.id} className="s-card s-card-hover" onClick={() => loadEvents(cat)}>
                {cat.image_url && (
                  <div className="s-image">
                    <img src={cat.image_url} alt={cat.name} />
                  </div>
                )}
                <div className="s-card-title">{cat.name}</div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="s-empty">{tr('messages.noData')}</div>
            )}
          </div>
        </>
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
