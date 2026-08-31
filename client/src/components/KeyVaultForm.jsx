import { useEffect, useState } from 'react';
import { KeyRound, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';

const PROVIDER_INFO = {
  gemini: {
    label: 'Google Gemini',
    url: 'https://aistudio.google.com/apikey',
    linkLabel: 'Get a free key from Google AI Studio',
    placeholder: 'AIzaSy… or AQ.Ab8…',
  },
  openai: {
    label: 'OpenAI',
    url: 'https://platform.openai.com/api-keys',
    linkLabel: 'Get a key from the OpenAI dashboard',
    placeholder: 'sk-…',
  },
  anthropic: {
    label: 'Anthropic (Claude)',
    url: 'https://console.anthropic.com/settings/keys',
    linkLabel: 'Get a key from the Anthropic Console',
    placeholder: 'sk-ant-…',
  },
};
const PROVIDERS = Object.keys(PROVIDER_INFO);

export default function KeyVaultForm() {
  const [keys, setKeys] = useState([]);
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function refresh() {
    // See Settings.jsx — `finally` so a failed load can't strand this in a
    // permanent loading state with no visible reason.
    apiClient
      .get('/keys')
      .then(({ data }) => setKeys(data.keys))
      .catch((err) =>
        setError(
          err.response?.data?.error ||
            (err.response ? 'Could not load your saved keys.' : 'Could not reach the server.')
        )
      )
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/keys', { provider, apiKey });
      setApiKey('');
      setShowKey(false);
      refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save key');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await apiClient.delete(`/keys/${id}`);
      refresh();
    } catch (err) {
      // Otherwise a failed delete looks like nothing happened at all.
      setError(err.response?.data?.error || 'Could not delete that key.');
    }
  }

  const info = PROVIDER_INFO[provider];

  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <KeyRound size={18} className="text-amber-400" />
        <h2 className="font-display text-lg font-semibold text-slate-100">Your API keys (BYOK)</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Bring your own Gemini/OpenAI/Anthropic key. It's encrypted at rest (AES-256-GCM) — we only ever
        show you the last 4 characters again, never the full key.
      </p>

      {!loading && keys.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center justify-between rounded-lg bg-charcoal-800 px-3 py-2">
              <span className="text-sm text-slate-300">
                {PROVIDER_INFO[k.provider]?.label || k.provider} — ••••{k.key_preview}
              </span>
              <button onClick={() => handleDelete(k.id)} className="text-slate-500 hover:text-red-400">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {!loading && keys.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">No keys saved yet — using the platform default.</p>
      )}

      <form onSubmit={handleAdd} className="mt-5 rounded-xl border border-charcoal-600 bg-charcoal-800/50 p-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-300">Provider</label>
        <select
          value={provider}
          onChange={(e) => {
            setProvider(e.target.value);
            setError('');
          }}
          className="input-field"
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {PROVIDER_INFO[p].label}
            </option>
          ))}
        </select>

        <a
          href={info.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center gap-1 text-xs text-amber-400 hover:underline"
        >
          {info.linkLabel} <ExternalLink size={12} />
        </a>

        <label className="mb-1.5 mt-4 block text-sm font-medium text-slate-300">API key</label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            required
            placeholder={info.placeholder}
            className="input-field pr-11 font-mono text-sm"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            aria-label={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Paste the key exactly as copied — never share this key anywhere else.
        </p>

        <button type="submit" disabled={saving} className="btn-primary mt-4 w-full">
          {saving ? 'Saving…' : 'Save key'}
        </button>
      </form>
      {error && <p className="mt-2 animate-shake text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
