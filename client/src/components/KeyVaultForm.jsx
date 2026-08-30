import { useEffect, useState } from 'react';
import { KeyRound, Trash2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';

const PROVIDERS = ['gemini', 'openai', 'anthropic'];

export default function KeyVaultForm() {
  const [keys, setKeys] = useState([]);
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function refresh() {
    apiClient.get('/keys').then(({ data }) => {
      setKeys(data.keys);
      setLoading(false);
    });
  }

  useEffect(refresh, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/keys', { provider, apiKey });
      setApiKey('');
      refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save key');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await apiClient.delete(`/keys/${id}`);
    refresh();
  }

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

      {!loading && (
        <ul className="mt-4 flex flex-col gap-2">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center justify-between rounded-lg bg-charcoal-800 px-3 py-2">
              <span className="text-sm text-slate-300">
                {k.provider} — ••••{k.key_preview}
              </span>
              <button onClick={() => handleDelete(k.id)} className="text-slate-500 hover:text-red-400">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
          {keys.length === 0 && <p className="text-sm text-slate-500">No keys saved — using the platform default.</p>}
        </ul>
      )}

      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <select value={provider} onChange={(e) => setProvider(e.target.value)} className="input-field w-32">
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          type="password"
          required
          placeholder="Paste API key…"
          className="input-field flex-1"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
      {error && <p className="mt-2 animate-shake text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
