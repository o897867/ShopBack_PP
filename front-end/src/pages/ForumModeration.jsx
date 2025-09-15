import React, { useEffect, useMemo, useState } from 'react';

const api = {
  listQueue: async (secret, { limit = 50, offset = 0 } = {}) => {
    const params = new URLSearchParams();
    params.set('limit', limit);
    params.set('offset', offset);
    const res = await fetch(`/api/forum/moderation/queue?${params.toString()}`, {
      headers: { 'X-Admin-Secret': secret }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  approve: async (secret, postId, reason, moderator_name) => {
    const res = await fetch(`/api/forum/moderation/posts/${postId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
      body: JSON.stringify({ reason, moderator_name })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  reject: async (secret, postId, reason, moderator_name) => {
    const res = await fetch(`/api/forum/moderation/posts/${postId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
      body: JSON.stringify({ reason, moderator_name })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

export default function ForumModeration() {
  const [secret, setSecret] = useState(() => localStorage.getItem('forum_mod_secret') || '');
  const [moderator, setModerator] = useState(() => localStorage.getItem('forum_mod_name') || '');
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reasons, setReasons] = useState({});

  const saveSecret = (v) => { setSecret(v); try { localStorage.setItem('forum_mod_secret', v); } catch {} };
  const saveModerator = (v) => { setModerator(v); try { localStorage.setItem('forum_mod_name', v); } catch {} };

  const refresh = async () => {
    setLoading(true); setError('');
    try {
      const data = await api.listQueue(secret, { limit: 100, offset: 0 });
      setPending(data || []);
    } catch (e) {
      setError(e.message || 'Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (secret) refresh(); }, [secret]);

  const doApprove = async (p) => {
    try {
      await api.approve(secret, p.id, reasons[p.id] || '', moderator || undefined);
      await refresh();
    } catch (e) { setError(e.message || 'Failed to approve'); }
  };

  const doReject = async (p) => {
    try {
      await api.reject(secret, p.id, reasons[p.id] || '', moderator || undefined);
      await refresh();
    } catch (e) { setError(e.message || 'Failed to reject'); }
  };

  return (
    <div>
      <div className="card card-padded" style={{ marginBottom: 16 }}>
        <h2 className="title" style={{ margin: 0 }}>Forum Moderation</h2>
        <p className="muted" style={{ marginTop: 4 }}>Provide your moderator secret to access the queue.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          <input className="input" type="password" placeholder="X-Admin-Secret" value={secret} onChange={(e) => saveSecret(e.target.value)} style={{ minWidth: 240 }} />
          <input className="input" placeholder="Moderator name (optional)" value={moderator} onChange={(e) => saveModerator(e.target.value)} style={{ minWidth: 200 }} />
          <button className="btn btn-secondary" onClick={refresh} disabled={!secret}>Refresh</button>
        </div>
        {error && <div className="muted" style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</div>}
      </div>

      <div className="card card-padded">
        <h3 className="subtitle">Pending Posts</h3>
        {loading ? (
          <div className="muted">Loading…</div>
        ) : pending.length === 0 ? (
          <div className="muted">No pending posts</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pending.map((p) => (
              <div key={p.id} className="post" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                <div className="muted" style={{ fontSize: 12 }}>{p.author_name || 'anonymous'} · {new Date(p.created_at).toLocaleString()} · {p.status}</div>
                <div className="post-content" dangerouslySetInnerHTML={{ __html: p.safe_html }} />
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    className="input"
                    placeholder="Reason (optional)"
                    value={reasons[p.id] || ''}
                    onChange={(e) => setReasons((r) => ({ ...r, [p.id]: e.target.value }))}
                    style={{ minWidth: 200 }}
                  />
                  <button className="btn btn-primary" onClick={() => doApprove(p)}>Approve</button>
                  <button className="btn btn-secondary" onClick={() => doReject(p)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
