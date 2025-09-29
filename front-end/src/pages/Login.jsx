import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import { API_BASE_URL } from '../config/api.js';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentLanguage } = useLanguage();
  const translate = (key, params) => t(key, currentLanguage, params);

  const doLogin = async (event) => {
    if (event) event.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error(await res.text());
      // Cookies set by server; redirect to Forum and reload to refresh auth state
      window.location.hash = 'forum';
      window.location.reload();
    } catch (e) {
      setError(e.message || translate('auth.login.error'));
    } finally { setLoading(false); }
  };

  return (
    <div className="card card-padded" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h2 className="title" style={{ fontSize: '1.6rem', marginTop: 0 }}>{translate('auth.login.title')}</h2>
      <p className="muted" style={{ marginTop: 8, marginBottom: 20 }}>{translate('auth.login.subtitle')}</p>
      <form className="form-grid" onSubmit={doLogin}>
        <div className="form-field form-field--full">
          <label className="form-label" htmlFor="login-username">{translate('auth.login.usernameLabel')}</label>
          <input
            id="login-username"
            className="input"
            placeholder={translate('auth.login.usernamePlaceholder')}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-field form-field--full">
          <label className="form-label" htmlFor="login-password">{translate('auth.login.passwordLabel')}</label>
          <input
            id="login-password"
            className="input"
            type="password"
            placeholder={translate('auth.login.passwordPlaceholder')}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <div className="form-field form-field--full">
            <div className="callout" style={{ color: 'var(--danger)' }}>{error}</div>
          </div>
        )}
        <div className="form-actions form-field--full">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !username || !password}
          >
            {loading ? translate('auth.login.submitting') : translate('auth.login.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
