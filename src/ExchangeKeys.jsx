import { useEffect, useState } from 'react';
import * as api from './client';

const EXCHANGE_LABELS = { blofin: 'BloFin' };

export default function ExchangeKeys() {
  const [keys, setKeys] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function loadKeys() {
    api.listExchangeKeys()
      .then(({ ok, body }) => {
        if (ok) setKeys(body.keys);
        else setError(body.error || 'Could not load your exchange keys.');
      })
      .catch(() => setError('Could not reach the server. Please refresh and try again.'));
  }

  useEffect(() => { loadKeys(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { ok, body } = await api.saveExchangeKey({
        exchange: 'blofin', apiKey, apiSecret, passphrase, label: label || undefined,
      });
      if (ok) {
        setApiKey(''); setApiSecret(''); setPassphrase(''); setLabel('');
        setShowForm(false);
        loadKeys();
      } else {
        setError(body.error || 'Something went wrong.');
      }
    } catch (err) {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(exchange) {
    if (!confirm(`Remove your ${EXCHANGE_LABELS[exchange] || exchange} API key? Any real-mode bots using it will stop working.`)) return;
    const { ok } = await api.deleteExchangeKey(exchange);
    if (ok) loadKeys();
  }

  const hasBlofin = keys?.some((k) => k.exchange === 'blofin');

  return (
    <div className="exchange-keys-section">
      <div className="dashboard-head">
        <h2>Exchange API keys</h2>
        {!showForm && !hasBlofin && (
          <button className="btn-primary btn-inline" onClick={() => setShowForm(true)}>
            + Add BloFin key
          </button>
        )}
      </div>

      <div className="form-note">
        When creating your API key on BloFin, enable <b>Trade</b> permission only --
        never enable Withdraw. This key can place orders on your behalf but should
        never be able to move your funds out of your account.
      </div>

      {error && <div className="auth-error">{error}</div>}

      {keys === null && <p className="muted-text">Loading...</p>}

      {keys?.length > 0 && (
        <div className="key-list">
          {keys.map((k) => (
            <div key={k.id} className="key-card">
              <div>
                <span className="key-exchange">{EXCHANGE_LABELS[k.exchange] || k.exchange}</span>
                {k.label && <span className="key-label"> -- {k.label}</span>}
              </div>
              <button className="btn-ghost danger" onClick={() => handleDelete(k.exchange)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {keys?.length === 0 && !showForm && (
        <p className="muted-text">No exchange keys saved yet. Add one to enable real trading.</p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="create-bot-form">
          <div className="field">
            <label htmlFor="apiKey">API Key</label>
            <input id="apiKey" type="text" required value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="apiSecret">API Secret</label>
            <input id="apiSecret" type="password" required value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="passphrase">Passphrase</label>
            <input id="passphrase" type="password" required value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="label">Label (optional)</label>
            <input id="label" type="text" placeholder="Main account" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save key'}</button>
          </div>
        </form>
      )}
    </div>
  );
}
