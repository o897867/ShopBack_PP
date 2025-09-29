import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import './Forum.css';

const api = {
  listThreads: async ({ limit = 20, offset = 0, tag, author } = {}) => {
    const params = new URLSearchParams();
    params.set('limit', limit);
    params.set('offset', offset);
    if (tag) params.set('tag', tag);
    if (author) params.set('author', author);
    const res = await fetch(`/api/forum/threads?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch threads: ${res.status}`);
    return res.json();
  },
  createThread: async (payload) => {
    const res = await fetch('/api/forum/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getThread: async (id, { page = 1, page_size = 20 } = {}) => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('page_size', page_size);
    const res = await fetch(`/api/forum/threads/${id}?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch thread: ${res.status}`);
    return res.json();
  },
  reply: async (threadId, payload) => {
    const res = await fetch(`/api/forum/threads/${threadId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

function useLocalName() {
  const [name, setName] = useState(() => localStorage.getItem('forum_name') || '');
  const save = (v) => {
    setName(v);
    try { localStorage.setItem('forum_name', v || ''); } catch {}
  };
  return { name, setName: save };
}

export default function Forum() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null); // { thread, posts }
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // HTML string
  const [replyContent, setReplyContent] = useState('');
  const { name, setName } = useLocalName();
  const titleLimit = 120;
  const contentLimit = 10000;
  const [me, setMe] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { currentLanguage } = useLanguage();
  const translate = useCallback((key, params = {}) => t(key, currentLanguage, params), [currentLanguage]);

  const forumMetrics = useMemo(() => {
    const authorSet = new Set();
    threads.forEach((thread) => {
      if (thread?.author_name) {
        authorSet.add(thread.author_name);
      }
    });
    if (selected?.thread?.author_name) {
      authorSet.add(selected.thread.author_name);
    }
    (selected?.posts || []).forEach((post) => {
      if (post?.author_name) {
        authorSet.add(post.author_name);
      }
    });

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const threadsToday = threads.filter((thread) => {
      const ts = thread?.last_post_at || thread?.created_at;
      if (!ts) return false;
      const date = new Date(ts);
      if (Number.isNaN(date.getTime())) return false;
      return now - date.getTime() <= dayMs;
    }).length;

    const repliesToday = (selected?.posts || []).filter((post) => {
      const date = new Date(post?.created_at ?? 0);
      if (Number.isNaN(date.getTime())) return false;
      return now - date.getTime() <= dayMs;
    }).length;

    return {
      threads: threads.length,
      members: authorSet.size,
      activity: threadsToday + repliesToday
    };
  }, [threads, selected]);

  const refreshThreads = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listThreads({ limit: 20, offset: 0 });
      setThreads(data || []);
    } catch (e) {
      setError(e.message || translate('forum.errors.loadThreads'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshThreads(); }, []);

  useEffect(() => {
    const checkMe = async () => {
      try {
        const res = await fetch('/auth/me');
        if (res.ok) setMe(await res.json());
      } catch {}
      setAuthChecked(true);
    };
    checkMe();
  }, []);

  const openThread = async (id) => {
    setError('');
    try {
      const data = await api.getThread(id, { page: 1, page_size: 50 });
      setSelected(data);
      setReplyContent('');
    } catch (e) { setError(e.message || translate('forum.errors.openThread')); }
  };

  const createThread = async () => {
    if (!title.trim() || !content.trim()) return;
    setCreating(true);
    setError('');
    try {
      const created = await api.createThread({ title: title.trim(), content_html: content, tags: [], author_name: name || undefined });
      setTitle('');
      setContent('');
      await refreshThreads();
      await openThread(created.id);
    } catch (e) {
      setError(e.message || translate('forum.errors.createThread'));
    } finally {
      setCreating(false);
    }
  };

  const sendReply = async () => {
    if (!selected?.thread?.id || !replyContent.trim()) return;
    setError('');
    try {
      await api.reply(selected.thread.id, { content_html: replyContent, author_name: name || undefined });
      const id = selected.thread.id;
      await openThread(id);
    } catch (e) {
      setError(e.message || translate('forum.errors.sendReply'));
    }
  };

  // MVP: plain textarea editor to avoid peer-deps issues

  const anonymousLabel = translate('forum.common.anonymous');

  const heroTiles = [
    {
      label: translate('forum.metrics.liveThreads'),
      value: forumMetrics.threads
    },
    {
      label: translate('forum.metrics.activeMembers'),
      value: forumMetrics.members
    },
    {
      label: translate('forum.metrics.newActivity'),
      value: forumMetrics.activity
    }
  ];

  return (
    <div className="forum-container">
      <div className="forum-header">
        <h1 className="forum-title">{translate('forum.title')}</h1>
        <p className="forum-subtitle">{translate('forum.subtitle')}</p>
      </div>

      <div className="forum-content">
        <div className="forum-sidebar">
          <div className="forum-compose">
            <h3 className="forum-card__title">{translate('forum.newThread.title')}</h3>

            {me ? (
              <span className="forum-inline-hint">{translate('forum.common.loggedIn', { name: me.username || me.display_name })}</span>
            ) : (
              <input
                type="text"
                placeholder={translate('forum.common.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="forum-input"
              />
            )}

            <input
              className="forum-input"
              placeholder={translate('forum.newThread.titlePlaceholder', { limit: titleLimit })}
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, titleLimit))}
              maxLength={titleLimit}
            />
            <div className="forum-counter">{translate('forum.common.counter', { current: title.length, limit: titleLimit })}</div>

            <textarea
              className="forum-textarea"
              placeholder={translate('forum.newThread.contentPlaceholder')}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, contentLimit))}
              rows={6}
            />
            <div className="forum-compose__footer">
              <span className="forum-inline-hint">{translate('forum.newThread.hint')}</span>
              {!me && authChecked && (
                <div className="forum-error">{translate('forum.newThread.loginRequired')}</div>
              )}
              <button className="forum-btn forum-btn-primary" onClick={createThread} disabled={!me || creating || !title.trim() || !content.trim()}>
                {creating ? translate('forum.newThread.creating') : translate('forum.newThread.create')}
              </button>
            </div>
          </div>

          <div className="forum-thread-list">
            <div className="forum-thread-list__header">
              <h3 className="forum-card__title">{translate('forum.threadList.title')}</h3>
              <button className="forum-btn forum-btn-secondary" onClick={refreshThreads}>{translate('forum.common.refresh')}</button>
            </div>

            {loading ? (
              <div className="forum-loading">
                <div className="forum-spinner"></div>
                {translate('forum.common.loading')}
              </div>
            ) : error ? (
              <div className="forum-error">{error}</div>
            ) : threads.length === 0 ? (
              <div className="forum-empty">{translate('forum.threadList.empty')}</div>
            ) : (
              <ul>
                {threads.map((thread) => {
                  const author = thread.author_name || anonymousLabel;
                  const isActive = selected?.thread?.id === thread.id;
                  return (
                    <li
                      key={thread.id}
                      className={`forum-thread ${isActive ? 'active' : ''}`}
                      onClick={() => openThread(thread.id)}
                    >
                      <div className="forum-thread__header">
                        <p className="forum-thread__title">{thread.title}</p>
                        <span className="forum-thread__badge">{translate('forum.threadList.badge')}</span>
                      </div>
                      <div className="forum-thread__meta">
                        <span>{translate('forum.threadList.by', { author })}</span>
                        <span>•</span>
                        <span>{new Date(thread.created_at).toLocaleString()}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="forum-stats">
            <h3>{translate('forum.metrics.activeMembers')}</h3>
            {heroTiles.map((tile) => (
              <div key={tile.label} className="forum-kpi">
                <span className="forum-kpi__label">{tile.label}</span>
                <span className="forum-kpi__value">{tile.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="forum-main">
          <div className="forum-thread-view">
            {!selected ? (
              <div className="forum-empty">{translate('forum.threadDetail.selectPrompt')}</div>
            ) : (
              <div>
                <div className="forum-thread-view__header">
                  <h3 className="forum-thread-view__title">{selected.thread.title}</h3>
                  <div className="forum-thread-view__meta">
                    <span>{translate('forum.threadDetail.by', { author: selected.thread.author_name || anonymousLabel })}</span>
                    <span>•</span>
                    <span>{new Date(selected.thread.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {(selected.posts || []).length === 0 ? (
                  <div className="forum-empty">{translate('forum.threadDetail.noPosts')}</div>
                ) : (
                  <div className="forum-posts">
                    {selected.posts.map((post) => {
                      const statusKey = `forum.common.status.${post.status}`;
                      const statusLabel = translate(statusKey);
                      const statusText = statusLabel === statusKey ? post.status : statusLabel;
                      return (
                        <article key={post.id} className="forum-post">
                          <div className="forum-post__meta">
                            <span>{post.author_name || anonymousLabel}</span>
                            <span>•</span>
                            <span>{new Date(post.created_at).toLocaleString()}</span>
                            <span className="forum-post__badge">{statusText}</span>
                          </div>
                          <div className="forum-post__content" dangerouslySetInnerHTML={{ __html: post.safe_html }} />
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {selected && (
              <div className="forum-reply">
                <h3>{translate('forum.reply.title')}</h3>
                <textarea
                  className="forum-textarea"
                  placeholder={translate('forum.reply.placeholder')}
                  rows={4}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <div className="forum-compose__footer">
                  {!me && authChecked && (
                    <div className="forum-error">{translate('forum.reply.loginRequired')}</div>
                  )}
                  <button className="forum-btn forum-btn-primary" onClick={sendReply} disabled={!me || !replyContent.trim()}>
                    {translate('forum.reply.send')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
