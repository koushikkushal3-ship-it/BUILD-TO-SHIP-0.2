import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanSearch, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import AnimatedNumber from './AnimatedNumber.jsx';
import TypingDots from './TypingDots.jsx';

const CATEGORY_LABELS = {
  keywordMatch: 'Keyword Match',
  formatting: 'ATS Formatting',
  impact: 'Impact & Metrics',
  completeness: 'Completeness',
};

function scoreColor(score) {
  if (score >= 80) return 'text-panel-hr';
  if (score >= 60) return 'text-amber-400';
  return 'text-panel-skeptical';
}

function scoreBarColor(score) {
  if (score >= 80) return 'bg-panel-hr';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-panel-skeptical';
}

function ScoreBar({ label, score }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className={scoreColor(score)}>{score}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-charcoal-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${scoreBarColor(score)}`}
        />
      </div>
    </div>
  );
}

export default function AtsScoreCard({ resumeSummary, targetRole }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  async function checkScore() {
    setLoading(true);
    setError('');
    try {
      // Passing these explicitly lets this run from Profile Setup against
      // the in-progress form, before it's ever been saved — omitted (in
      // Settings) it falls back to the persisted profile server-side.
      const { data } = await apiClient.post('/profile/ats-score', { resumeSummary, targetRole });
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not analyze your resume');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ScanSearch size={18} className="text-amber-400" />
          <h2 className="font-display text-lg font-semibold text-slate-100">ATS Resume Checker</h2>
        </div>
        <button type="button" onClick={checkScore} disabled={loading} className="btn-secondary shrink-0">
          {loading ? (
            <span className="flex items-center gap-1.5">
              Analyzing <TypingDots dotClassName="bg-slate-100" />
            </span>
          ) : analysis ? (
            'Re-check'
          ) : (
            'Check ATS score'
          )}
        </button>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Scores how well your saved resume would survive automated ATS parsing and ranking for your target
        role, and exactly what to fix.
      </p>

      {error && <p className="mt-3 animate-shake text-sm font-medium text-red-600">{error}</p>}

      <AnimatePresence>
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <AnimatedNumber
                value={analysis.overallScore}
                className={`font-display text-4xl font-bold ${scoreColor(analysis.overallScore)}`}
              />
              <div>
                <p className="text-sm text-slate-300">Overall ATS score</p>
                <p className="text-xs text-slate-500">out of 100</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(analysis.categoryScores).map(([key, score]) => (
                <ScoreBar key={key} label={CATEGORY_LABELS[key] || key} score={score} />
              ))}
            </div>

            {analysis.matchedKeywords?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Keywords found
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.matchedKeywords.map((k) => (
                    <span key={k} className="rounded-full bg-panel-hr/10 px-2.5 py-0.5 text-xs text-panel-hr">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.missingKeywords?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Missing keywords for this role
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missingKeywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-panel-skeptical/10 px-2.5 py-0.5 text-xs text-panel-skeptical"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.improvements?.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-100">
                  <Lightbulb size={16} className="text-amber-400" /> How to improve your score
                </p>
                <div className="flex flex-col gap-2">
                  {analysis.improvements.map((imp, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-2 rounded-lg bg-charcoal-800 p-3"
                    >
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
                      <div>
                        <p className="text-sm text-slate-200">{imp.issue}</p>
                        <p className="mt-0.5 text-sm text-slate-400">{imp.suggestion}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {analysis.strengths?.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-100">What's already working</p>
                <ul className="flex flex-col gap-1.5">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-panel-hr" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
