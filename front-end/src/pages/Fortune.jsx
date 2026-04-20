import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './Fortune.css';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import { generateFortune, fetchDailyFortuneFromApi } from '../utils/fortune.js';

const Fortune = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const [refreshTick, setRefreshTick] = useState(() => Date.now());
  const [fortune, setFortune] = useState(null);
  const [isRemote, setIsRemote] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const translate = useCallback(
    (key, params = {}) => t(key, currentLanguage, params),
    [currentLanguage]
  );
  useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 5, 0); // refresh a few seconds after local midnight
    const timeout = Math.max(1000, next.getTime() - now.getTime());
    const id = window.setTimeout(() => setRefreshTick(Date.now()), timeout);
    return () => window.clearTimeout(id);
  }, [refreshTick]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      const remote = await fetchDailyFortuneFromApi(translate, currentLanguage);
      if (cancelled) return;
      if (remote) {
        setFortune(remote);
        setIsRemote(true);
      } else {
        setFortune(generateFortune(currentLanguage, translate));
        setIsRemote(false);
      }
      setIsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [currentLanguage, translate, refreshTick]);

  const fortuneData = fortune || generateFortune(currentLanguage, translate);
  const compassAngle = useMemo(() => {
    const dir = (fortuneData?.direction || '').toLowerCase();
    if (dir.includes('东南') || dir.includes('southeast')) return 135;
    if (dir.includes('正东') || (dir.includes('east') && !dir.includes('west'))) return 90;
    if (dir.includes('西南') || dir.includes('southwest')) return 225;
    if (dir.includes('正西') || dir.includes('west')) return 270;
    if (dir.includes('南') || dir.includes('south')) return 180;
    return 0; // 北
  }, [fortuneData.direction, fortuneData]);

  const handleNavigate = (target) => {
    if (!onNavigate) return;
    onNavigate(target);
  };

  return (
    <div className="fortune-page">
      <section className="fortune-hero">
        <div className="fortune-hero__content">
          <div className="fortune-badge">{translate('home.fortune.title')}</div>
          <h1 className="fortune-hero__title">
            {currentLanguage === 'zh-CN'
              ? '今日下单气运如何？先算一卦，再动鼠标。'
              : 'What do the stars say about placing an order today?'}
          </h1>
          <p className="fortune-hero__subtitle">
            {translate('home.fortune.subtitle')} {translate('home.fortune.refresh')}
          </p>
          <div className="fortune-hero__actions">
            <button className="btn btn-primary" onClick={() => handleNavigate('trading')}>
              {translate('home.fortune.actions.trade')}
            </button>
            <button className="btn btn-ghost" onClick={() => handleNavigate('broker-hub')}>
              {translate('home.fortune.actions.compare')}
            </button>
            <button className="btn btn-ghost" onClick={() => handleNavigate('home')}>
              {translate('nav.home')}
            </button>
          </div>
        </div>
      </section>

      <main className="fortune-shell">
        <div className="fortune-grid">
          <div className={`fortune-card fortune-card--${fortuneData.tier.accent}`}>
            <div className="fortune-card__pill">{fortuneData.tier.label}</div>
            <div className="fortune-card__verdict">
              <div className="fortune-card__label">{translate('home.fortune.fields.verdict')}</div>
              <h3 className="fortune-card__headline">{fortuneData.tier.verdict}</h3>
            </div>

            <div className="fortune-meter">
              <div className="fortune-meter__header">
                <span>{translate('home.fortune.fields.qi')}</span>
                <span className="fortune-meter__value">{fortuneData.qiIndex}/100</span>
              </div>
              <div className="fortune-meter__bar">
                <div
                  className="fortune-meter__fill"
                  style={{ width: `${Math.min(100, fortuneData.qiIndex)}%` }}
                />
              </div>
              <div className="fortune-meter__hint">
                <strong>{fortuneData.qi.label}</strong> · {fortuneData.qi.tip}
              </div>
            </div>

            <div className="fortune-grid__inline">
              <div className="fortune-inline-block">
                <div className="fortune-inline__label">{translate('home.fortune.fields.amulet')}</div>
                <div className="fortune-inline__value">{fortuneData.amulet.label}</div>
                <div className="fortune-inline__hint">{fortuneData.amulet.tip}</div>
              </div>
              <div className="fortune-inline-block">
                <div className="fortune-inline__label">{translate('home.fortune.fields.direction')}</div>
                <div className="fortune-inline__value">{fortuneData.direction}</div>
                <div className="fortune-inline__hint">{fortuneData.note}</div>
              </div>
            </div>

            <div className="fortune-actions">
              <button className="btn btn-primary" onClick={() => handleNavigate('trading')}>
                {translate('home.fortune.actions.trade')}
              </button>
              <button className="btn btn-ghost" onClick={() => handleNavigate('broker-hub')}>
                {translate('home.fortune.actions.compare')}
              </button>
            </div>
          </div>

          <div className="fortune-side">
            <div className="fortune-side__row">
              <span className="fortune-side__label">{translate('home.fortune.fields.ritual')}</span>
                <span className="fortune-side__value">{fortuneData.ritual}</span>
              </div>
              <div className="fortune-side__row">
                <span className="fortune-side__label">{translate('home.fortune.fields.avoid')}</span>
                <span className="fortune-side__value fortune-side__value--muted">{fortuneData.taboo}</span>
              </div>
              <div className="fortune-side__note">{fortuneData.note}</div>
            </div>
        </div>

        <div className="fortune-compass-card">
          <div className="fortune-compass__header">
            <div>
              <div className="fortune-compass__eyebrow">{translate('home.fortune.fields.compass')}</div>
              <div className="fortune-compass__hint">{translate('home.fortune.fields.direction')}</div>
            </div>
            <div className="fortune-compass__direction">{fortuneData.direction}</div>
          </div>
          <div className="fortune-compass">
            <div className="fortune-compass__dial">
              <div className="fortune-compass__ring" />
              <div className="fortune-compass__ring fortune-compass__ring--inner" />
              <div className="fortune-compass__pointer" style={{ transform: `translate(-50%, 0) rotate(${compassAngle}deg)` }} />
              <div className="fortune-compass__center" />
              <div className="fortune-compass__label fortune-compass__label--n">N</div>
              <div className="fortune-compass__label fortune-compass__label--e">E</div>
              <div className="fortune-compass__label fortune-compass__label--s">S</div>
              <div className="fortune-compass__label fortune-compass__label--w">W</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Fortune;
