import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import ScoreTrendChart from '../components/ScoreTrendChart.jsx';
import WeaknessRadarChart from '../components/WeaknessRadarChart.jsx';
import Spinner from '../components/Spinner.jsx';

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    apiClient.get('/sessions').then(({ data }) => {
      setSessions(data.sessions);
      setLoading(false);
    });
  }, []);

  const completed = sessions.filter((s) => s.status === 'completed');

  const trendData = useMemo(
    () =>
      [...completed]
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map((s, i) => ({ label: `#${i + 1}`, score: s.overall_score })),
    [completed]
  );

  const radarData = useMemo(() => {
    const tally = {};
    // `session_summaries.session_id` is a unique FK, so Supabase embeds it as
    // a single object, not an array.
    for (const s of completed) {
      for (const { issue, count } of s.session_summaries?.top_weaknesses || []) {
        tally[issue] = (tally[issue] || 0) + count;
      }
    }
    return Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([issue, count]) => ({ issue, count }));
  }, [completed]);

  const filtered = sessions.filter((s) => {
    const matchesQuery = s.target_role.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  if (loading) return <Spinner label="Loading dashboard…" />;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-100">Dashboard</h1>
        <Link to="/profile-setup" className="btn-primary">
          New session
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card-interactive">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">
            Score trend
          </h2>
          <ScoreTrendChart data={trendData} />
        </div>
        <div className="card-interactive">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">
            Weakness fingerprint
          </h2>
          <WeaknessRadarChart data={radarData} />
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <input
          className="input-field flex-1"
          placeholder="Search by target role…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="input-field w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="active">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-slate-500">
            <Inbox size={28} />
            <p className="text-sm">No sessions yet — start one above.</p>
          </div>
        )}
        {filtered.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Link
              to={s.status === 'completed' ? `/sessions/${s.id}/summary` : `/sessions/${s.id}/live`}
              className="card-interactive flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-slate-100">{s.target_role}</p>
                <p className="text-xs text-slate-500">{new Date(s.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                {s.status === 'completed' && (
                  <span className="font-display text-lg font-bold text-amber-400">{s.overall_score}</span>
                )}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs ${
                    s.status === 'completed' ? 'bg-charcoal-800 text-slate-400' : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {s.status === 'completed' ? 'Completed' : 'In progress'}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
