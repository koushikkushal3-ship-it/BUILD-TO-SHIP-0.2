import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../lib/apiClient.js';
import KeyVaultForm from '../components/KeyVaultForm.jsx';
import Spinner from '../components/Spinner.jsx';
import ResumeUpload from '../components/ResumeUpload.jsx';
import AtsScoreCard from '../components/AtsScoreCard.jsx';

export default function Settings() {
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [resumeSummary, setResumeSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    // `finally` (not just `then`) so a rejected request still clears the
    // loading flag — otherwise an expired session, a cold-start timeout, or
    // any network blip leaves the page spinning forever with nothing shown.
    apiClient
      .get('/profile')
      .then(({ data }) => {
        setName(data.profile?.name || '');
        setTargetRole(data.profile?.target_role || '');
        setResumeSummary(data.profile?.resume_summary || '');
      })
      .catch((err) => {
        setLoadError(
          err.response?.data?.error ||
            (err.response
              ? 'Could not load your profile.'
              : 'Could not reach the server. Check your connection and try again.')
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaved(false);
    setSaveError('');
    try {
      await apiClient.put('/profile', { name, targetRole, resumeSummary });
      setSaved(true);
    } catch (err) {
      // Without this the button just goes quiet on failure — no "Saved."
      // and no reason, so the change looks like it silently didn't apply.
      setSaveError(
        err.response?.data?.error ||
          (err.response ? 'Could not save your profile.' : 'Could not reach the server.')
      );
    }
  }

  if (loading) return <Spinner />;

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-slate-100">Settings</h1>

      {loadError && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {loadError}
        </p>
      )}

      <form onSubmit={handleSave} className="card mt-6 flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold text-slate-100">Profile</h2>
        <input className="input-field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          className="input-field"
          placeholder="Target role"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
        />
        <ResumeUpload onExtracted={setResumeSummary} />
        <textarea
          rows={5}
          className="input-field resize-none"
          placeholder="Resume summary"
          value={resumeSummary}
          onChange={(e) => setResumeSummary(e.target.value)}
        />
        <button type="submit" className="btn-primary self-start">
          Save
        </button>
        {saveError && <p className="animate-shake text-sm font-medium text-red-400">{saveError}</p>}
        <AnimatePresence>
          {saved && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-amber-400"
            >
              Saved.
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      <div className="mt-6">
        <AtsScoreCard resumeSummary={resumeSummary} targetRole={targetRole} />
      </div>

      <div className="mt-6">
        <KeyVaultForm />
      </div>
    </main>
  );
}
