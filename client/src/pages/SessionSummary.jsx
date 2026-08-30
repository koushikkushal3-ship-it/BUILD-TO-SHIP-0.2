import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import Spinner from '../components/Spinner.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import Confetti from '../components/Confetti.jsx';

const CELEBRATION_THRESHOLD = 80;

function calibrationLabel(gap) {
  if (gap > 15) return { text: 'You tend to be over-confident', color: 'text-panel-skeptical' };
  if (gap < -15) return { text: 'You tend to under-sell yourself', color: 'text-panel-hr' };
  return { text: 'Your confidence is well-calibrated', color: 'text-amber-400' };
}

export default function SessionSummary() {
  const { sessionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    apiClient.get(`/sessions/${sessionId}`).then(({ data }) => {
      // `session_summaries.session_id` is a unique FK, so Supabase embeds it
      // as a single object, not an array.
      setSummary(data.session.session_summaries);
      setResources(data.resources || []);
      setLoading(false);
    });
  }, [sessionId]);

  if (loading) return <Spinner label="Loading summary…" />;
  if (!summary) return <div className="p-10 text-center text-slate-400">Summary not available yet.</div>;

  const calibration = calibrationLabel(summary.calibration_gap);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      {summary.overall_score >= CELEBRATION_THRESHOLD && <Confetti />}
      <h1 className="font-display text-2xl font-semibold text-slate-100">Session results</h1>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-interactive text-center"
        >
          <p className="text-sm text-slate-400">Overall score</p>
          <AnimatedNumber value={summary.overall_score} className="font-display text-4xl font-bold text-amber-400" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card-interactive text-center"
        >
          <p className="text-sm text-slate-400">Confidence calibration</p>
          <p className={`mt-2 text-sm font-semibold ${calibration.color}`}>{calibration.text}</p>
        </motion.div>
      </div>

      {summary.top_weaknesses?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card mt-6"
        >
          <h2 className="font-display text-lg font-semibold text-slate-100">Recurring weaknesses</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {summary.top_weaknesses.map(({ issue, count }) => (
              <li key={issue} className="flex justify-between text-sm text-slate-300">
                <span>{issue}</span>
                <span className="text-slate-500">×{count}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {resources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card mt-6"
        >
          <h2 className="font-display text-lg font-semibold text-slate-100">Recommended for you</h2>
          <p className="mt-1 text-sm text-slate-500">Real videos matched to what you got wrong this session.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {resources.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-lg border border-charcoal-700 bg-charcoal-800 p-3 transition hover:-translate-y-0.5 hover:border-amber-500/50 hover:shadow-lg"
              >
                {r.thumbnail_url && <img src={r.thumbnail_url} alt="" className="h-12 w-20 rounded object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200">{r.title}</p>
                  <span className="text-xs uppercase tracking-wide text-slate-500">{r.skill_tag}</span>
                </div>
                <ExternalLink size={14} className="shrink-0 text-slate-500" />
              </a>
            ))}
          </div>
        </motion.div>
      )}

      <div className="mt-8 flex justify-center">
        <Link to="/dashboard" className="btn-primary">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
