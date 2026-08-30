import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '../lib/apiClient.js';
import Spinner from '../components/Spinner.jsx';
import ResumeUpload from '../components/ResumeUpload.jsx';
import TypingDots from '../components/TypingDots.jsx';
import AtsScoreCard from '../components/AtsScoreCard.jsx';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [resumeSummary, setResumeSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get('/profile')
      .then(({ data }) => {
        setName(data.profile?.name || '');
        setTargetRole(data.profile?.target_role || '');
        setResumeSummary(data.profile?.resume_summary || '');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.put('/profile', { name, targetRole, resumeSummary });
      const { data } = await apiClient.post('/sessions');
      navigate(`/sessions/${data.session.id}/live`, { state: { firstQuestion: data.question } });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-2xl font-semibold text-slate-100"
      >
        Set up your profile
      </motion.h1>
      <p className="mt-2 text-slate-400">
        This tells the panel who they're interviewing and what role to target questions at.
      </p>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSave}
        className="mt-8 flex flex-col gap-5"
      >
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">Your name</label>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-slate-300">Target role *</label>
          <input
            required
            className="input-field"
            placeholder="e.g. Frontend Engineer Intern"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-slate-300">Resume</label>
          <ResumeUpload onExtracted={setResumeSummary} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-slate-300">
            Resume summary <span className="text-slate-500">(auto-filled from upload, or edit/paste directly)</span>
          </label>
          <textarea
            rows={6}
            className="input-field resize-none"
            placeholder="Paste a short summary of your background, skills, and projects…"
            value={resumeSummary}
            onChange={(e) => setResumeSummary(e.target.value)}
          />
        </div>

        <AtsScoreCard resumeSummary={resumeSummary} targetRole={targetRole} />

        {error && <p className="animate-shake text-sm font-medium text-red-600">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? (
            <span className="flex items-center gap-1.5">
              Starting session
              <TypingDots />
            </span>
          ) : (
            'Start interview session'
          )}
        </button>
      </motion.form>
    </main>
  );
}
