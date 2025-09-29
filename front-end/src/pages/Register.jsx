import React, { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('trader');
  const [brokers, setBrokers] = useState([]);
  const [brokerId, setBrokerId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { currentLanguage } = useLanguage();
  const translate = (key, params) => t(key, currentLanguage, params);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/cfd/brokers');
        if (res.ok) {
          const data = await res.json();
          setBrokers(data);
          if (data.length) setBrokerId(String(data[0].id));
        }
      } catch {}
    };
    load();
  }, []);

  const doRegister = async (event) => {
    if (event) event.preventDefault();
    setLoading(true); setError(''); setSuccess(false);
    try {
        const res = await fetch('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, role, broker_id: Number(brokerId) })
        });
      if (!res.ok) throw new Error(await res.text());
      setSuccess(true);
    } catch (e) {
      setError(e.message || translate('auth.register.error'));
    } finally { setLoading(false); }
  };

  return (
    <div className="card card-padded" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h2 className="title" style={{ fontSize: '1.6rem', marginTop: 0 }}>{translate('auth.register.title')}</h2>
      <p className="muted" style={{ marginTop: 8, marginBottom: 24 }}>{translate('auth.register.subtitle')}</p>
      <form className="form-grid form-grid--two-column" onSubmit={doRegister}>
        <div className="form-field form-field--full">
          <label className="form-label" htmlFor="register-username">{translate('auth.register.usernameLabel')}</label>
          <input
            id="register-username"
            className="input"
            placeholder={translate('auth.register.usernamePlaceholder')}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-field form-field--full">
          <label className="form-label" htmlFor="register-password">{translate('auth.register.passwordLabel')}</label>
          <input
            id="register-password"
            className="input"
            type="password"
            placeholder={translate('auth.register.passwordPlaceholder')}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="register-role">{translate('auth.register.roleLabel')}</label>
          <select
            id="register-role"
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="trader">{translate('auth.register.roles.trader')}</option>
            <option value="agent">{translate('auth.register.roles.agent')}</option>
          </select>
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="register-broker">{translate('auth.register.brokerLabel')}</label>
          <select
            id="register-broker"
            className="input"
            value={brokerId}
            onChange={(e) => setBrokerId(e.target.value)}
          >
            {brokers.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        {error && (
          <div className="form-field form-field--full">
            <div className="callout" style={{ color: 'var(--danger)' }}>{error}</div>
          </div>
        )}
        {success && (
          <div className="form-field form-field--full">
            <div className="callout" style={{ color: 'var(--success)' }}>{translate('auth.register.success')}</div>
          </div>
        )}
        <div className="form-actions form-field--full">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !username || !password || !brokerId}
          >
            {loading ? translate('auth.register.submitting') : translate('auth.register.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
