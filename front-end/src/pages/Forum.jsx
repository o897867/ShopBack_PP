import React, { useEffect, useState } from 'react';

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

  const refreshThreads = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listThreads({ limit: 20, offset: 0 });
      setThreads(data || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshThreads(); }, []);

  const openThread = async (id) => {
    setError('');
    try {
      const data = await api.getThread(id, { page: 1, page_size: 50 });
      setSelected(data);
      setReplyContent('');
    } catch (e) { setError(e.message || 'Failed to load thread'); }
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
      setError(e.message || 'Failed to create thread');
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
      setError(e.message || 'Failed to reply');
    }
  };

  // MVP: plain textarea editor to avoid peer-deps issues

  return (
    <div>
      <div className="card card-padded" style={{ marginBottom: 16 }}>
        <h2 className="title" style={{ margin: 0 }}>Forum</h2>
        <p className="muted" style={{ marginTop: 6 }}>支持基础格式（粗体、斜体、列表、引用、链接）。图片上传暂未开放，发帖可能进入审核队列。</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            style={{ minWidth: 200 }}
          />
          <button className="btn btn-secondary" onClick={refreshThreads}>Refresh</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div>
          <div className="card card-padded" style={{ marginBottom: 16 }}>
            <h3 className="subtitle">New Thread</h3>
            <div className="input-row">
              <input
                className="input"
                placeholder="标题（最多 120 字）"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, titleLimit))}
                maxLength={titleLimit}
              />
              <span className="counter">{title.length}/{titleLimit}</span>
            </div>
            <textarea
              className="input"
              placeholder="内容（支持基础 HTML；图片禁用）"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, contentLimit))}
              rows={6}
              style={{ marginTop: 8 }}
            />
            <div className="input-row" style={{ marginTop: 6 }}>
              <span className="input-hint">提示：请文明发言，含敏感词或异常链接的内容将进入审核。</span>
              <span className="counter">{content.length}/{contentLimit}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-primary" onClick={createThread} disabled={creating || !title.trim() || !content.trim()}>
                {creating ? 'Creating…' : 'Create Thread'}
              </button>
            </div>
          </div>

          <div className="card card-padded">
            <h3 className="subtitle" style={{ marginBottom: 8 }}>Threads</h3>
            {loading ? (
              <div className="muted">Loading…</div>
            ) : error ? (
              <div className="muted" style={{ color: 'var(--danger)' }}>{error}</div>
            ) : threads.length === 0 ? (
              <div className="callout">暂无主题，快来发布第一条帖子吧！</div>
            ) : (
              <ul className="list">
                {threads.map(t => (
                  <li key={t.id} className={`list-item ${selected?.thread?.id === t.id ? 'active' : ''}`} onClick={() => openThread(t.id)}>
                    <div className="input-row" style={{ alignItems: 'baseline' }}>
                      <div className="title" style={{ fontSize: '1rem' }}>{t.title}</div>
                      <span className="badge published">thread</span>
                    </div>
                    <div className="thread-meta">
                      <span>by {t.author_name || 'anonymous'}</span>
                      <span>·</span>
                      <span>{new Date(t.created_at).toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <div className="card card-padded" style={{ minHeight: 300 }}>
            {!selected ? (
              <div className="muted">Select a thread to view posts</div>
            ) : (
              <div>
                <h3 className="title" style={{ marginTop: 0 }}>{selected.thread.title}</h3>
                <div className="muted" style={{ marginBottom: 12 }}>by {selected.thread.author_name || 'anonymous'}</div>
                <div className="divider" />
                {(selected.posts || []).length === 0 ? (
                  <div className="callout">该主题暂无可见帖子。若你刚刚创建了主题，首帖可能在审核中。</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selected.posts.map(p => (
                      <div key={p.id} className="post">
                        <div className="thread-meta">
                          <span>{p.author_name || 'anonymous'}</span>
                          <span>·</span>
                          <span>{new Date(p.created_at).toLocaleString()}</span>
                          <span>·</span>
                          <span className={`badge ${p.status === 'pending' ? 'pending' : 'published'}`}>{p.status}</span>
                        </div>
                        <div className="post-content" dangerouslySetInnerHTML={{ __html: p.safe_html }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {selected && (
            <div className="card card-padded" style={{ marginTop: 16 }}>
              <h3 className="subtitle">Reply</h3>
              <textarea
                className="input"
                placeholder="回复内容（支持基础 HTML；图片禁用）"
                rows={4}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
              <div style={{ marginTop: 8 }}>
                <button className="btn btn-primary" onClick={sendReply} disabled={!replyContent.trim()}>Send Reply</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
