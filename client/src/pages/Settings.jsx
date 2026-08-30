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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiClient.get('/profile').then(({ data }) => {
      setName(data.profile?.name || '');
      setTargetRole(data.profile?.target_role || '');
      setResumeSummary(data.profile?.resume_summary || '');
      setLoading(false);
    });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaved(false);
    await apiClient.put('/profile', { name, targetRole, resumeSummary });
    setSaved(true);
  }

  if (loading) return <Spinner />;

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-slate-100">Settings</h1>

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
