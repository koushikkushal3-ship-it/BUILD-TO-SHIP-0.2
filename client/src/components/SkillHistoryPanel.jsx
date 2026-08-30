import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { X, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import Spinner from './Spinner.jsx';

export default function SkillHistoryPanel({ skillTag, onClose }) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setHistory(null);
    apiClient.get('/practice/skill-radar/history', { params: { skillTag } }).then(({ data }) => {
      if (!cancelled) setHistory(data.history);
    });
    return () => {
      cancelled = true;
    };
  }, [skillTag]);

  const chartData = (history || []).map((h, i) => ({ label: `#${i + 1}`, score: h.score }));
  const missed = (history || []).filter((h) => h.missed);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="card max-h-[80vh] w-full max-w-lg overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-slate-100">{skillTag}</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
              <X size={18} />
            </button>
          </div>

          {history === null && <Spinner label="Loading history…" />}

          {history !== null && history.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">
              No answered questions tagged with this skill yet — it shows up once you answer one in a
              session.
            </p>
          )}

          {history !== null && history.length > 0 && (
            <>
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#33363f" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#1a1c22', border: '1px solid #33363f', fontSize: 12 }} />
                    <Line type="monotone" dataKey="score" stroke="#e8a628" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {missed.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Specific missed questions
                  </h3>
                  <div className="flex flex-col gap-2">
                    {missed.map((m) => (
                      <div
                        key={m.questionId}
                        className="flex items-start gap-2 rounded-lg border border-panel-skeptical/30 bg-panel-skeptical/5 p-2.5 text-sm text-slate-300"
                      >
                        <AlertCircle size={14} className="mt-0.5 shrink-0 text-panel-skeptical" />
                        <span>{m.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
